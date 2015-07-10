# node-vsphere

[![Join the chat at https://gitter.im/reedog117/node-vsphere](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/reedog117/node-vsphere?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

# This module is not yet finished and still under development!

This is a Node.js module to connect to VMware vCenter servers and/or ESXi hosts and perform operations using the [vSphere Web Services API].

This module is dependent upon [node-vsphere-soap] which handles the low-level SOAP WSDL calls to the vSphere API.  This module should be referenced in your projects, not node-vsphere-soap, so you can avoid making lower-level calls directly to vSphere Web Services.

This is very much in alpha. 

## Authors

  - Patrick C - [@reedog117]

## Version
0.0.1

## Installation

```sh
$ npm install vsphere --save
```

## Sample Code

### examples directory

Check out the examples in that directory, which include how to run power operations on VMs and how to grab the properties of ManagedObjectReferences.

### To connect to a vCenter server:

```javascript
var Vsphere = require('vsphere');
var vc = new Vsphere.Client(host, user, password, sslVerify);
vc.once('ready', function() {
  // perform work here
});
vc.once('error', function(err) {
  // handle error here
});
```

#### Arguments
  - host = hostname or IP of vCenter/ESX/ESXi server
  - user = username
  - password = password
  - sslVerify = true|false  - set to false if you have self-signed/unverified certificates

#### Events
  - ready = emits when session authenticated with server
  - error = emits when there's an error
    - *err* contains the error

#### Client instance variables

  - serviceContent - ServiceContent object retrieved by RetrieveServiceContent API call
  - userName - username of authenticated user
  - fullName - full name of authenticated user

### Available methods:

  There are examples here for now, until more formal documentation is put together

```javascript
var vcCmd = vc.runCommand( commandToRun, arguments );
vcCmd.once('result', function( result, raw, soapHeader) {
  // handle results
});
vcCmd.once('error', function( err) {
  // handle errors
});

var rootFolder = vc.serviceContent.rootFolder;

vc.getMORefsInContainerByType( rootFolder, 'VirtualMachine')

vc.getMORefsInContainerByTypeName( rootFolder, 'VirtualMachine', 'myVM')

vc.getMORefProperties( MORef )
vc.getMORefProperties( MORef, propList )

vc.getMORefsInContainerByTypePropertyArray( rootFolder, 'VirtualMachine', ['name', 'config'])

vc.getVMinContainerPowerState( rootFolder )
.once('result', function( result) {
  /*
  result = [{ obj: { attributes: { type: 'VirtualMachine' }, '$value': '4' },
            name: 'testvm-win',
            powerState: 'poweredOff' }, ...]
  */
});
.once('error', function( err) {
  // handle errors
});

vc.powerOpVMByName( vmName, powerOp)
/*
vmName can be a string (for a single VM) or an array of strings (for multiple VMs)
powerOp is one of ['powerOn', 'powerOff', 'reset', 'standby', 'shutdown', 'reboot', 'suspend']
*/

vc.waitForValues( MORef, filterProps, endWaitProps, expectedVals)
/*
emits result when the specified properties of a ManagedObjectReference 
MORef = ManagedObject to monitor
filterProps = properties to filter/retrieve from MORef
endWaitProps = property to monitor
expectedVals = values of property to monitor (endWaitProps) that will trigger command to emit result
*/

/* usage example for powering on and off a VMa VM */
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

      // fire powerOff command
      vc.powerOpVMByMORef( vmObj, 'powerOff')
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
```               

#### Events
  - result = emits when session authenticated with server
    - *result* contains the JSON-formatted result from the server
    - *raw* contains the raw SOAP XML response from the server
    - *soapHeader* contains any soapHeaders from the server
  - error = emits when there's an error
    - *err* contains the error

Make sure you check out tests/vsphere.test.js for examples on how to create commands to run

## Development

node-vsphere-soap uses a number of open source projects to work properly:

* [node.js] - evented I/O for the backend
* [node-vsphere-soap] - SOAP/WSDL vSphere/ESXi client for Node.js
* [lodash] - for quickly manipulating JSON
* [lab] - testing engine
* [code] - assertion engine used with lab

Want to contribute? Great!

### Todo's

 - Write More Tests
 - Create Travis CI test harness with a fake vCenter Instance
 - Add Code Comments

### Testing

I have been testing on a Mac with node v0.10.36 and both ESXi and vCenter 5.5.

To edit tests, edit the file **test/vsphere.test.js**

To point the module at your own vCenter/ESXi host, edit **config-test.stub.js** and save it as **config-test.js**

To run test scripts:

```sh
$ npm test
```


License
----
MIT


[vSphere Web Services API]:http://pubs.vmware.com/vsphere-55/topic/com.vmware.wssdk.apiref.doc/right-pane.html
[node-vsphere-soap]:https://github.com/reedog117/node-vsphere-soap
[node.js]:http://nodejs.org/
[code]:https://github.com/hapijs/code
[lab]:https://github.com/hapijs/lab
[lodash]:https://lodash.com/
[@reedog117]:http://www.twitter.com/reedog117

