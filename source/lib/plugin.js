/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// ---------------------------------
// Requires

// External
const extendr = require('extendr');
const typeChecker = require('typechecker');
const ambi = require('ambi');
const eachr = require('eachr');


// ---------------------------------
// Classes

// Define Plugin
/**
 * The base class for all DocPad plugins
 * @class BasePlugin
 * @constructor
 */
class BasePlugin {
	static initClass() {
	
		/**
		 * Add support for BasePlugin.extend(proto)
		 * @private
		 * @property {Object} @extend
		 */
		this.extend = require('csextends');
	
		// ---------------------------------
		// Inherited
	
		/**
		 * The DocPad Instance
		 * @private
		 * @property {Object} docpad
		 */
		this.prototype.docpad = null;
	
		// ---------------------------------
		// Variables
	
		/**
		 * The plugin name
		 * @property {String}
		 */
		this.prototype.name = null;
	
		/**
		 * The plugin config
		 * @property {Object}
		 */
		this.prototype.config = {};
	
		/**
		 * The instance config.
		 * @property {Object}
		 */
		this.prototype.instanceConfig = {};
	
		/**
		 * Plugin priority
		 * @private
		 * @property {Number}
		 */
		this.prototype.priority = 500;
	}

	/**
	 * Constructor method for the plugin
	 * @method constructor
	 * @param {Object} opts
	 */
	constructor(opts) {
		// Prepare
		this.setConfig = this.setConfig.bind(this);
		this.getConfig = this.getConfig.bind(this);
		const me = this;
		const {docpad,config} = opts;
		this.docpad = docpad;

		// Bind listeners
		this.bindListeners();

		// Swap out our configuration
		this.config = extendr.clone(this.config);
		this.instanceConfig = extendr.clone(this.instanceConfig);
		this.initialConfig = this.config;
		this.setConfig(config);

		// Return early if we are disabled
		if (this.isEnabled() === false) { return this; }

		// Listen to events
		this.addListeners();

		// Chain
		this;
	}

	/**
	 * Set Instance Configuration
	 * @private
	 * @method setInstanceConfig
	 * @param {Object} instanceConfig
	 */
	setInstanceConfig(instanceConfig) {
		// Merge in the instance configurations
		if (instanceConfig) {
			extendr.deepDefaults(this.instanceConfig, instanceConfig);
			if (this.config) { extendr.deepDefaults(this.config, instanceConfig); }
		}
		return this;
	}

	/**
	 * Set Configuration
	 * @private
	 * @method {Object} setConfig
	 * @param {Object} [instanceConfig=null]
	 */
	setConfig(instanceConfig=null) {
		// Prepare
		const { docpad } = this;
		const userConfig = this.docpad.config.plugins[this.name];
		this.config = (this.docpad.config.plugins[this.name] = {});

		// Instance config
		if (instanceConfig) { this.setInstanceConfig(instanceConfig); }

		// Merge configurations
		const configPackages = [this.initialConfig, userConfig, this.instanceConfig];
		const configsToMerge = [this.config];
		docpad.mergeConfigurations(configPackages, configsToMerge);

		// Remove listeners if we are disabled
		if (!this.isEnabled()) { this.removeListeners(); }

		// Chain
		return this;
	}

	/**
	 * Get the Configuration
	 * @private
	 * @method {Object}
	 */
	getConfig() {
		return this.config;
	}

	/**
	 * Alias for b/c
	 * @private
	 * @method bindEvents
	 */
	bindEvents() { return this.addListeners(); }


	/**
	 * Bind Listeners
	 * @private
	 * @method bindListeners
	 */
	bindListeners() {
		// Prepare
		const pluginInstance = this;
		const { docpad } = this;
		const events = docpad.getEvents();

		// Bind events
		eachr(events, function(eventName) {
			// Fetch the event handler
			const eventHandler = pluginInstance[eventName];

			// Check it exists and is a function
			if (typeChecker.isFunction(eventHandler)) {
				// Bind the listener to the plugin
				return pluginInstance[eventName] = eventHandler.bind(pluginInstance);
			}
		});

		// Chain
		return this;
	}


	/**
	 * Add Listeners
	 * @private
	 * @method addListeners
	 */
	addListeners() {
		// Prepare
		const pluginInstance = this;
		const { docpad } = this;
		const events = docpad.getEvents();

		// Bind events
		eachr(events, function(eventName) {
			// Fetch the event handler
			const eventHandler = pluginInstance[eventName];

			// Check it exists and is a function
			if (typeChecker.isFunction(eventHandler)) {
				// Apply the priority
				const eventHandlerPriority = pluginInstance[eventName+'Priority'] || pluginInstance.priority || null;
				if (eventHandler.priority == null) { eventHandler.priority = eventHandlerPriority; }
				if (eventHandler.priority != null) {
					Object.defineProperty(eventHandler, 'name', {
						value: '#{pluginInstance.name}: {eventName}(priority eventHandler.priority})',
						writable: true
					});
				} else {
					Object.defineProperty(eventHandler, 'name', {
						value: '#{pluginInstance.name}: {eventName}',
						writable: true
					});
				}

				// Wrap the event handler, and bind it to docpad
				return docpad
					.off(eventName, eventHandler)
					.on(eventName, eventHandler);
			}
		});

		// Chain
		return this;
	}


	/**
	 * Remove Listeners
	 * @private
	 * @method removeListeners
	 */
	removeListeners() {
		// Prepare
		const pluginInstance = this;
		const { docpad } = this;
		const events = docpad.getEvents();

		// Bind events
		eachr(events, function(eventName) {
			// Fetch the event handler
			const eventHandler = pluginInstance[eventName];

			// Check it exists and is a function
			if (typeChecker.isFunction(eventHandler)) {
				// Wrap the event handler, and unbind it from docpad
				return docpad.off(eventName, eventHandler);
			}
		});

		// Chain
		return this;
	}

	/**
	 * Destructor. Calls removeListeners
	 * @private
	 * @method destroy
	 */
	destroy() {
		this.removeListeners();
		return this;
	}


	/**
	 * Is Enabled?
	 * @method isEnabled
	 * @return {Boolean}
	 */
	isEnabled() {
		return this.config.enabled !== false;
	}
}
BasePlugin.initClass();


// ---------------------------------
// Export Plugin
module.exports = BasePlugin;
