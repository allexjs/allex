function createCliLib (lib) {
  'use strict';

  function exitHandler () {
    process.exit(0);
  }

  function setExitHandler () {
    process.on('SIGINT', exitHandler);
    process.on('SIGTERM', exitHandler);
  }

  return {
    setExitHandler: setExitHandler
  };
}
module.exports = createCliLib;