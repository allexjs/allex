var fs = require('fs'),
    Path1 = require('path'),
    rtRootDir = require('./rtrootdir');

function createConfigHandler(){
  'use strict';
  function path(_path){
    return Path1.join(_path || process.cwd(),'.allexmasterconfig.json');
  }

  function check(_path){
    try{
      var ret = require(path(_path));
      return require(path(_path));
    }
    catch(e){
      return null;
    }
  }

  function create(){
    return {
      lanmanageraddress: '127.0.0.1',
      lanmanagerportcorrection: 0,
      runtimedirectory: '.',
      portrangestart:{
        tcp: 15000,
        http: 16000,
        ws: 17000
      }
    };
  }

  function write(config){
    fs.writeFileSync(path(),JSON.stringify(config,null,2));
  }

  function get(_path){
    var config = check(_path), rtroot;
    if(!config && !_path){
      config = create();
      write(config);
    }
    if (!_path) {
      rtroot = rtRootDir();
      if (rtroot) {
        config.runtimedirectory = rtroot;
      }
    }
    return config;
  }
  return get;
}

module.exports = createConfigHandler;
