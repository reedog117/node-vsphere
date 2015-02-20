"use strict";
/*
  client.js

  Implements the vsphere Client() class

*/

var EventEmitter = require('events').EventEmitter,
  util = require('util'),
  nvs = require('node-vsphere-soap'),
  types = require('./types'),
  Joi = require('joi'),
  joiModel = require('joi-model'),
  _ = require('lodash');

// Client class
function Client( hostname, username, password, sslVerify) {

  var self = this;

  EventEmitter.call(this);

  this.serviceContent = undefined;

  var vc = new nvs.Client( hostname, username, password, sslVerify);
  vc.once('ready', function() {
    self.serviceContent = vc.serviceContent;
    self.emit('ready');
  });

  this.vc = vc;

  return this;

}

util.inherits(Client, EventEmitter);

// run arbitrary vSphere API command
Client.prototype.runCommand = function( command, args) {

  return this.vc.runCommand( command, args );

};

Client.prototype.getMORefsInContainerByType = function( MORefFolder, type ) {

  return this.getMORefsInContainerByTypeAndPropertyArray( MORefFolder, type, undefined );

};

Client.prototype.getMORefsInContainerByTypeAndPropertyArray = function( MORefFolder, type, propertyArray ) {

  var viewManager = this.vc.serviceContent.viewManager;
  var propertyCollector = this.vc.serviceContent.propertyCollector;

  var containerView;

  var emitter = new EventEmitter;
  var self = this;

  this.vc.runCommand('CreateContainerView', { _this: viewManager,
                                        container: MORefFolder,
                                        type: type,
                                        recursive: true})
    .on('result', function(result) {

      containerView = result.returnval;

      var propertySpec = {};

      if( propertyArray && typeof propertyArray === 'object' && propertyArray.length > 0) {
        propertySpec = {
          attributes: {'xsi:type': 'PropertySpec'},
          type: type,
          all: false,
          pathSet: propertyArray
        };
      } else if( propertyArray && typeof propertyArray === 'string') {
        propertySpec = {
          attributes: {'xsi:type': 'PropertySpec'},
          type: type,
          all: false,
          pathSet: [ propertyArray ]
        };
      } else {
        propertySpec = {
          attributes: {'xsi:type': 'PropertySpec'},
          type: type,
          all: true
        };
      }
      Joi.validate(propertySpec, types.schemaPropertySpec, function(err, value) {
        if(err) {
          emitter.emit('error', err);
          return;
        }
      });

      var traversalSpec = {
        attributes: {'xsi:type': 'TraversalSpec'},
        type: 'ContainerView',
        path: 'view',
        skip: false
      };
      Joi.validate(traversalSpec, types.schemaTraversalSpec, function(err, value) {
        if(err) {
          emitter.emit('error', err);
          return;
        }
      });

      var objectSpec = {
        attributes: {'xsi:type': 'ObjectSpec'},
        obj: containerView,
        skip: true,
        selectSet: [ traversalSpec ]
      };
      Joi.validate(objectSpec, types.schemaObjectSpec, function(err, value) {
        if(err) {
          emitter.emit('error', err);
          return;
        }
      });

      var propertyFilterSpec = {
        attributes: {'xsi:type': 'PropertyFilterSpec'},
        propSet: [ propertySpec ],
        objectSet: [ objectSpec ]
      };
      Joi.validate(propertyFilterSpec, types.schemaPropertyFilterSpec, function(err, value) {
        if(err) {
          emitter.emit('error', err);
          return;
        }
      });

      self.vc.runCommand('RetrievePropertiesEx', { _this: propertyCollector, specSet: [ propertyFilterSpec ], options: {} })
        .once('result', function(result){
          emitter.emit('result', result);
        })
        .once('error', function(err){
          console.error('\nlast request : ' + self.vc.client.lastRequest + '\n');
          emitter.emit('error', err);
        });

    })
    .once('error', function(err){
      console.error(err);
      emitter.emit('error', err);
    });

  return emitter;
};

// this function returns information in the following format
/* [{ obj: { attributes: { type: 'VirtualMachine' }, '$value': '4' },
    name: 'testvm-win',
    powerState: 'poweredOff' }
*/
Client.prototype.getVMinContainerPowerState = function( MORefFolder ) {

  var self = this;

  var emitter = new EventEmitter;

  this.getMORefsInContainerByTypeAndPropertyArray( MORefFolder, 'VirtualMachine', 'summary')
    .once('result', function(result) {

      // if no vms, return empty set
      if( _.isEmpty(result)) {
        emitter.emit('result', []);
        return;
      }

      var data = result.returnval.objects;

      var resultArray = [];

      _.forEach(data, function(vm) {
        resultArray.push({
          obj: vm.obj,
          name: vm.propSet.val.config.name,
          powerState: vm.propSet.val.runtime.powerState
        });
        if( resultArray.length === data.length ) {
          emitter.emit('result',resultArray);
        }
      });
    })
    .once('error', function(err){
      console.error(err);
      emitter.emit('error', err);
    });

  return emitter;


};
/*
Client.prototype.powerOnVM = function( name ) {


};
*/

exports.Client = Client;

