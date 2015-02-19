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

      if( propertyArray && typeof propertyArray === 'array' && propertyArray.length > 0) {
        propertySpec = {
          attributes: {'xsi:type': 'PropertySpec'},
          type: type,
          all: false,
          pathSet: propertyArray
        };
      } else {
        propertySpec = {
          attributes: {'xsi:type': 'PropertySpec'},
          type: type,
          all: true
        };
      }

      var propertySpec = {
        attributes: {'xsi:type': 'PropertySpec'},
        type: type,
        all: false,
        pathSet: ['name']
      };
      Joi.validate(propertySpec, types.schemaPropertySpec, function(err, value) {
        if(err) {
          emitter.emit('error', err);
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
        }
      });

      self.vc.runCommand('RetrievePropertiesEx', { _this: propertyCollector, specSet: [ propertyFilterSpec ], options: {} })
        .once('result', function(result){
          //console.log('result : ' + util.inspect(result, {depth: null}));
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
/*
Client.prototype.powerOnVM = function( name ) {


};
*/

exports.Client = Client;

