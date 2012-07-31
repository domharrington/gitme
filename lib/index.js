var async = require('async')
  , colours = require('colors')
  , path = require('path')
  , _ = require('underscore')
  , fs = require('fs')
  , configLocation = path.join(__dirname, '../config.json')
  , logOptions = {}
  , gitlog = require('gitlog')
  , commits = [];

/**
 * Gets the git log for a repository
 *
 * @param {String} path to the repo
 * @param {Function} callback
 * @api private
 */
function getRepoLog(repoPath, callback) {
  gitlog({
    repo: repoPath,
    number: logOptions.number,
    author: '`git config --get user.name`',
    fields: [
      'abbrevHash',
      'authorDate',
      'authorDateRel',
      'subject'
    ]
  }, function(error, repoCommits) {

    // Add repo property to commit
    repoCommits.map(function(commit) {
      commit.repo = path.basename(repoPath);
    });

    commits = commits.concat(repoCommits);
    callback();
  });
}

/**
 * Sorts the commits by date using _.sortBy()
 *
 * @api private
 */
function sortCommits() {
  commits = _.sortBy(commits, function(commit) {
    return new Date(commit.authorDate).getTime();
  });
}

/**
 * Outputs the commits to the console.
 *
 * @api private
 */
function outputCommits() {
  var colours = ['blue', 'cyan', 'green', 'magenta', 'red', 'yellow']
    , repoColours = {}
    , index = 0;

  commits.forEach(function(commit) {
    if (!repoColours[commit.repo]) {
      repoColours[commit.repo] = colours[index];
      index += 1;

      if (index === colours.length) {
        index = 0;
      }
    }

    var output = commit.repo + ' ' + commit.abbrevHash + ' ' + commit.authorDate + ' (' + commit.authorDateRel + ') ' + commit.subject;
    console.log(output[repoColours[commit.repo]]);
  });
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
    return require(configLocation);
  } catch(e) {
    return null;
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
  fs.writeFile(configLocation, JSON.stringify(fileContents), callback);
}

/**
 * Gets commits for repos in the config, sorts the commits by date, then
 * outputs them.
 *
 * @param {Object} options
 * @param {Function} callback(error)
 * @api public
 */
module.exports.getCommits = function(options, callback) {
  logOptions = options;

  var config = getRepos();
  if (!config) {
    return callback(new Error('No git repos in config: add using `gitme add [repo-location]`'));
  }

  async.forEach(config.repos, getRepoLog, function() {
    sortCommits();
    outputCommits();
  });
};

/**
 * Adds a repo to the config.
 *
 * @param {String} repo
 * @param {Function} callback(error, success)
 * @api public
 */
module.exports.addRepo = function(repo, callback) {
  if (typeof repo === 'boolean' || repo.length === 0) {
    return callback(new Error('You must provide a git repo'), null);
  }

  var configJson = getRepos() || {
    repos: []
  };

  if (configJson.repos.indexOf(repo) > -1) {
    return callback(new Error('Repo already added!'), null);
  }

  configJson.repos.push(repo);

  writeFile(configJson, function(error) {
    if (!error) {
      callback(null, 'Repo successfully added!');
    } else {
      return callback(error);
    }
  });
};

/**
 * Removes a repo from the config.
 *
 * @param {String} repo
 * @param {Function} callback(error, sucess)
 * @api public
 */
module.exports.removeRepo = function(repo, callback) {
  var data = getRepos();

  if (!data || data.repos.length === 0) {
    return callback(new Error('Config file doesnt exist'), null);
  }

  if (data.repos.indexOf(repo) > -1) {
    data.repos.splice(data.repos.indexOf(repo), 1);
    writeFile(data, function(error) {
      if (!error) {
        callback(null, 'Repo successfully deleted!');
      }
    });
  } else {
    callback(new Error('Repo doesnt exist in config'), null);
  }
};

/**
 * List all the repos in the config. Returns a blank array if there is no
 * config file.
 *
 * @return {Array}
 * @api public
 */
module.exports.listRepos = function() {
  var config = getRepos();

  return config ? config.repos : [];
};