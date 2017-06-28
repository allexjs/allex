#!/usr/bin/env node

var Path1 = require('path'),
  execlib = require('../index'),
  //pidfinder = require('./pidfinder')(execlib),
  lib = execlib.lib,
  qlib = lib.qlib,
  Suite = execlib.execSuite,
  registry = Suite.registry,
  libRegistry = Suite.libRegistry,
  taskRegistry = Suite.taskRegistry;

var cwd = process.cwd(), tempcwd = cwd;

execlib.loadDependencies('client', ['.', 'allex:environment:lib', 'allex:blessed:lib'], parseProgram);
function parseProgram(rootpack, envlib, blessedlib){
  var environments, appdescriptor;
  try{
    environments = require(Path1.join(process.cwd(),'environments'));
  }
  catch(e){
    console.log(process.argv);
    console.log('environments file is invalid',e);
  }
  try{
    appdescriptor = require(Path1.join(process.cwd(),'appdescriptor'))(execlib, blessedlib);
  }
  catch(e){
    console.log(process.argv);
    console.log('appdescriptor file is invalid',e);
  }
  if(environments && appdescriptor){
    waitForUid(envlib, blessedlib, environments, appdescriptor);
  }
}

function waitForUid(envlib, blessedlib, environments, appdescriptor){
  lib.initUid().then(
    runProgram.bind(null, envlib, blessedlib, environments, appdescriptor)
  );
}

function runProgram(envlib, blessedlib, environmentsarray, appdescriptor){
  var environments = new lib.Map(), app;
  function envAdder(envdesc) {
    environments.add(envdesc.name, envlib(envdesc));
  }
  try{
    if (lib.isArray(environmentsarray)) {
      environmentsarray.forEach(envAdder);
    }
    if (appdescriptor) {
      app = new (blessedlib.App)(appdescriptor, environments);
      environments = null;
    }
  }
  catch(e){
    console.error(e.stack);
    console.error('Program could not be ran:',e);
  }
}

