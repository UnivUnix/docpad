/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// ---------------------------------
// Requires

// Standard Library
const pathUtil = require('path');
const util = require('util');

// External
const semver = require('semver');
const safefs = require('safefs');



// ---------------------------------
// Classes

// Define Plugin Loader
/**
 * The Plugin Loader class
 * @class PluginLoader
 * @constructor
 */
class PluginLoader {
	static initClass() {
	
		// ---------------------------------
		// Constructed
	
		/**
		 * The DocPad Instance
		 * @private
		 * @property {Object} docpad
		 */
		this.prototype.docpad = null;
	
	
		/**
		 * The BasePlugin Class
		 * @private
		 * @property {Object}
		 */
		this.prototype.BasePlugin = null;
	
	
		/**
		 * The full path of the plugin's directory
		 * @private
		 * @property {String}
		 */
		this.prototype.dirPath = null;
	
	
		// ---------------------------------
		// Loaded
	
		/**
		 * The full path of the plugin's package.json file
		 * @private
		 * @property {String}
		 */
		this.prototype.packagePath = null;
	
		/**
		 * The parsed contents of the plugin's package.json file
		 * @private
		 * @property {Object}
		 */
		this.prototype.packageData = {};
	
		/**
		 * The full path of the plugin's main file
		 * @private
		 * @property {String}
		 */
		this.prototype.pluginPath = null;
	
	
		/**
		 * The parsed content of the plugin's main file
		 * @private
		 * @property {Object}
		 */
		this.prototype.pluginClass = {};
	
		/**
		 * The plugin name
		 * @private
		 * @property {String}
		 */
		this.prototype.pluginName = null;
	
		/**
		 * The plugin version
		 * @private
		 * @property {String}
		 */
		this.prototype.pluginVersion = null;
	
		/**
		 * Node modules path
		 * @private
		 * @property {String}
		 */
		this.prototype.nodeModulesPath = null;
	}


	// ---------------------------------
	// Functions

	/**
	 * Constructor method
	 * @method constructor
	 * @param {Object} opts
	 * @param {Object} opts.docpad The docpad instance that we are loading plugins for
	 * @param {String} opts.dirPath The directory path of the plugin
	 * @param {Object} opts.BasePlugin The base plugin class
	 */
	constructor({docpad1,dirPath,BasePlugin}) {
		// Prepare
		this.docpad = docpad1;
		this.dirPath = dirPath;
		this.BasePlugin = BasePlugin;
		const { docpad } = this;

		// Apply
		this.pluginName = pathUtil.basename(this.dirPath).replace(/^docpad-plugin-/,'');
		this.pluginClass = {};
		this.packageData = {};
		this.nodeModulesPath = pathUtil.resolve(this.dirPath, 'node_modules');
	}


	/**
	 * Loads the package.json file and extracts the main path
	 * next(err,exists)
	 * @method exists
	 * @param {Function} next
	 */
	exists(next) {
		// Prepare
		const packagePath = this.packagePath || pathUtil.resolve(this.dirPath, "package.json");
		const failure = (err=null) => next(err, false);
		const success = () => next(null, true);

		// Check the package
		safefs.exists(packagePath, exists => {
			if (!exists) { return failure(); }

			// Apply
			this.packagePath = packagePath;

			// Read the package
			return safefs.readFile(packagePath, (err,data) => {
				if (err) { return failure(err); }

				// Parse the package
				try {
					this.packageData = JSON.parse(data.toString());
				} catch (error) {
					err = error;
					return failure(err);
				}
				finally {
					if (!this.packageData) { return failure(); }
				}

				// Extract the version and main
				const pluginVersion = this.packageData.version;
				const pluginPath = this.packageData.main && pathUtil.join(this.dirPath, this.packageData.main);

				// Check defined
				if (!pluginVersion) { return failure(); }
				if (!pluginPath) { return failure(); }

				// Success
				this.pluginVersion = pluginVersion;
				this.pluginPath = pluginPath;
				return success();
			});
		});

		// Chain
		return this;
	}

	/**
	 * Check if this plugin is unsupported
	 * Boolean value returned as a parameter
	 * in the passed callback
	 * next(err,supported)
	 * @method unsupported
	 * @param {Function} next
	 */
	unsupported(next) {
		// Prepare
		const { docpad } = this;

		// Extract
		const { version } = this.packageData;
		const keywords = this.packageData.keywords || [];
		const platforms = this.packageData.platforms || [];
		const engines = this.packageData.engines || {};
		const peerDependencies = this.packageData.peerDependencies || {};

		// Check
		const unsupported =
			// Check type
			!Array.from(keywords).includes('docpad-plugin') ?
				'type'

			// Check version
			: version && !semver.satisfies(version, docpad.pluginVersion) ?
				'version-plugin'

			// Check platform
			: platforms.length && !Array.from(platforms).includes(process.platform) ?
				'platform'

			// Check node engine
			: (engines.node != null) && !semver.satisfies(process.version, engines.node) ?
				'engine-node'

			// Check docpad engine
			: (engines.docpad != null) && !semver.satisfies(docpad.getVersion(), engines.docpad) ?
				'version-docpad'

			// Check docpad peerDependencies
			: (peerDependencies.docpad != null) && !semver.satisfies(docpad.getVersion(), peerDependencies.docpad) ?
				'version-docpad'

			// Supported
			:
				false;

		// Supported
		next(null, unsupported);

		// Chain
		return this;
	}

	/**
	 * Installs the plugins node modules.
	 * next(err)
	 * @private
	 * @method install
	 * @param {Function} next
	 */
	install(next) {
		// Prepare
		const { docpad } = this;

		// Only install if we have a package path
		if (this.packagePath) {
			// Install npm modules
			docpad.initNodeModules({
				path: this.dirPath,
				next(err,results) {
					// Forward
					return next(err);
				}
			});
		} else {
			// Continue
			next();
		}

		// Chain
		return this;
	}

	/**
	 * Load in the pluginClass from the plugin file.
	 * The plugin class that has been loaded is returned
	 * in the passed callback
	 * next(err,pluginClass)
	 * @method load
	 * @param {Function} next
	 */
	load(next) {
		// Prepare
		let err;
		const { docpad } = this;
		const locale = docpad.getLocale();

		// Ensure we still have deprecated support for old-style uncompiled plugins
		if (pathUtil.extname(this.pluginPath) === '.coffee') {
			// Warn the user they are trying to include an uncompiled plugin (if they want to be warned)
			// They have the option of opting out of warnings for private plugins
			if ((this.packageData.private !== true) || (docpad.getConfig().warnUncompiledPrivatePlugins !== false)) {
				docpad.warn(util.format(locale.pluginUncompiled, this.pluginName, (this.packageData.bugs != null ? this.packageData.bugs.url : undefined) || locale.pluginIssueTracker));
			}

			// Attempt to include the coffee-script register extension
			// coffee-script is an external party dependency (docpad doesn't depend on it, so we don't install it)
			// so we may not have it, hence the try catch
			try {
				require('coffee-script/register');
			} catch (error) {
				// Including coffee-script has failed, so let the user know, and exit
				err = error;
				err.context = util.format(locale.pluginUncompiledFailed, this.pluginName, (this.packageData.bugs != null ? this.packageData.bugs.url : undefined) || locale.pluginIssueTracker);
				return next(err); this;
			}
		}


		// Attempt to load the plugin
		try {
			this.pluginClass = require(this.pluginPath)(this.BasePlugin);
		} catch (error1) {
			// Loading the plugin has failed, so let the user know, and exit
			err = error1;
			err.context = util.format(locale.pluginLoadFailed, this.pluginName, (this.packageData.bugs != null ? this.packageData.bugs.url : undefined) || locale.pluginIssueTracker);
			return next(err); this;
		}

		// Plugin loaded, inject it's version and grab its name
		if (this.pluginClass.prototype.version == null) { this.pluginClass.prototype.version = this.pluginVersion; }
		const pluginPrototypeName = this.pluginClass.prototype.name;

		// Check Alphanumeric Name
		if (/^[a-z0-9]+$/.test(this.pluginName) === false) {
			const validPluginName = this.pluginName.replace(/[^a-z0-9]/,'');
			docpad.warn(util.format(locale.pluginNamingConventionInvalid, this.pluginName, validPluginName));
		}

		// Check for Empty Name
		if (pluginPrototypeName === null) {
			this.pluginClass.prototype.name = this.pluginName;
			docpad.warn(util.format(locale.pluginPrototypeNameUndefined, this.pluginName));

		// Check for Same Name
		} else if (pluginPrototypeName !== this.pluginName) {
			docpad.warn(util.format(locale.pluginPrototypeNameDifferent, this.pluginName, pluginPrototypeName));
		}

		// Return our plugin
		next(null, this.pluginClass);

		// Chain
		return this;
	}

	/**
	 * Create an instance of a plugin
	 * defined by the passed config.
	 * The plugin instance is returned in
	 * the passed callback.
	 * next(err,pluginInstance)
	 * @method create
	 * @param {Object} config
	 * @param {Function} next
	 */
	create(config,next) {
		// Load
		let pluginInstance;
		try {
			// Create instance with merged configuration
			const { docpad } = this;
			pluginInstance = new this.pluginClass({docpad,config});
		} catch (err) {
			// An error occured, return it
			return next(err, null);
		}

		// Return our instance
		return next(null, pluginInstance);

		// Chain
		return this;
	}
}
PluginLoader.initClass();


// ---------------------------------
// Export
module.exports = PluginLoader;
