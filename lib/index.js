var async = require('async')
  , EventEmitter = require('events').EventEmitter
  , fs = require('fs')
  , find = require('findit')
  , gitlog = require('gitlog')
  , path = require('path')
  , _ = require('underscore')
  , configLocation = path.join(__dirname, '../config.json')
  , logOptions = {}
  , commits = []
  , gitme = new EventEmitter()

require('colors')

module.exports = gitme

/**
 * Gets the git log for a repository
 *
 * @param {String} path to the repo
 * @param {Function} callback
 * @api private
 */
function getRepoLog(repoPath, callback) {
  gitlog(
    { repo: repoPath
    , number: logOptions.number
    , author: '`git config --get user.name`'
    , fields:
      [ 'abbrevHash'
      , 'authorDate'
      , 'authorDateRel'
      , 'subject'
      ]
  }, function(error, repoCommits) {

    // Add repo property to commit
    repoCommits.map(function(commit) {
      commit.repo = path.basename(repoPath)
    })

    commits = commits.concat(repoCommits)
    callback()
  })
}

/**
 * Sorts the commits by date using _.sortBy()
 *
 * @api private
 */
function sortCommits(logOptions) {
  commits = _.sortBy(commits, function(commit) {
    return new Date(commit.authorDate).getTime()
  })
  commits = _.last(commits, logOptions.number)
}

/**
 * Outputs the commits to the console.
 *
 * @api private
 */
function outputCommits() {
  var colourMap = [ 'blue', 'cyan', 'green', 'magenta', 'red', 'yellow' ]
    , repoColours = {}
    , index = 0

  commits = commits || []

  commits.forEach(function(commit) {
    if (!repoColours[commit.repo]) {
      repoColours[commit.repo] = colourMap[index]
      index += 1

      if (index === colourMap.length) {
        index = 0
      }
    }

    var output = commit.repo + ' ' + commit.abbrevHash + ' '
    output += commit.authorDate + ' (' + commit.authorDateRel + ') ' + commit.subject

    console.log((logOptions.colour === 'true') ? output[repoColours[commit.repo]] : output)
  })
}

/**
 * Requires the JSON config file. Wrapped in a try..catch block to be tolerant
 * of no config file existing.
 *
 * @return {Object} the config file
 * @api private
 */
function getRepos() {
  try {
    return require(configLocation)
  } catch (e) {
    return null
  }
}

/**
 * Writes the config file JSON to the config location.
 *
 * @param {Object} file contents
 * @param {Function} callback(error)
 * @api private
 */
function writeFile(fileContents, callback) {
  fs.writeFile(configLocation, JSON.stringify(fileContents), callback)
}

/**
 * Gets commits for repos in the config, sorts the commits by date, then
 * outputs them.
 *
 * @param {Object} options
 * @param {Function} callback(error)
 * @api public
 */
gitme.getCommits = function(options, callback) {
  logOptions = options

  var config = getRepos()
  if (!config) {
    return callback(new Error('No git repos in config: add using `gitme add [repo-location]`'))
  }

  async.forEach(config.repos, getRepoLog, function() {
    sortCommits(logOptions)
    outputCommits()
  })
}

/**
 * Adds a repo to the config.
 *
 * @param {String} repo
 * @param {Function} callback(error, success)
 * @api public
 */
gitme.addRepo = function(repo, callback) {

  var configJson = getRepos() || { repos: [] }
    , searchPath = (typeof repo === 'boolean' || repo.length === 0) ? process.cwd() : repo

  getFolders(searchPath, function (childFolders) {
    if (childFolders.length === 0)
      return callback(new Error('You must provide a git repo'), null)
    configJson.repos.push(childFolders)
    configJson.repos = _.flatten(configJson.repos)
    configJson.repos = _.uniq(configJson.repos)
    writeConfig(configJson, callback)
  })

}

/**
 * Returns an array of a directory's child folders
 *
 * @param {String} directory path
 * @param {Function} callback
 * @api private
 */
function getFolders(directory, callback) {

  if(typeof directory === 'undefined'
    || directory.length === 0) return callback(new Error('You must provide a git repo'), null)

  var finder = find(directory, {})
    , childFolders = []

  finder.on('directory', function (dir) {
    var base = path.basename(dir)
    if (base === '.git') {
      base = dir.substring(0, dir.length - 5)
      gitme.emit('add', 'Added ' + path.basename(base).yellow)
      childFolders.push(base)
    }
  })
  finder.on('end', function () {
    callback(childFolders)
  })
}

/**
 * Writes configJson to file
 *
 * @param {Object} configJson object
 * @param {Function} callback
 * @api private
 */
function writeConfig(configJson, callback) {
  writeFile(configJson, function(error) {
    if (!error) {
      callback(null, 'Repos successfully added!'.green)
    } else {
      return callback(error)
    }
  })
}

/**
 * Removes a repo from the config.
 *
 * @param {String} repo
 * @param {Function} callback(error, sucess)
 * @api public
 */
gitme.removeRepo = function(repo, callback) {
  var data = getRepos()

  if (!data || data.repos.length === 0) {
    return callback(new Error('Config file doesnt exist'), null)
  }

  if (data.repos.indexOf(repo) > -1) {
    data.repos.splice(data.repos.indexOf(repo), 1)
    writeFile(data, function(error) {
      if (!error) {
        callback(null, 'Repo successfully deleted!'.green)
      }
    })
  } else {
    callback(new Error('Repo doesnt exist in config'), null)
  }
}

/**
 * List all the repos in the config. Returns a blank array if there is no
 * config file.
 *
 * @return {Array}
 * @api public
 */
gitme.listRepos = function() {
  var config = getRepos()

  return config ? config.repos : []
}
