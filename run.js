#! /usr/bin/env node

/*
var cl = console.log;
console.log = function(){
  console.trace();
  cl.apply(cl,arguments);
}
*/

var Path = require('path'),
 pathtoscript = Path.resolve(__dirname, Path.join(process.cwd(),process.argv[2])),
 execlib = require('./');

execlib.lib.initUid().then(go);

function go() {
  console.log(pathtoscript);
  require(pathtoscript)(execlib); //, toolbox.commander);
}
