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
var TestCreds = require('../config-test.js').vCenterTestCreds
var _ = require('lodash');


var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var after = lab.after;
var expect = Code.expect;

var vc = new Vsphere.Client(TestCreds.vCenterIP, TestCreds.vCenterUser, TestCreds.vCenterPassword, false);

describe('Client object initialization:', function(){
  it('provides a successful login', {timeout: 5000}, function(done) {
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

  it('can obtain the names of all Virtual Machines using getMORefsInContainerByTypeAndPropertyArray', {timeout: 20000}, function(done){
    var rootFolder = vc.serviceContent.rootFolder;
    vc.getMORefsInContainerByTypeAndPropertyArray( rootFolder, 'VirtualMachine', ['name'])
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

describe('Client tests - VM operations:', function(){

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
      console.error(err);
    });
  });


  it('powers on a VM', {timeout: 5000}, function(done){
    done();
  });
/*
  it('powers off a VM', {timeout: 5000}, function(done){

  });

  it('changes a VM number of CPUs', {timeout: 5000}, function(done){

  });

  it('deletes a VM', {timeout: 5000}, function(done){

  });
*/
});



