function createConfigHandler(execlib, rootpath){
  var lib = execlib.lib,
      q = lib.q,
      execSuite = execlib.execSuite,
      taskRegistry = execSuite.taskRegistry,
      _defer = q.defer(),
      _configSuperSink,
      rtRootDir = require('../lib/rtrootdir');

  function ConfigHandler(sink){
    this.sink = sink;
  }
  ConfigHandler.prototype.destroy = function () {
    if (this.sink) {
      this.sink.destroy();
    }
    this.sink = null;
  };
  ConfigHandler.prototype.fetch = function (obj, keyname, filename, data, docreate) {
    var d = q.defer(), updater;
    updater = function (data) {
      obj[keyname] = data;
      d.resolve(true);
      obj = null;
      keyname = null;
      d = null;
    }
    if (docreate) {
      taskRegistry.run('fetchOrCreateWithData',{
        sink: this.sink,
        filename: filename,
        parsermodulename: 'allex_jsonparser',
        data: data,
        cb: updater,
        singleshot: true
      });
    } else {
      this.sink.call('fetch', filename, {
        parsermodulename: 'allex_jsonparser',
        modulename: 'allex_jsonparser'
      }).then(
        updater,
        d.resolve.bind(d, true)
      );
    }
    return d.promise;
  };
  ConfigHandler.prototype.get = function(cb, docreate){
    var ret = {};
    //this.getBoot(this._onBoot.bind(this,cb,ret));
    q.all([
      this.fetch(ret, 'boot', 'boot', {
        portcorrection: 0,
        httpmonitorport: 0
      }, docreate),
      this.fetch(ret, 'nat', 'nat', [{
        iaddress: '192.168.1.1',
        iport: 12345,
        eaddress: '1.2.3.4',
        eport: 80
      }], docreate),
      this.fetch(ret, 'subnets', 'subnets', ['192.168.1.0/8'], docreate),
    ]).then(this.finalize.bind(this, cb, ret));
    //]).then(cb.bind(null, ret));
  };
  ConfigHandler.prototype.finalize = function (cb, ret) {
    var rtroot = rtRootDir();
    if (rtroot) {
      if (ret.boot) {
        ret.boot.runtimedirectory = rtroot;
      } else {
        ret.boot = {runtimedirectory: rtroot};
      }
    }
    cb(ret);
  };

  function onUserSink(sink){
    _defer.resolve(new ConfigHandler(sink));
  }
  function onStarted(supersink){
    _configSuperSink = supersink;
    _configSuperSink.subConnect('.',{name:'user',role:'user'}).then(onUserSink);
  }
  execlib.execSuite.start({
    service:{
      modulename: 'allex_directoryservice',
      propertyhash:{
        path: [rootpath, '.allexlanmanager'],
        text: true
      }
    }
  }).done(
    onStarted,
    _defer.reject.bind(_defer)
  );
  return _defer.promise;
}

module.exports = createConfigHandler;
