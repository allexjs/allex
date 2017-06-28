#! /usr/bin/env node

/*
var cl = console.log;
console.log = function(){
  console.trace();
  cl.apply(cl,arguments);
}
*/

process.allexName = 'lanmanager';

var lm = require('./lanmanager/index')(require('./'));
