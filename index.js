var lib = require('allexlib'),
  serverLoggingSetup = require('./lib/serverloggingsetup')(),
  execlib;
lib.ws = require('allex_wslib')(lib);
execlib = require('allex_servercore')(lib);
execlib.serverLoggingSetup = serverLoggingSetup;
module.exports = execlib;
