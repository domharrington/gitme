var should = require('should')
  , exec = require('child_process').exec
  , fs = require('fs')
  , gitme = require('../lib/index')
  , testRepoFolder = __dirname + '/test-repo-folder'
  , configLocation = __dirname + '/../config.json';

function addRepo(repo, callback) {
  if (typeof callback === 'undefined') {
    callback = repo;
    repo = testRepoFolder;
  }

  gitme.addRepo(repo, callback);
}

function removeConfig(callback) {
  exec('rm -rf ' + configLocation, function() {
    callback();
  });
}

describe('gitme', function() {
  var successMessage = 'Repo successfully added!';

  before(removeConfig);

  describe('#addRepo()', function() {

    it('should add a repo to config', function(done) {
      addRepo(function(error, success) {
        success.should.equal(successMessage);
        done();
      });
    });

    it('adding a repo should create the config file if it doesnt exist', function(done) {
      fs.stat(configLocation, function(error, stat) {
        error.code.should.equal('ENOENT');
        addRepo(function(error, success) {
          success.should.equal(successMessage);
          fs.stat(configLocation, function(error, stat) {
            stat.isFile().should.equal(true);
            done();
          });
        });
      });
    });

    it('should not add a repo that is already in the config', function(done) {
      addRepo(function() {
        addRepo(function(error, success) {
          error.should.be.an.instanceof(Error);
          error.message.should.equal('Repo already added!');
          done();
        });
      });
    });

    it('should return an error when no folder name is given', function(done) {
      addRepo('', function(error, success) {
        error.should.be.an.instanceof(Error);
        error.message.should.equal('You must provide a git repo');
        done();
      });
    });

  });

  describe('#removeRepo()', function() {

    it('should remove a repo from config when used with "rm"', function(done) {
      addRepo(function() {
        gitme.removeRepo(testRepoFolder, function(error, success) {
          success.should.equal('Repo successfully deleted!');
          done();
        });
      });
    });

    it('should return an error if the config file doesnt exist', function(done) {
      gitme.removeRepo('fake-folder-path', function(error, success) {
        error.should.be.an.instanceof(Error);
        error.message.should.equal('Config file doesnt exist');
        done();
      });
    });

    it('should return an error if the folder to delete isnt in the config', function(done) {
      addRepo(function() {
        gitme.removeRepo('fake-folder-path', function(error, success) {
          error.should.be.an.instanceof(Error);
          error.message.should.equal('Repo doesnt exist in config');
          done();
        });
      });
    });

  });

  describe('#listRepos()', function() {

    it('should list all repos from config', function(done) {
      addRepo('a', function() {
        addRepo('b', function() {
          addRepo('c', function() {
            gitme.listRepos(function(error, repos) {
              repos.should.be.an.instanceof(Array);
              repos.length.should.equal(3);
              done();
            });
          });
        });
      });
    });

  });

  afterEach(removeConfig);

});