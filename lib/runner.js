function makeStarter(config, rtconfig){
  var Path1 = require('path'),
    execlib = require('../'),
    lib = execlib.lib,
    q = lib.q,
    qlib = lib.qlib,
    execSuite = execlib.execSuite,
    registry = execSuite.registry,
    taskRegistry = execSuite.taskRegistry,
    lanmanageraddress,
    lmport = execSuite.lanManagerPorts[0],
    lanmanagerport = lmport.port,
    tmpPipeDir = require('allex_temppipedirserverruntimelib'),
    install = require('allex_npminstallserverruntimelib')(lib),
    unixsocketcleaner = require('allex_unixsocketcleanerserverruntimelib'),
    availablelanservicepipename = Path1.join(tmpPipeDir(), 'availablelanservices.'+process.pid),
    natpipename = Path1.join(tmpPipeDir(), 'nat.'+process.pid),
    childrenEngagedModules = {},
    childEngagedModule = new execlib.lib.HookCollection,
    childEngagedModuleListener = null,
    lanManagerAvailable = new execlib.lib.HookCollection,
    lmInitiallyFound = q.defer();

  execlib.serverLoggingSetup();
  if (rtconfig) {
    lib.extend(config,rtconfig);
  }
  lanmanageraddress = config.lanmanageraddress;
  if (config.lanmanagerportcorrection && !isNaN(parseInt(config.lanmanagerportcorrection))) {
    lanmanagerport += config.lanmanagerportcorrection;
  }
  execSuite.machineManagerPorts.forEach(function(port){
    if(port.protocol.name==='socket' && isNaN(parseInt(port.port))){
      port.port += ('.'+process.pid);
      unixsocketcleaner([port.port,availablelanservicepipename,natpipename]);
      port.strategies = {
        samemachineprocess: true
      };
    }
  });

  function onChildModuleEngaged(modulename){
    console.log(modulename);
    if(modulename in childrenEngagedModules){
      return;
    }
    childrenEngagedModules[modulename] = true;
    childEngagedModule.fire(modulename);
  }

  function reportEngagedModule(lmsink,engagedmodule){
    lmsink.call('notifyModuleEngaged',engagedmodule).done(function(){
      console.log('notifyModuleEngaged ok',arguments);
    },function(){
      console.error('notifyModuleEngaged nok',arguments);
    });
  }

  function handleLMSinkAcquirer(sink) {
    if (lmInitiallyFound.promise.isPending()) {
      lmInitiallyFound.resolve(sink);
    } else {
      lanManagerAvailable.fire(sink);
    }
  }

  function goForLMSink(servmonitor,availablelanservicessink,natsink) {
    findLanManager(servmonitor, availablelanservicessink, natsink, onLMSink.bind(null, servmonitor, availablelanservicessink, natsink));
  }

  function onLMSink(servmonitor,availablelanservicessink,natsink,lmsink){
    lanManagerAvailable.fire(lmsink);
    if(!lmsink){
      if(childEngagedModuleListener){
        childEngagedModuleListener.destroy();
      }
      childEngagedModuleListener = null;
      return;
    }
    childEngagedModuleListener = childEngagedModule.attach(reportEngagedModule.bind(null,lmsink));
    availablelanservicessink.call('delete',{})
    availablelanservicessink.call('create',{
      instancename: 'LanManager',
      modulename: 'allex_lanmanagerservice',
      propertyhash: {},
      roleremapping: {},
      ipaddress: lanmanageraddress,
      httpport: lanmanagerport
    });
    var lmstate = taskRegistry.run('materializeState',{
      sink:lmsink
    });
    taskRegistry.run('followLanManager',{
      lanmanagerstate:lmstate,
      availablelanservicessink:availablelanservicessink,
      natsink:natsink
    });
    taskRegistry.run('satisfyLanManager',{
      lanmanagerstate: lmstate,
      subservicemonitor: servmonitor,
      onMissingModule:function(e,cb){
        install(cb,e);
      }
    });
  }

  function startNat(){
    return execSuite.start({
      service:{
        modulename:'allex_natservice',
        propertyhash: {}/*,
        instancename:process.pid*/ // no need to globally register this sink
      },
      ports:[{
        protocol:{
          name: 'socket'
        },
        port: natpipename,
        strategies:{
          samemachineprocess: true
        }
      }]
    });
    //console.log('available lan services upnrunnin, lmstate',lmstate,'sink',availablelanservicessink);
  }
  function findLanManager(servmonitor,availablelanservicessink,natsink, cb){
    console.log('running acquireSink in order to find LAN manager',lmport.protocol.name+'://'+lanmanageraddress+':'+lanmanagerport);
    taskRegistry.run('acquireSink',{
      connectionString:lmport.protocol.name+'://'+lanmanageraddress+':'+lanmanagerport,
      propertyhash: {},
      identity: {ip:{name:'any_name',role:'user'}},
      onSink: cb
    });
    return lmInitiallyFound.promise;
  }

  function startMonitoringSubServices(supersink) {
    return q(taskRegistry.run('monitorSubServices',{
      sink: supersink
    }));
  }

  function startAvailableLanServices () {
    return execSuite.start({
      service:{
        modulename:'allex_availablelanservicesservice',
        propertyhash: {}/*,
        instancename:process.pid*/ // no need to globally register this sink
      },
      ports:[{
        protocol:{
          name: 'socket'
        },
        port: availablelanservicepipename,
        strategies:{
          samemachineprocess: true
        }
      }]
    });
  }

  function onStarted(supersink){
    return (new qlib.PromiseExecutionMapReducerJob([
      startMonitoringSubServices.bind(null, supersink),
      startAvailableLanServices,
      startNat
    ], [], goForLMSink, null)).go();
  }

  config.onChildModuleEngaged = onChildModuleEngaged;
  config.lanManagerAvailable = lanManagerAvailable;

  function start(){
    lib.initUid().then(qlib.executor(startWithUid));
  }

  function startWithUid(){
    execSuite.start({
      service:{
        modulename:'allex_masterservice',//Path1.join(__dirname,'..','ctrlservice'),
        propertyhash: config/*,
        instancename:process.pid*/ // no need to globally register this sink
      },
      ports:execSuite.machineManagerPorts
    }).done(
      onStarted,
      function(){
        console.log('Start failed',arguments);
      }
    );
  }

  return start;
}

module.exports = makeStarter;
