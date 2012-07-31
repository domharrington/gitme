// Grabs the existing gitme config from the tmp dir
require('fs').renameSync(require('os').tmpDir() + 'gitme.json', __dirname + '/../config.json');