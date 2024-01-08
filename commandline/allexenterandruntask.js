#!/usr/bin/env node

var Path1 = require('path'),
  execlib = require('../index'),
  //pidfinder = require('./pidfinder')(execlib),
  lib = execlib.lib,
  qlib = lib.qlib,
  Suite = execlib.execSuite,
  registry = Suite.registry,
  taskRegistry = Suite.taskRegistry;

require('../clilib')(lib).setExitHandler();

var programname = process.argv[2], allexmasterpidcontents, cwd = process.cwd(), tempcwd = cwd;

registry.registerClientSide('.').then(
  qlib.executor(registry.registerClientSide.bind(registry, 'allex_masterservice'))
).then(
  qlib.executor(registry.registerClientSide.bind(registry, 'allex_entrypointservice'))
).then(
  taskRegistry.run.bind(taskRegistry, 'findMasterPid', { cb: parseProgram })
).fail(
  console.error.bind(console, 'error')
);

function parseProgram(allexmasterpid){
  console.log('parseProgram',allexmasterpid);
  var program;
  if(!allexmasterpid){
    return;
  }
  try{
    program = require(Path1.join(process.cwd(),programname));
  }
  catch(e){
    console.log(process.argv);
    console.log('The program',programname,'is invalid',e);
  }
  if(program){
    waitForUid(allexmasterpid,program);
  }
}

function waitForUid(allexmasterpid,program){
  lib.initUid().then(
    runProgram.bind(null,allexmasterpid,program)
  );
}

function runProgram(allexmasterpid,program){
  try{
    taskRegistry.run('letMeIn',program);
  }
  catch(e){
    console.error('Program',programname,'could not be run:',e);
  }
}

