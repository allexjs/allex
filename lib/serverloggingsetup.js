function createServerLoggingSetup () {
  'use strict';

  function argPrepender (level, func) {
    return function () {
      var procname, prep;
      procname = (global.ALLEX_PROCESS_DESCRIPTOR) ? global.ALLEX_PROCESS_DESCRIPTOR.instancename : process.allexName;
      prep = procname ?
       [(new Date()).toString(), level, procname] :
       [(new Date()).toString(), level];
      Array.prototype.push.apply(prep, arguments);
      func.apply(null, prep);
    }
  }

  function serverLoggingSetup () {
    console.warn = argPrepender('WARNING', console.log);
    console.info = argPrepender('INFO', console.log);
    console.log = argPrepender('DEBUG', console.log);
    //console.trace = argPrepender('TRACE', console.trace);
    console.error = argPrepender('ERROR', console.error);
  }

  return serverLoggingSetup;
}

module.exports = createServerLoggingSetup;
