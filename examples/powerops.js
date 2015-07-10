#!/usr/bin/env node

/*
This file shows an example of how to connect to a vCenter server, power on either a single VM or array of VMs,
wait for the operation to complete, and then power off the VM(s), and wait for that op to complete.
*/
var util = require('util');
var Vsphere = require('../lib/client');
var _ = require('lodash');

// This uses the config used for testing for connecting to a proper instance
var TestCreds = require('../config-test.js').vCenterTestCreds;

// Create a new connection to a vCenter instance
var vc = new Vsphere.Client(TestCreds.vCenterIP, TestCreds.vCenterUser, TestCreds.vCenterPassword, false);
vc.once('ready', function(){

  // get a ManagedObjectRef to the rootFolder that contains all objects
  var rootFolder = vc.serviceContent.rootFolder;

  // see the reuslts of RetrieveServiceContent after logging in (contains MORefs to most major objects)
  console.log('serviceContent : ' + util.inspect(vc.serviceContent, {depth: null} ));

  // this gets the power state of all VMs in a particular container
  vc.getVMinContainerPowerState( rootFolder )
  .once('result', function(result) {
    console.log('result : ' + util.inspect(result, {depth: null} ));
    if( _.isEmpty(result) ) {
      console.log('empty result set');
      return;
    }
    if( ! _.isArray(result) ) {
      result = [ result ];
    }
    // pick a random VM from the array of VMs
    var vmObjArray = _.pluck( result, 'obj' );
    var vmNameArray = _.pluck( result, 'name');


    console.log('vmObjArray : ' + vmObjArray);

    console.log('vmNameArray : ' + vmNameArray);

    // power up all the VMs in th array by Name -- prob using ManagedObjectRefs is better since you can feed that into other API calls
    vc.powerOpVMByName( vmNameArray, 'powerOn')
    .once('result', function(powerOnResult) {

      // this outputs to console the MORef to the task created to power on the VM
      console.log('power on result : ' + util.inspect(powerOnResult, {depth: null}));

      // for each VM (here referenced by ManagedObjectRef)
      _.forEach(vmObjArray, function(vmObj) {
        // wait for the powerState to change to poweredOn
        vc.waitForValues( vmObj, 'summary.runtime.powerState', 'powerState', 'poweredOn')
        .once('result', function(result) {

          console.log('wait result : ' + util.inspect(result, {depth: null}));

          // now send a powerOff command using the ManagedObjectRef to identify the VM
          vc.powerOpVMByMORef( vmObj, 'powerOff')
          .once('result', function(powerOffResult) {

            // this outputs to console the MORef to the task created to power off the VM
            console.log('power off result : ' + util.inspect(powerOffResult, {depth: null}));

            // wait for the powerState to be poweredOff
            vc.waitForValues( vmObj, 'summary.runtime.powerState', 'powerState', 'poweredOff')
            .once('result', function(result) {
              console.log('wait result : ' + util.inspect(result, {depth: null}));
            })
            .once('error', function(err) {
            console.error(err);
            });         
          })
          .once('error', function(err) {
            console.error(err);
          });
        })
        .once('error', function(err) {
          console.error(err);
        });               
      });

    })
    .once('error', function(err) {
      console.error(err);
    });
  })
  .once('error', function(err){
    //catch err;
    console.error('error : ' + util.inspect(err, {depth: null}));
  });

});

