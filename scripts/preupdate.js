// Moves the current config json to the tmp dir
require('fs').renameSync(__dirname + '/../config.json', require('os').tmpDir() + 'gitme.json');