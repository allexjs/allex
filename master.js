#! /usr/bin/env node

/*
var cl = console.log;
console.log = function(){
  console.trace();
  cl.apply(cl,arguments);
}
*/

process.allexName = 'allexmaster';

var pe = process.exit,
  Path = require('path'),
  fs = require('fs'),
  execlib = require('./'),
  net = require('net'),
  lib = execlib.lib,
  q = lib.q,
  tmpPipeDir = require('allex_temppipedirserverruntimelib'),
  MasterRunner = require('./masterlib')(execlib),
  masterrunner = null;

process.exit = function () {
  console.trace();
  pe.apply(process, arguments);
}
function killer () {
  if (masterrunner) {
    masterrunner.destroy();
  }
  masterrunner = null;
}
process.on('SIGTERM', killer);
process.on('SIGINT', killer);

function onConnected (defer, socket, pid) {
  if (!socket) {
    return;
  }
  socket.removeAllListeners();
  socket.destroy();
  defer.reject(new lib.Error('PID_REALLY_ALLEXMASTER', 'Pid '+pid+' is a live allexmaster'));
  defer = null;
  socket = null;
  pid = null;
}

function onConnectionError (defer, socket, pidfn, err) {
  socket.removeAllListeners();
  socket.destroy();
  try {
    fs.unlinkSync(pidfn);
  } catch(ignore) {}
  defer.resolve(true);
  defer = null;
  socket = null;
  pidfn = null;
}

function checkForAllexMaster (pid, pidfn) {
  //console.log('check for', pid, 'in', pidfn);
  var pfn, sock, d;
  pfn = Path.join(tmpPipeDir(), 'allexmachinemanager.'+pid);
  sock = new net.Socket();
  d = q.defer();
  sock.on('connect', onConnected.bind(null, d, sock, pid));
  sock.on('error', onConnectionError.bind(null, d, sock, pidfn));
  sock.connect(pfn);
  return d.promise;
}

var singleton = require('allex_singletonprogramstarttool');

singleton('allexmaster',process.cwd(),start,checkForAllexMaster);

function start(){
  var confighandler = require('./lib/confighandler')(),
    config = confighandler(),
    rtconfig = null;
  if (config.runtimedirectory) {
    rtconfig = confighandler(config.runtimedirectory);
  }
  //require('./lib/runner')(config,rtconfig)();
  if (masterrunner) {
    masterrunner.destroy();
  }
  masterrunner = new MasterRunner(config, rtconfig);
  masterrunner.go();
}

