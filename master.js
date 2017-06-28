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
  Path = require('path');
process.exit = function () {
  console.trace();
  pe.apply(process, arguments);
}


var singleton = require('allex_singletonprogramstarttool');

singleton('allexmaster',process.cwd());

function start(){
  var confighandler = require('./lib/confighandler')(),
    config = confighandler(),
    rtconfig = null;
  if (config.runtimedirectory) {
    rtconfig = confighandler(config.runtimedirectory);
  }
  require('./lib/runner')(config,rtconfig)();
}

start();

