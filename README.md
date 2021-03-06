[![build status](https://secure.travis-ci.org/domharrington/gitme.png)](http://travis-ci.org/domharrington/gitme)
# gitme

A command line tool to see your git commits across multiple projects. This tool is written using Node.js, so Node must be installed to use it.

## Installation
Installing is done through NPM (Node Package Manager) as follows:

     npm install -g gitme

## Usage
View commits for multiple repos:

     gitme

Add a repo:

     gitme add [repo-location]

Remove a repo:

     gitme rm [repo-location]

List all repos:

     gitme ls

View help:

     gitme --help

## Parsing the git log
If you are looking for a module for parsing the git log in Node, you should look at [node-gitlog](https://github.com/domharrington/node-gitlog), which is what this module uses.

### Contributors
- Dom Harrington [domharrington](https://github.com/domharrington/)
- Nick Price [nicholasjohn](https://github.com/nicholasjohn/)
