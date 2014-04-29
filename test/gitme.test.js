var assert = require('assert')
  , async = require('async')
  , rimraf = require('rimraf')
  , _ = require('underscore')
  , exec = require('child_process').exec
  , execFile = require('child_process').execFile
  , fs = require('fs')
  , gitme = require('../lib/index')
  , configLocation = __dirname + '/../config.json'
  , createdFolders = []

function addRepo(repo, callback) {
  try { fs.mkdirSync(repo) } catch(e) {}

  exec('cd ' + repo + ' && git init', function (err) {
    if (err) return callback(err)
    createdFolders.push(repo)
    gitme.addRepo(repo, callback)
  })
}

function createCommits(repo, callback, num) {
  num = num || 20
  execFile(__dirname + '/add-commits.sh', [ num ], { cwd: repo }, callback)
}

function tidyUp(callback) {
  delete require.cache[require('path').resolve(configLocation)]
  rimraf(configLocation, function (err) {
    if (err) return callback(err)

    async.forEach(createdFolders, function (folder, next) {
      if (!fs.existsSync(folder)) return next()
      rimraf(folder, function (err) {
        if (err) console.error('###', folder, err)
        next()
      })
    }, callback)
  })
}

describe('gitme', function() {
  var successMessage = 'Repos successfully added!'

  before(tidyUp)

  // These two tests are noticably slower than the rest due to spawning
  // a child process
  describe('CLI', function() {

    it('should display the correct version', function(done) {
      exec(__dirname + '/../bin/gitme --version', function(error, stdout) {
        stdout.split('\n')[0].should.equal(require(__dirname + '/../package.json').version)
        done()
      })
    })

    it('should display no error when calling ls with no config file', function(done) {
      exec(__dirname + '/../bin/gitme ls', function(error, stdout, stderr) {
        stderr.should.equal('')
        stdout.should.equal('\n')
        done()
      })
    })

  })

  describe('#getCommits()', function () {

    it('should default to returning 10 commits', function (done) {
      addRepo('10-commits', function (err) {
        if (err) return done(err)

        createCommits('10-commits', function (err) {
          if (err) return done(err)

          exec(__dirname + '/../bin/gitme', function(error, stdout) {

            assert.equal(_.compact(stdout.split('\n')).length, 10)
            done()
          })

        })
      })
    })

    it('should allow overriding of number of commits', function (done) {
      addRepo('20-commits', function (err) {
        if (err) return done(err)

        createCommits('20-commits', function (err) {
          if (err) return done(err)

          exec(__dirname + '/../bin/gitme -n 20', function(error, stdout) {
            assert.equal(_.compact(stdout.split('\n')).length, 20)
            done()
          })

        })
      })
    })

    it('should return an error if there are no repos in the config')

  })

  describe('#addRepo()', function() {

    it('should add the cwd if no folder provided')

    it('should add a repo to config when provided', function(done) {
      addRepo('add-repo-to-config', function(error, success) {
        success.should.equal(successMessage)
        done()
      })
    })

    it('adding a repo should create the config file if it doesnt exist', function(done) {
      fs.stat(configLocation, function(error, stat) {
        error.code.should.equal('ENOENT')
        addRepo('add-repo-create-config', function(error, success) {
          success.should.equal(successMessage)
          fs.stat(configLocation, function(error, stat) {
            stat.isFile().should.equal(true)
            done()
          })
        })
      })
    })

    it('should not add a repo that is already in the config', function(done) {
      addRepo('already-in-config', function() {
        addRepo('already-in-config', function(error) {
          var repos = require('../config.json').repos
          assert.equal(repos.length, 1)
          done()
        })
      })
    })

    it.skip('should return an error when no folder name is given', function(done) {
      addRepo('', function(error) {
        error.should.be.an.instanceof(Error)
        error.message.should.equal('You must provide a git repo')
        done()
      })
    })

    it('should recursively search the folder structure for git repos', function(done) {
      addRepo('a', function() {
        addRepo('a/b', function() {
          addRepo('a/b/c', function() {
            var repos = require('../config.json').repos

            assert.deepEqual(repos, [ 'a', 'a/b', 'a/b/c' ])
            done()
          })
        })
      })
    })

  })

  describe('#removeRepo()', function() {

    it('should remove a repo from config when used with "rm"', function(done) {
      addRepo('remove-config', function() {
        gitme.removeRepo('remove-config', function(error, success) {
          success.should.equal('Repo successfully deleted!')
          done()
        })
      })
    })

    it('should return an error if the config file doesnt exist', function(done) {
      gitme.removeRepo('fake-folder-path', function(error, success) {
        error.should.be.an.instanceof(Error)
        error.message.should.equal('Config file doesnt exist')
        done()
      })
    })

    it('should return an error if the folder to delete isnt in the config', function(done) {
      addRepo('this-doesnt-matter', function() {
        gitme.removeRepo('fake-folder-path', function(error, success) {
          error.should.be.an.instanceof(Error)
          error.message.should.equal('Repo doesnt exist in config')
          done()
        })
      })
    })

  })

  describe('#listRepos()', function() {

    it('should list all repos from config', function(done) {
      addRepo('a', function() {
        addRepo('b', function() {
          addRepo('c', function() {
            var repos = gitme.listRepos()

            repos.should.be.an.instanceof(Array)
            repos.length.should.equal(3)
            done()
          })
        })
      })
    })

  })

  afterEach(tidyUp)

})
