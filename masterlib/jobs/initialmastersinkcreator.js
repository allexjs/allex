function createInitialMasterSinkJob (execlib, mylib) {
  'use strict';
  var lib = execlib.lib,
    qlib = lib.qlib,
    JobOnDestroyable = qlib.JobOnDestroyable,
    execSuite = execlib.execSuite,
    taskRegistry = execSuite.taskRegistry;

  function InitialMasterSinkJob (availablelanservicepipename, natpipename, sink, defer) {
    JobOnDestroyable.call(this, sink, defer);
    this.availablelanservicepipename = availablelanservicepipename;
    this.natpipename = natpipename;
    this.subServiceMonitor = null;
    this.availableServiceSink = null;
    this.natSink = null;
  }
  lib.inherit(InitialMasterSinkJob, JobOnDestroyable);
  InitialMasterSinkJob.prototype.destroy = function () {
    this.natSink = null;
    this.availableServiceSink = null;
    this.subServiceMonitor = null;
    this.natpipename = null;
    this.availablelanservicepipename = null;
    JobOnDestroyable.prototype.destroy.call(this);
  };
  InitialMasterSinkJob.prototype.go = function () {
    var ok = this.okToGo();
    if (!ok.ok){
      return ok.val;
    }
    this.startMonitoringSubServices();
    return ok.val;
  };
  InitialMasterSinkJob.prototype.startMonitoringSubServices = function () {
    if (!this.okToProceed()){
      return;
    }
    this.subServiceMonitor = taskRegistry.run('monitorSubServices',{
      sink: this.destroyable
    });
    this.startAvailableLanServices();
  };
  InitialMasterSinkJob.prototype.startAvailableLanServices = function () {
    if (!this.okToProceed()){
      return;
    }
    execSuite.start({
      service:{
        modulename:'allex_availablelanservicesservice',
        propertyhash: {}/*,
        instancename:process.pid*/ // no need to globally register this sink
      },
      ports:[{
        protocol:{
          name: 'socket'
        },
        port: this.availablelanservicepipename,
        strategies:{
          samemachineprocess: true
        }
      }]
    }).then(
      this.onAvailableServices.bind(this),
      this.reject.bind(this)
    );
  };
  InitialMasterSinkJob.prototype.onAvailableServices = function (availableservicessink) {
    if (!this.okToProceed()){
      return;
    }
    this.availableServiceSink = availableservicessink;
    execSuite.start({
      service:{
        modulename:'allex_natservice',
        propertyhash: {}/*,
        instancename:process.pid*/ // no need to globally register this sink
      },
      ports:[{
        protocol:{
          name: 'socket'
        },
        port: this.natpipename,
        strategies:{
          samemachineprocess: true
        }
      }]
    }).then(
      this.onNatSink.bind(this),
      this.reject.bind(this)
    );
  };
  InitialMasterSinkJob.prototype.onNatSink = function (natsink) {
    if (!this.okToProceed()){
      return;
    }
    this.natSink = natsink;
    this.resolve([this.subServiceMonitor, this.availableServiceSink, this.natSink]);
  };

  mylib.InitialMasterSink = InitialMasterSinkJob;
}
module.exports = createInitialMasterSinkJob;