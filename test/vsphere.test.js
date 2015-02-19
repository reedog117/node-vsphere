/*
  vsphere-soap.test.js

  tests for the vCenterConnectionInstance class
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
  });
});

describe('Client tests - query commands:', function(){

  it('retrieves current time', {timeout: 5000}, function(done){

    vc.runCommand('CurrentTime', { _this: 'ServiceInstance'} )
      .once('result', function(result){
        expect(result.returnval).to.be.a.date();
        done();
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

  it('can obtain the names of all Virtual Machines', {timeout: 20000}, function(done){
    var rootFolder = vc.serviceContent.rootFolder;
    vc.getMORefsInContainerByTypeAndPropertyArray( rootFolder, 'VirtualMachine', ['name'])
    .once('result', function(result) {
      if( _.isEmpty(result) ) {
        // no vms to see
        done();
      } else if( result.returnval.objects.length ) {
        // more than one vm returned
        console.log(util.inspect(result.returnval, {depth: null}));
        expect(result.returnval.objects[1].obj.attributes.type).to.equal('VirtualMachine');
        expect(result.returnval.objects[1].propSet).to.exist();
        done();
      } else if( result.returnval.objects ) {
        console.log(util.inspect(result.returnval, {depth: null}));
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
/*
describe('Client tests - VM operations:', function(){

  it('creates a VM', {timeout: 5000}, function(done){

  });

  it('powers on a VM', {timeout: 5000}, function(done){

  });

  it('can obtain information about a VM\'s status', {timeout: 5000}, function(done){

  });

  it('powers off a VM', {timeout: 5000}, function(done){

  });

  it('changes a VM number of CPUs', {timeout: 5000}, function(done){

  });

  it('deletes a VM', {timeout: 5000}, function(done){

  });

});
*/


