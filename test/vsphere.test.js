"use strict";
/*
  vsphere-soap.test.js

  tests for the node-vsphere module
*/ 

var Code = require('code');
var Lab = require('lab');
var util = require('util');
var lab = exports.lab = Lab.script();
var Vsphere = require('../lib/client');
var TestCreds = require('../config-test.js').vCenterTestCreds;
var TestVars = require('../config-test.js').vCenterTestVars;
var _ = require('lodash');


var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var beforeEach = lab.beforeEach;
var after = lab.after;
var expect = Code.expect;

var vc = new Vsphere.Client(TestCreds.vCenterIP, TestCreds.vCenterUser, TestCreds.vCenterPassword, false);

describe('Client object initialization:', function(){
  it('provides a successful login', {timeout: 20000}, function(done) {
    expect(vc).to.exist();
    vc.once('ready', function() {
      expect(vc.serviceContent).to.exist();
      done();
    });
    vc.once('error', function(err) {
      console.error(err);
    });
  });
});

describe('Client tests - query commands:', function(){

  it('retrieves current time', {timeout: 5000}, function(done){
    vc.runCommand('CurrentTime', { _this: 'ServiceInstance'} )
      .once('result', function(result){
        expect(result.returnval).to.be.a.date();
        done();
      })
      .once('error', function(err) {
        console.error(err);
    });
  });

  it('can get ManagedObjectReferences in rootFolder container by type (Datacenter)', {timeout: 20000}, function(done){
    var rootFolder = vc.serviceContent.rootFolder;
    vc.getMORefsInContainerByType( rootFolder, 'Datacenter')
    .once('result', function(result) {
      expect(result.returnval.objects.obj.attributes.type).to.equal('Datacenter');
      expect(result.returnval.objects.propSet).to.exist();
      done();
    })
    .once('error', function(err) {
      console.error(err);
    });
  });

  it('can get ManagedObjectReferences in rootFolder container by type (VirtualMachine)', {timeout: 20000}, function(done){
    var rootFolder = vc.serviceContent.rootFolder;
    vc.getMORefsInContainerByType( rootFolder, 'VirtualMachine')
    .once('result', function(result) {

      if( _.isEmpty(result) ) {
        // no vms to see
        done();
      } else if( result.returnval.objects.length ) {
        // more than one vm returned
        expect(result.returnval.objects[0].obj.attributes.type).to.equal('VirtualMachine');
        expect(result.returnval.objects[0].propSet).to.exist();
        done();
      } else if( result.returnval.objects ) {
        expect(result.returnval.objects.obj.attributes.type).to.equal('VirtualMachine');
        expect(result.returnval.objects.propSet).to.exist();
        done();
      } else {
        console.error('issue!');
      }
    })
    .once('error', function(err) {
      console.error(err);
    });
  });

  it('can retrieve all properties of a specific VirtualMachine object by ManagedObjectReference', {timeout: 20000}, function(done) {

    var rootFolder = vc.serviceContent.rootFolder;
    vc.getMORefsInContainerByType( rootFolder, 'VirtualMachine')
    .once('result', function(vmRefsResult) {
      vc.getMORefProperties( _.sample(vmRefsResult.returnval.objects).obj)
      .once('result', function(result) {
        expect(result.returnval.objects.obj.attributes.type).to.equal('VirtualMachine');
        expect(result.returnval.objects.propSet).to.exist();
        done();
      })
      .once('error', function(err) {
        console.error(err);
      });
    })
    .once('error', function(err) {
      console.error(err);
    });
  });

  it('can retrieve all properties of a specific VirtualMachine object by ManagedObjectReference derived by name', {timeout: 20000}, function(done) {

    var rootFolder = vc.serviceContent.rootFolder;
    vc.getMORefsInContainerByTypeName( rootFolder, 'VirtualMachine', _.sample(TestVars.testVMs))
    .once('result', function( vmRefResult) {
      vc.getMORefProperties( vmRefResult )
      .once('result', function(result) {
        expect(result.returnval.objects.obj.attributes.type).to.equal('VirtualMachine');
        expect(result.returnval.objects.propSet).to.exist();
        done();
      })
      .once('error', function(err) {
        console.error(err);
      });
    })
    .once('error', function(err) {
      console.error(err);
    });
  });

  it('can obtain the names of all Virtual Machines using getMORefsInContainerByTypeAndPropertyArray', {timeout: 20000}, function(done){
    var rootFolder = vc.serviceContent.rootFolder;
    vc.getMORefsInContainerByTypePropertyArray( rootFolder, 'VirtualMachine', ['name'])
    .once('result', function(result) {
      if( _.isEmpty(result) ) {
        // no vms to see
        done();
      } else if( result.returnval.objects.length ) {
        // more than one vm returned
        expect(result.returnval.objects[1].obj.attributes.type).to.equal('VirtualMachine');
        expect(result.returnval.objects[1].propSet).to.exist();
        done();
      } else if( result.returnval.objects ) {
        expect(result.returnval.objects.obj.attributes.type).to.equal('VirtualMachine');
        expect(result.returnval.objects.propSet).to.exist();
        done();
      } else {
        console.error('issue!');
      }
    })
    .once('error', function(err) {
      console.error(err);
    });
  });
});

describe('Client tests - VM power operations:', function(){

  var testVMLinuxPowerOn = false;
  var testVMWindowsPowerOn = false;

  it('can obtain information about VM power state', {timeout: 5000}, function(done){
    var rootFolder = vc.serviceContent.rootFolder;
    vc.getVMinContainerPowerState( rootFolder )
    .once('result', function(result) {
      expect(result).to.be.an.array();
      if(result.length > 0) {
        expect(result[0].obj.attributes.type).to.equal('VirtualMachine');
        expect( parseInt(result[0].obj['$value']) , 'vmId').to.be.a.number();
        expect(result[0].name, 'VM Name').to.exist();
        expect(result[0].name, 'VM Name').to.be.a.string();
        expect(result[0].powerState, 'VM power state').to.exist();
        expect(result[0].powerState, 'VM power state').to.be.a.string();
      }
      done();
    })
    .once('error', function(err){
      //catch err;
      console.error(util.inspect(err, {depth: null}));
    });
  });

  it('powers on and off a VM (by name)', {timeout: 60000}, function(done){

    // turn off all test vms before running test
    vc.powerOpVMByName( _.values( TestVars.testVMs), 'shutdown')
    .once('result', runTest)
    .once('error', runTest);

    // run test
    function runTest() {
      // uses a random VM in testVMs
      vc.powerOpVMByName( _.sample(TestVars.testVMs), 'powerOn')
      .once('result', function(powerOnResult) {

        // ensure VM PowerOn task successfully fired
        expect(powerOnResult[0].result['$value']).to.be.equal('success');

        // get the Virtual Machine ManagedObjectReference
        var vmObj = powerOnResult[0].obj;

        vc.waitForValues( vmObj, 'summary.runtime.powerState', 'powerState', 'poweredOn')
        .once('result', function(result) {

          // verify VM is powered on
          expect(result['summary.runtime.powerState']['$value']).to.be.equal('poweredOn');

          vc.powerOpVMByMORef( vmObj, 'shutdown')
          .once('result', function(powerOffResult) {

            // ensure VM PowerOff task successfully fired
            expect(powerOffResult[0].result['$value']).to.be.equal('success');

            vc.waitForValues( vmObj, 'summary.runtime.powerState', 'powerState', 'poweredOff')
            .once('result', function(result) {

              // verify VM is powered off
              expect(result['summary.runtime.powerState']['$value']).to.be.equal('poweredOff');
              done();

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

      })
      .once('error', function(err) {
        console.error(err);
      });
    }
  });

  it('powers on and off multiple VMs (by array of names)', {timeout: 120000}, function(done){

    // turn off all test VMs

    vc.powerOpVMByName( _.values( TestVars.testVMs), 'shutdown')
    .once('result', runTest)
    .once('error', runTest);

    // now run test

    function runTest() {

      var allTestVMNames = _.values( TestVars.testVMs);
      var numProcessed = 0;

      vc.powerOpVMByName( _.values( TestVars.testVMs), 'powerOn')
      .once('result', function(powerOnResult) {

        // check that all submitted PowerOn tasks have successfully fired
        _.forEach( powerOnResult, function(result) {
          expect(result.result['$value']).to.be.equal('success');
        });

        var vmObjArray = _.pluck( powerOnResult, 'obj');
        // wait for them all to be powered on
        _.forEach(vmObjArray, function(vmObj) {
          vc.waitForValues( vmObj, 'summary.runtime.powerState', 'powerState', 'poweredOn')
          .once('result', function(result) {

            // verify all test VMs are powered on
            expect(result['summary.runtime.powerState']['$value']).to.be.equal('poweredOn');

            vc.powerOpVMByMORef( vmObj, 'shutdown')
            .once('result', function(powerOffResult) {

              // verify that all submitted PowerOff tasks have successfully fired
              expect(powerOffResult[0].result['$value']).to.be.equal('success');

              vc.waitForValues( vmObj, 'summary.runtime.powerState', 'powerState', 'poweredOff')
              .once('result', function(result) {

                // verify all test VMs are powered off
                expect(result['summary.runtime.powerState']['$value']).to.be.equal('poweredOff');
                numProcessed++;
                if(numProcessed == allTestVMNames.length) {
                  done();
                }
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
    }
  });

});



