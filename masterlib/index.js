var Path = require('path');
var unixsocketcleaner = require('allex_unixsocketcleanerserverruntimelib');
var tmpPipeDir = require('allex_temppipedirserverruntimelib');
var availablelanservicepipename = Path.join(tmpPipeDir(), 'availablelanservices.'+process.pid);
var natpipename = Path.join(tmpPipeDir(), 'nat.'+process.pid);

function createMasterRunner (execlib) {
  'use strict';

  var execSuite = execlib.execSuite,  
    lib = execlib.lib,
    taskRegistry = execSuite.taskRegistry,
    jobslib = require('./jobs')(execlib),
    install = require('allex_npminstallserverruntimelib')(lib);

  function machinePortMakeup (origport) {
    var port = lib.extend({}, origport);
    if(port.protocol.name==='socket' && isNaN(parseInt(port.port))){
      port.port += ('.'+process.pid);
      unixsocketcleaner([port.port,availablelanservicepipename,natpipename]);
      port.strategies = {
        samemachineprocess: true
      };
    }
    return port;
  }

  function MasterRunner (config, rtconfig) {
    this.config = lib.extend({}, config, rtconfig);
    this.lanManagerProtocolName = '';
    this.lanManagerPort = 0;
    this.machineManagerPorts = execSuite.machineManagerPorts.map(machinePortMakeup);
    this.lanManagerAvailable = new lib.HookCollection();
    this.masterSink = null;
    this.masterMonitor = null;
    this.availableServicesSink = null;
    this.natSink = null;
    this.lmSink = null;
    this.config.lanManagerAvailable = this.lanManagerAvailable;
    var lmport = execSuite.lanManagerPorts[0];
    this.lanManagerProtocolName = lmport.protocol.name;
    this.lanManagerPort = lmport.port;
    if (this.config.lanmanagerportcorrection && !isNaN(parseInt(this.config.lanmanagerportcorrection))) {
      this.lanManagerPort += this.config.lanmanagerportcorrection;
    }
  }
  MasterRunner.prototype.destroy = function () {
    //first of all, null the config, it's the "alive detector"
    this.config = null;
    this.lanManagerPort = null;
    this.lanManagerProtocolName = null;
    if (this.lmSink) {
      this.lmSink.destroy();
    }
    this.lmSink = null;
    if (this.natSink) {
      this.natSink.destroy();
    }
    this.natSink = null;
    if (this.availableServicesSink) {
      this.availableServicesSink.destroy();
    }
    this.availableServicesSink = null;
    if (this.masterMonitor) {
      this.masterMonitor.destroy();
    }
    this.masterMonitor = null;
    if (this.masterSink) {
      this.masterSink.destroy();
    }
    this.masterSink = null;
    if (this.lanManagerAvailable) {
      this.lanManagerAvailable.destroy();
    }
    this.lanManagerAvailable = null;
    this.machineManagerPorts = null;
    this.lanManagerPort = null;
    this.lanManagerProtocolName = null;
    this.config = null; //for academic reasons, null it again
  };
  MasterRunner.prototype.reset = function () {

  };
  MasterRunner.prototype.go = function () {
    lib.initUid().then(this.startMaster.bind(this));
  };
  MasterRunner.prototype.startMaster = function () {
    if (!this.config) {
      this.destroy();
      return;
    }
    execSuite.start({
      service:{
        modulename:'allex_masterservice',
        propertyhash: this.config
      },
      ports:this.machineManagerPorts
    }).done(
      this.onMasterStarted.bind(this),
      this.onMasterStartFailed.bind(this)
    );
  };
  MasterRunner.prototype.onMasterStarted = function (mastersink) {
    if (!(mastersink && mastersink.destroyed)) {
      this.rego();
      return;
    }
    this.masterSink = mastersink;
    mastersink.destroyed.attachForSingleShot(this.rego.bind(this));
    (new jobslib.InitialMasterSink(availablelanservicepipename, natpipename, mastersink)).go().then(
      this.onMasterInitialized.bind(this),
      this.rego.bind(this)
    );
  };
  MasterRunner.prototype.onMasterStartFailed = function (reason) {
    console.log('MasterRunner failed to start', reason);
    this.rego();
  };
  MasterRunner.prototype.rego = function () {
    if (!this.config) {
      return;
    }
    console.log('Will retry in a second');
    lib.runNext(this.go.bind(this), lib.intervals.Second);
  };

  MasterRunner.prototype.onMasterInitialized = function (initarry) {
    this.masterMonitor = initarry[0];
    this.availableServicesSink = initarry[1];
    this.natSink = initarry[2];
    this.findLanManager();
  };
  MasterRunner.prototype.findLanManager = function () {
    var target = this.lanManagerProtocolName+'://'+this.config.lanmanageraddress+':'+this.lanManagerPort;
    console.log('running acquireSink in order to find LAN manager',target);
    this.acquireSinkTask = taskRegistry.run('acquireSink',{
      connectionString:target,
      propertyhash: {},
      identity: {ip:{name:'any_name',role:'user'}},
      onSink: this.onLMSink.bind(this)
    });
  };
  MasterRunner.prototype.onLMSink = function (lmsink){
    if (lmsink == null) {
      this.resetOnLMSink();
      return;
    }
    //lmsink.destroyed.attachForSingleShot(this.resetOnLMSink.bind(this));
    this.lmSink = lmsink;
    this.resetOnLMSink().then(
      this.startLMTasks.bind(this),
      this.rego.bind(this)
    );
  };
  MasterRunner.prototype.resetOnLMSink = function () {
    return (new jobslib.AvailableServiceResetter(
      this.availableServicesSink,
      this.config.lanmanageraddress,
      this.lanManagerPort,
      )).go();
  };
  MasterRunner.prototype.startLMTasks = function () {
    var lmstate = taskRegistry.run('materializeState',{
      sink:this.lmSink
    });
    taskRegistry.run('followLanManager',{
      lanmanagerstate:lmstate,
      availablelanservicessink:this.availableServicesSink,
      natsink:this.natSink
    });
    taskRegistry.run('satisfyLanManager',{
      lanmanagerstate: lmstate,
      subservicemonitor: this.masterMonitor,
      onMissingModule:function(e,cb){
        install(cb,e);
      }
    });
  };

  return MasterRunner;
}
module.exports = createMasterRunner;
