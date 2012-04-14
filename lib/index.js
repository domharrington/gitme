var exec = require('child_process').exec
  , async = require('async')
  , colours = require('colors')
  , path = require('path')
  , _ = require('underscore')
  , repos = [
      '/Users/domh/Documents/node/fileupload',
      '/var/application/BauerBCN/BcnCms'
    ]
  , commits = []
  ;

// TODO add limit option & default limit

function getRepoLog(repoPath, callback) {
  exec('cd ' + repoPath + ' && git log -n 10 --author="`git config --get user.name`" --pretty="%h|%ai|(%ar)|%s"', function(error, stdout, stderr) {
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
  outputCommits();
}

function outputCommits() {
  var colours = ['blue', 'cyan', 'green', 'magenta', 'red', 'yellow']
    , repoColours = {}
    , index = 0
    ;

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

async.forEach(repos, getRepoLog, sortCommits);