#!/usr/bin/env node

/* this is an example of searching for a particular ManagedObjectReference to an object and retrieving its properties */

var util = require('util');
var Vsphere = require('../lib/client');
var _ = require('lodash');

// use the settings from the config used for module testing
var TestCreds = require('../config-test.js').vCenterTestCreds;
var TestVars = require('../config-test.js').vCenterTestVars;

// open a connection to vCenter
var vc = new Vsphere.Client(TestCreds.vCenterIP, TestCreds.vCenterUser, TestCreds.vCenterPassword, false);
vc.once('ready', function(){

  // get the ManagedObjectReference to the rootFolder
  var rootFolder = vc.serviceContent.rootFolder;

  // search the rootFolder for all ManagedObjectReferences of type 'VirtualMachine' with the provided name(s)
  vc.getMORefsInContainerByTypeName( rootFolder, 'VirtualMachine', TestVars.testVMs.testVMLinux) 
  .once('result', function(result) {
    console.log('MORef result : \n' + util.inspect(result, {depth: null}));

    // grab all the properties of one of the MORefs returned by the search
    vc.getMORefProperties( _.sample(result))
    .once('result', function(result) {
      console.log('all properties : \n' + util.inspect(result, {depth: null}));
    });

    // grab just a subset of the properties of one of the MORefs returned by the search
    vc.getMORefProperties( _.sample(result), 'config')
    .once('result', function(result) {
      console.log('config properties : \n' + util.inspect(result, {depth: null}));
    });


  });
});

