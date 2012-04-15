var exec = require('child_process').exec
  , async = require('async')
  , colours = require('colors')
  , path = require('path')
  , _ = require('underscore')
  , fs = require('fs')
  , configLocation = path.join(__dirname, '../config.json')
  , logOptions = {}
  , commits = [];

function getRepoLog(repoPath, callback) {
  var numberOfCommits;
  if (logOptions.number) {
    numberOfCommits = logOptions.number;
  }

  exec('cd ' + repoPath + ' && git log -n ' + numberOfCommits + ' --author="`git config --get user.name`" --pretty="%h|%ai|(%ar)|%s"', function(error, stdout, stderr) {
    // Splitting stdout by new line character
    var repoCommits = stdout.split('\n');

    repoCommits = _.compact(repoCommits.map(function(commit) {
      // Splitting each commit by pipe character
      if (commit) {
        commit = commit.split('|');

        commit = {
          repo: path.basename(repoPath),
          hash: commit[0],
          date: commit[1],
          relativeDate: commit[2],
          message: commit[3]
        };

        return commit;
      }
    }));

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

    var output = commit.repo + ' ' + commit.hash + ' ' + commit.date + ' ' + commit.relativeDate + ' ' + commit.message;
    console.log(output[repoColours[commit.repo]]);
  });
}

function getRepos(callback) {
  fs.readFile(configLocation, 'utf-8', function(error, data) {
    if (data) {
      data = JSON.parse(data);
    }
    callback(error, data);
  });
}

function writeFile(fileContents, callback) {
  fs.writeFile(configLocation, JSON.stringify(fileContents), function(error) {
    callback(error);
  });
}

module.exports.getCommits = function(options) {
  logOptions = options;

  async.waterfall([
    function(callback) {
      getRepos(callback);
    },
    function(config, callback) {
      async.forEach(config.repos, getRepoLog, function() {
        sortCommits();
        outputCommits();
      });
    }
  ],
  function(error) {
    if (error && error.code === 'ENOENT') {
      console.error('No git repos in config: add using `gitme add [repo-location]`');
    }
  });
};

module.exports.addRepo = function(repo, callback) {
  if (typeof repo === 'boolean' || repo.length === 0) {
    return callback(new Error('You must provide a git repo'), null);
  }

  var configJson = {
    repos: []
  };

  getRepos(function(error, data) {
    if (!error) {
      configJson = data;
    }

    if (configJson.repos.indexOf(repo) > -1) {
      return callback(new Error('Repo already added!'), null);
    }

    configJson.repos.push(repo);

    writeFile(configJson, function(error) {
      if (!error) {
        callback(null, 'Repo successfully added!');
      }
    });
  });
};

module.exports.removeRepo = function(repo, callback) {
  getRepos(function(error, data) {
    if (error) {
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
  });
};

module.exports.listRepos = function(callback) {
  getRepos(function(error, data) {
    if (!error) {
      callback(null, data.repos);
    }
  });
};