var Path = require('path');
function runLanManager(execlib) {
  'use strict';
  var lib = execlib.lib,
    qlib = lib.qlib,
    execSuite = execlib.execSuite,
    registry = execSuite.registry,
    libRegistry = execSuite.libRegistry,
    taskRegistry = execSuite.taskRegistry,
    lanmansink = null;

  function killer () {
    if (lanmansink) {
      //console.log('destroying lanmansink');
      lanmansink.destroy();
    }
    lanmansink = null;
  }
  process.on('SIGINT', killer);
  process.on('SIGTERM', killer);

  execlib.serverLoggingSetup();

  function goWithUid() {
    var mycwd = process.cwd();
    //process.chdir(Path.join(__dirname, '..'));
    var configHandler = require('./confighandler')(execlib, mycwd);

    configHandler.done(function(handler){
      handler.get(onBasicConf, true);
    });
  }

  function onBasicConf (conf) {
    var configHandler, cb;
    if (conf.boot.runtimedirectory) {
      configHandler = require('./confighandler')(execlib, conf.boot.runtimedirectory);
      cb = onRTConf.bind(null, conf);
      configHandler.done(function(handler) {
        handler.get(cb);
        cb = null;
      });
    } else {
      run(conf);
    }
  }

  function onRTConf (conf, rtconf) {
    if (rtconf) {
      if (rtconf.subnets) {
        conf.subnets = rtconf.subnets;
      }
      if (rtconf.nat) {
        conf.nat = rtconf.nat;
      }
      if (rtconf.boot) {
        lib.extend(conf.boot, rtconf.boot);
      }
    }
    run(conf);
  }

  function run(conf){
    registry.registerServerSide('allex_lanmanagerservice').then(
      start.bind(null, conf)
    );
  }

  function onStarted(sink){
    lanmansink = sink;
  }

  function start(conf){
    taskRegistry.run('startLanManager', {
      config: conf,
      cb: onStarted
    });
  }

  lib.initUid().then(qlib.executor(goWithUid));
}

module.exports = runLanManager;
