function createAvailableServiceResetterJob (execlib, mylib) {
  'use strict';

  var lib = execlib.lib,
  qlib = lib.qlib,
  JobOnDestroyable = qlib.JobOnDestroyable,
  execSuite = execlib.execSuite,
  taskRegistry = execSuite.taskRegistry;

  function AvailableServiceResetterJob (natsink, lanmanaddress, lanmanport, defer){
    JobOnDestroyable.call(this, natsink, defer);
    this.lanmanaddress = lanmanaddress;
    this.lanmanport = lanmanport;
  }
  lib.inherit(AvailableServiceResetterJob, JobOnDestroyable);
  AvailableServiceResetterJob.prototype.destroy = function () {
    this.lanmanport = null;
    this.lanmanaddress = null;
    JobOnDestroyable.prototype.destroy.call(this);
  };
  AvailableServiceResetterJob.prototype.go = function () {
    var ok = this.okToGo();
    if (!ok.ok) {
      return ok.val;
    }
    this.deleteAllAvailableServices();
    return ok.val;
  };
  AvailableServiceResetterJob.prototype.deleteAllAvailableServices = function () {
    if (!this.okToProceed()) {
      return;
    }
    this.destroyable.call('delete', {}).then(
      this.createLanManAvailableServiceRecord.bind(this),
      this.reject.bind(this)
    );
  };
  AvailableServiceResetterJob.prototype.createLanManAvailableServiceRecord = function () {
    if (!this.okToProceed()) {
      return;
    }
    this.destroyable.call('create',{
      instancename: 'LanManager',
      modulename: 'allex_lanmanagerservice',
      propertyhash: {},
      roleremapping: {},
      ipaddress: this.address,
      httpport: this.port
    }).then(
      this.resolve.bind(this, true),
      this.reject.bind(this)
    );
  };

  mylib.AvailableServiceResetter = AvailableServiceResetterJob;
}
module.exports = createAvailableServiceResetterJob;