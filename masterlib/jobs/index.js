function createJobs (execlib) {
  'use strict';
  var mylib = {};

  require('./initialmastersinkcreator')(execlib, mylib);
  require('./availableserviceresettercreator')(execlib, mylib);

  return mylib;
}
module.exports = createJobs;