var Path = require('path'),
  Os = require('os');

function runTimeRootDir () {
  if (Os.platform === 'win32') {
    return null;
  }
  try {
    return require('/var/opt/allexjs/projectmap.json')[Path.normalize(process.cwd())];
  }
  catch (e) {
    return null;
  }
}

module.exports = runTimeRootDir;
