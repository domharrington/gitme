var async = require('async')
  , colours = require('colors')
  , path = require('path')
  , _ = require('underscore')
  , fs = require('fs')
  , configLocation = path.join(__dirname, '../config.json')
  , logOptions = {}
  , gitlog = require('gitlog')
  , commits = [];

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

function sortCommits() {
  commits = _.sortBy(commits, function(commit) {
    return new Date(commit.date).getTime();
  });
}

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

function getRepos() {
  try {
    return require(configLocation);
  } catch(e) {
    return null;
  }
}

function writeFile(fileContents, callback) {
  fs.writeFile(configLocation, JSON.stringify(fileContents), function(error) {
    callback(error);
  });
}

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

module.exports.listRepos = function() {
  var config = getRepos();

  return config ? config.repos : [];
};