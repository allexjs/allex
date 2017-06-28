var Path1 = require('path'),
  fs = require('fs');

function parsePid(lib, allexmasterpidcontents, cb){
  var allexmasterpid = parseInt(allexmasterpidcontents), program;
  if(isNaN(allexmasterpid)){
    console.log('allexmaster.pid is not in correct format. Is allexmaster running in your current working directory?');
    cb(null);
  }else{
    global.ALLEX_PROCESS_DESCRIPTOR = new lib.Map();
    global.ALLEX_PROCESS_DESCRIPTOR.add('masterpid', allexmasterpid);
    cb(allexmasterpid);
  }
}



function createPidFinder(execlib) {
  return function pidFinder (cb) {
    try{
    var allexmasterpidcontents, cwd = process.cwd(), tempcwd = cwd;

    while(!allexmasterpidcontents){
      try{
        allexmasterpidcontents = fs.readFileSync(Path1.join(tempcwd,'allexmaster.pid')).toString();
      }
      catch(e){
        try{
          process.chdir('..');
          tempcwd = process.cwd();
        }
        catch(e){
          console.log('oops in going upwards',e);
          console.log('allexmaster.pid not found. Is allexmaster running in your current working directory (or any parent of it)?',e);
        }
      }
    }

    if(allexmasterpidcontents){
      if(tempcwd!==cwd){
        process.chdir(cwd);
      }
      parsePid(execlib.lib, allexmasterpidcontents, cb);
    }
    } catch(e) {
      console.error(e.stack);
      console.error(e);
    }
  };
}

module.exports = createPidFinder;
