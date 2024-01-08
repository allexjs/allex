#! /usr/bin/env node

/*
var cl = console.log;
console.log = function(){
  console.trace();
  cl.apply(cl,arguments);
}
*/

var Path = require('path'),
 pathtoscript = Path.isAbsolute(process.argv[2]) ? process.argv[2] : Path.resolve(__dirname, Path.join(process.cwd(),process.argv[2])),
 execlib = require('./');

require('./clilib')(execlib.lib).setExitHandler();

execlib.lib.initUid().then(go);

function go() {
  console.log(pathtoscript);
  require(pathtoscript)(execlib); //, toolbox.commander);
}
