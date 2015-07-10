/*
  types.js

  Declares datatypes used by the vsphere Client() class

*/

var Joi = require('joi'),
  _ = require('lodash');

// global Joi functions
var ManagedObjectTypes = [
  // only a subset of the allowed types are input
  // this is for efficiency reasons (only implementing as much as we need)
  'Alarm',
  'AlarmManager',
  'AuthorizationManager',
  'ClusterComputeResource',
  'ClusterProfile',
  'ClusterProfileManager',
  'ComputerResource',
  'ContainerView',
  'CustomFieldsManager',
  'CustomizationSpecManager',
  'Datacenter',
  'Datastore',
  'DatastoreNamespaceManager',
  'DiagnosticManager',
  'DistributedVirtualPortgroup',
  'DistributedVirtualSwitch',
  //...
  'Folder',
  'GuestFileManager',
  'GuestOperationsManager',
  'InventoryView',
  'ListView',
  'Network',
  'PropertyCollector',
  'PropertyFilter',
  'ResourcePool',
  'ScheduledTask',
  'ScheduledTaskManager',
  'ServiceInstance',
  'ServiceManager',
  'SessionManager',
  'Task',
  'TaskManager',
  'UserDirectory',
  'View',
  'ViewManager',
  'VirtualMachine',
  'VirtualMachineProvisioningChecker',
  'VirtualMachineSnapshot'
];

// ------------------------------------------

var schemaManagedObjectReference = Joi.object({
  // attributes: { 'xsi:type': Joi.string().valid('ManagedObjectReference').required() },
  attributes: Joi.object().required(),
  //type: Joi.string().valid( ManagedObjectTypes ).required(),
  value: Joi.string().required()
});
exports.schemaManagedObjectReference = schemaManagedObjectReference;


var schemaSelectionSpec = Joi.object({
  // attributes: { 'xsi:type': Joi.string().valid('SelectionSpec').required() },
  attributes: Joi.object().required(),
  name: Joi.string()
});
exports.schemaSelectionSpec = schemaSelectionSpec;


var schemaTraversalSpec = Joi.object( {
  // attributes: { 'xsi:type': Joi.string().valid('TraversalSpec').required() },
  attributes: Joi.object().required(),
  name: Joi.string(),
  path: Joi.string().required(),
  selectSet: Joi.array().sparse(), 
  type: Joi.string().valid( ManagedObjectTypes ).required(),
  skip: Joi.boolean()
});
exports.schemaTraversalSpec = schemaTraversalSpec;


var schemaObjectSpec = Joi.object({
  // attributes: { 'xsi:type': Joi.string().valid('ObjectSpec').required() },
  attributes: Joi.object().required(),
  obj: Joi.object(), // ManagedObjectReference
  skip: Joi.boolean(),
  selectSet: Joi.array().items( schemaSelectionSpec, schemaTraversalSpec )
});
exports.schemaObjectSpec = schemaObjectSpec;


var schemaPropertySpec = Joi.object({
  // attributes: { 'xsi:type': Joi.string().valid('PropertySpec').required() },
  attributes: Joi.object().required(),
  all: Joi.boolean(),
  pathSet: Joi.array().items( Joi.string() ),
  type: Joi.string().valid( ManagedObjectTypes ).required(),
});
exports.schemaPropertySpec = schemaPropertySpec;

var schemaPropertyFilterSpec = Joi.object({
  // attributes: { 'xsi:type': Joi.string().valid('PropertyFilterSpec').required() },
  attributes: Joi.object().required(),
  objectSet: Joi.array().min(1).items( schemaObjectSpec ).required(),
  propSet: Joi.array().min(1).items( schemaPropertySpec ).required(),
  reportMissingObjectsInResults: Joi.boolean()
});
exports.schemaPropertyFilterSpec = schemaPropertyFilterSpec;


var schemaRetrieveOptions = Joi.object({
  // attributes: { 'xsi:type': Joi.string().valid('RetrieveOptions').required() },
  attributes: Joi.object().required(),
  maxObjects: Joi.number().min(1).integer()
});
exports.schemaRetrieveOptions = schemaRetrieveOptions;




