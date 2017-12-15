/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS203: Remove `|| {}` from converted for-own loops
 * DS204: Change includes calls to have a more natural evaluation order
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
//
// The central module for DocPad
// @module DocPad
//

// =====================================
// This block *must* come first

// Node 0.10 compat
import * as babelPolyfill from 'babel-polyfill'

// !! Important !!
import * as pathUtil from 'path'
import * as lazyRequire from 'lazy-require'

const corePath = pathUtil.resolve(__dirname, '..', '..')

// =====================================
// Requires

// Standard Library
import * as util from 'util'

// External
import * as queryEngine from 'query-engine'
import {uniq, union, pick} from 'underscore'
import * as CSON from 'cson'
import * as balUtil from 'bal-util'
import * as scandir from 'scandirectory'
import * as extendr from 'extendr'
import * as eachr from 'eachr'
import * as typeChecker from 'typechecker'
import * as ambi from 'ambi'
import TaskGroup from 'taskgroup'
import * as safefs from 'safefs'
import * as safeps from 'safeps'
import * as ignorefs from 'ignorefs'
import * as rimraf from 'rimraf'
import * as superAgent from 'superagent'
import * as extractOptsAndCallback from 'extract-opts'
import EventEmitterGrouped from 'event-emitter-grouped'

// Base
import {Events, Model, Collection, QueryCollection} from './base'

// Utils
import DocpadUtil from './util'

// Models
import FileModel from './models/file'
const DocumentModel = require('./models/document')

// Collections
const FilesCollection = require('./collections/files')
const ElementsCollection = require('./collections/elements')
const MetaCollection = require('./collections/meta')
const ScriptsCollection = require('./collections/scripts')
const StylesCollection = require('./collections/styles')

// Plugins
const PluginLoader = require('./plugin-loader')
const BasePlugin = require('./plugin')


// ---------------------------------
// Helpers

const setImmediate = (typeof global !== 'undefined' && global !== null ? global.setImmediate : null) || process.nextTick  // node 0.8 b/c


// ---------------------------------
// Variables

const isUser = DocpadUtil.isUser()


/**
 * Contains methods for managing the DocPad application.
 * This includes managing a DocPad projects files and
 * documents, watching directories, emitting events and
 * managing the node.js/express.js web server.
 * Extends https://github.com/bevry/event-emitter-grouped
 *
 * The class is instantiated in the docpad-server.js file
 * which is the entry point for a DocPad application.
 *
 * 	new DocPad(docpadConfig, function(err, docpad) {
 * 		if (err) {
 * 			return docpadUtil.writeError(err);
 * 		}
 * 		return docpad.action(action, function(err) {
 * 			if (err) {
 * 				return docpadUtil.writeError(err);
 * 			}
 * 			return console.log('OK');
 * 		});
 * 	});
 *
 * @class Docpad
 * @constructor
 * @extends EventEmitterGrouped
 */
export class DocPad extends EventEmitterGrouped {
	static initClass() {
	
	
		// =================================
		// Variables
	
		// ---------------------------------
		// Modules
	
		// ---------------------------------
		// Base
	
		/**
		 * Events class
		 * https://github.com/docpad/docpad/blob/master/src/lib/base.coffee
		 * @property {Object} Events
		 */
		this.prototype.Events = Events;
	
		/**
		 * Model class
		 * Extension of the Backbone Model class
		 * http://backbonejs.org/#Model
		 * https://github.com/docpad/docpad/blob/master/src/lib/base.coffee
		 * @property {Object} Model
		 */
		this.prototype.Model = Model;
	
		/**
		 * Collection class
		 * Extension of the Backbone Collection class
		 * https://github.com/docpad/docpad/blob/master/src/lib/base.coffee
		 * http://backbonejs.org/#Collection
		 * @property {Object} Collection
		 */
		this.prototype.Collection = Collection;
	
		/**
		 * QueryCollection class
		 * Extension of the Query Engine QueryCollection class
		 * https://github.com/docpad/docpad/blob/master/src/lib/base.coffee
		 * https://github.com/bevry/query-engine/blob/master/src/documents/lib/query-engine.js.coffee
		 * @property {Object} QueryCollection
		 */
		this.prototype.QueryCollection = QueryCollection;
	
		// ---------------------------------
		// Models
	
		/**
		 * File Model class
		 * Extension of the Model class
		 * https://github.com/docpad/docpad/blob/master/src/lib/models/file.coffee
		 * @property {Object} FileModel
		 */
		this.prototype.FileModel = FileModel;
	
		/**
		 * Document Model class
		 * Extension of the File Model class
		 * https://github.com/docpad/docpad/blob/master/src/lib/models/document.coffee
		 * @property {Object} DocumentModel
		 */
		this.prototype.DocumentModel = DocumentModel;
	
		// ---------------------------------
		// Collections
	
		/**
		 * Collection of files in a DocPad project
		 * Extension of the QueryCollection class
		 * https://github.com/docpad/docpad/blob/master/src/lib/collections/files.coffee
		 * @property {Object} FilesCollection
		 */
		this.prototype.FilesCollection = FilesCollection;
	
		/**
		 * Collection of elements in a DocPad project
		 * Extension of the Collection class
		 * https://github.com/docpad/docpad/blob/master/src/lib/collections/elements.coffee
		 * @property {Object} ElementsCollection
		 */
		this.prototype.ElementsCollection = ElementsCollection;
	
		/**
		 * Collection of metadata in a DocPad project
		 * Extension of the ElementsCollection class
		 * https://github.com/docpad/docpad/blob/master/src/lib/collections/meta.coffee
		 * @property {Object} MetaCollection
		 */
		this.prototype.MetaCollection = MetaCollection;
	
		/**
		 * Collection of JS script files in a DocPad project
		 * Extension of the ElementsCollection class
		 * https://github.com/docpad/docpad/blob/master/src/lib/collections/scripts.coffee
		 * @property {Object} ScriptsCollection
		 */
		this.prototype.ScriptsCollection = ScriptsCollection;
	
		/**
		 * Collection of CSS style files in a DocPad project
		 * Extension of the ElementsCollection class
		 * https://github.com/docpad/docpad/blob/master/src/lib/collections/styles.coffee
		 * @property {Object} StylesCollection
		 */
		this.prototype.StylesCollection = StylesCollection;
	
		/**
		 * Plugin Loader class
		 * https://github.com/docpad/docpad/blob/master/src/lib/plugin-loader.coffee
		 * Loads the DocPad plugins from the file system into
		 * a DocPad project
		 * @property {Object} PluginLoader
		 */
		this.prototype.PluginLoader = PluginLoader;
	
		/**
		 * Base class for all DocPad plugins
		 * https://github.com/docpad/docpad/blob/master/src/lib/plugin.coffee
		 * @property {Object} BasePlugin
		 */
		this.prototype.BasePlugin = BasePlugin;
	
		// ---------------------------------
		// DocPad
	
		/**
		 * DocPad's version number
		 * @private
		 * @property {Number} version
		 */
		this.prototype.version = null;
	
		/**
		 * The plugin version requirements
		 * @property {String} pluginVersion
		 */
		this.prototype.pluginVersion = '3';
	
		/**
		 * The express.js server instance bound to DocPad.
		 * http://expressjs.com
		 * @private
		 * @property {Object} serverExpress
		 */
		this.prototype.serverExpress = null;
	
		/**
		 * The Node.js http server instance bound to DocPad
		 * https://nodejs.org/api/http.html
		 * @private
		 * @property {Object} serverHttp
		 */
		this.prototype.serverHttp = null;
			// @TODO figure out how to destroy the express server
	
		//
		/**
		 * Internal property. The caterpillar logger instances bound to DocPad
		 * @private
		 * @property {Object} loggerInstances
		 */
		this.prototype.loggerInstances = null;
	
		/**
		 * The action runner instance bound to docpad
		 * @private
		 * @property {Object} actionRunnerInstance
		 */
		this.prototype.actionRunnerInstance = null;
	
	
		/**
		 * The error runner instance bound to DocPad
		 * @property {Object} errorRunnerInstance
		 */
		this.prototype.errorRunnerInstance = null;
	
		/**
		 * The track runner instance bound to DocPad
		 * @private
		 * @property {Object} trackRunnerInstance
		 */
		this.prototype.trackRunnerInstance = null;
	
	
		/**
		 * Event Listing. String array of event names.
		 * Whenever an event is created, it must be applied here to be available to plugins and configuration files
		 * Events must be sorted by the order of execution, not for a functional need, but for a documentation need
		 * Whenever this array changes, also update: https://docpad.org/docs/events/
		 * @private
		 * @property {Array} string array of event names
		 */
		this.prototype.events = [
			'extendCollections',            // fired each load
			'extendTemplateData',           // fired each load
			'docpadLoaded',                 // fired multiple times, first time command line configuration hasn't been applied yet
			'docpadReady',                  // fired only once
			'docpadDestroy',                // fired once on shutdown
			'consoleSetup',                 // fired once
			'generateBefore',
			'populateCollectionsBefore',
			'populateCollections',
			'contextualizeBefore',
			'contextualizeAfter',
			'renderBefore',
			'renderCollectionBefore',
			'render',                       // fired for each extension conversion
			'renderDocument',               // fired for each document render, including layouts and render passes
			'renderCollectionAfter',
			'renderAfter',
			'writeBefore',
			'writeAfter',
			'generateAfter',
			'generated',
			'serverBefore',
			'serverExtend',
			'serverAfter',
			'notify'
		];
	
	
		// ---------------------------------
		// Collections
	
		// Database collection
	
		/**
		 * QueryEngine collection
		 * @private
		 * @property {Object} database
		 */
		this.prototype.database = null;
	
		/**
		 * A FilesCollection of models updated
		 * from the DocPad database after each regeneration.
		 * @private
		 * @property {Object} databaseTempCache FileCollection of models
		 */
		this.prototype.databaseTempCache = null;
	
		/**
		 * Files by url. Used to speed up fetching
		 * @private
		 * @property {Object} filesByUrl
		 */
		this.prototype.filesByUrl = null;
	
		/**
		 * Files by Selector. Used to speed up fetching
		 * @private
		 * @property {Object} filesBySelector
		 */
		this.prototype.filesBySelector = null;
	
		/**
		 * Files by Out Path. Used to speed up conflict detection. Do not use for anything else
		 * @private
		 * @property {Object} filesByOutPath
		 */
		this.prototype.filesByOutPath = null;
	
		/**
		 * Blocks
		 * @private
		 * @property {Object} blocks
		 */
		this.prototype.blocks = null;
	
		/**
		 * The DocPad collections
		 * @private
		 * @property {Object} collections
		 */
		this.prototype.collections = null;
	
	
		// ---------------------------------
		// Skeletons
	
	
		/**
		 * Skeletons Collection
		 * @private
		 * @property {Object} skeletonsCollection
		 */
		this.prototype.skeletonsCollection = null;
	
	
		// ---------------------------------
		// Plugins
	
	
		/**
		 * Plugins that are loading really slow
		 * @property {Object} slowPlugins
		 */
		this.prototype.slowPlugins = null;  // {}
	
		/**
		 * Loaded plugins indexed by name
		 * @property {Object} loadedPlugins
		 */
		this.prototype.loadedPlugins = null;  // {}
	
		/**
		 * A listing of all the available extensions for DocPad
		 * @property {Object} exchange
		 */
		this.prototype.exchange = null;  // {}
	
		// -----------------------------
		// Paths
	
		/**
		 * The DocPad directory
		 * @property {String} corePath
		 */
		this.prototype.corePath = corePath;
	
		/**
		 * The DocPad library directory
		 * @private
		 * @property {String} libPath
		 */
		this.prototype.libPath = __dirname;
	
		/**
		 * The main DocPad file
		 * @property {String} mainPath
		 */
		this.prototype.mainPath = pathUtil.resolve(__dirname, 'docpad');
	
		/**
		 * The DocPad package.json path
		 * @property {String} packagePath
		 */
		this.prototype.packagePath = pathUtil.resolve(__dirname, '..', '..', 'package.json');
	
		/**
		 * The DocPad locale path
		 * @property {String} localePath
		 */
		this.prototype.localePath = pathUtil.resolve(__dirname, '..', '..', 'locale');
	
		/**
		 * The DocPad debug log path (docpad-debug.log)
		 * @property {String} debugLogPath
		 */
		this.prototype.debugLogPath = pathUtil.join(process.cwd(), 'docpad-debug.log');
	
		/**
		 * The User's configuration path (.docpad.cson)
		 * @property {String} userConfigPath
		 */
		this.prototype.userConfigPath = '.docpad.cson';
	
		// -----------------------------
		// Template Data
	
	
		/**
		 * Description for initialTemplateData
		 * @private
		 * @property {Object} initialTemplateData
		 */
		this.prototype.initialTemplateData = null;  // {}
	
		/**
		 * Plugin's Extended Template Data
		 * @private
		 * @property {Object} pluginsTemplateData
		 */
		this.prototype.pluginsTemplateData = null;
	
	
		// -----------------------------
		// Locales
	
		/**
		 * Determined locale
		 * @private
		 * @property {Object} locale
		 */
		this.prototype.locale = null;
	
	
		// -----------------------------
		// Configuration
	
		/**
		 * Hash Key
		 * The key that we use to hash some data before sending it to our statistic server
		 * @private
		 * @property {String} string constant
		 */
		this.prototype.hashKey = '7>9}$3hP86o,4=@T';  // const
	
		/**
		 * Website Package Configuration
		 * @private
		 * @property {Object} websitePackageConfig
		 */
		this.prototype.websitePackageConfig = null;  // {}
	
		/**
		 * Merged Configuration
		 * Merged in the order of:
		 * - initialConfig
		 * - userConfig
		 * - websiteConfig
		 * - instanceConfig
		 * - environmentConfig
		 * Use getConfig to retrieve this value
		 * @private
		 * @property {Object} config
		 */
		this.prototype.config = null;  // {}
	
	
		/**
		 * Instance Configuration
	
		 * @private
		 * @property {Object} instanceConfig
		 */
		this.prototype.instanceConfig = null;  // {}
	
		/**
		 * Website Configuration
		 * Merged into the config property
		 * @private
		 * @property {Object} websiteConfig
		 */
		this.prototype.websiteConfig = null;  // {}
	
		/**
		 * User Configuraiton
		 * Merged into the config property
		 * @private
		 * @property {Object} userConfig
		 */
		this.prototype.userConfig = {
			// Name
			name: null,
	
			// Email
			email: null,
	
			// Username
			username: null,
	
			// Subscribed
			subscribed: null,
	
			// Subcribe Try Again
			// If our subscription has failed, when should we try again?
			subscribeTryAgain: null,
	
			// Terms of Service
			tos: null,
	
			// Identified
			identified: null
		};
	
		/**
		 * Initial Configuration. The default docpadConfig
		 * settings that can be overridden in a project's docpad.coffee file.
		 * Merged into the config property
		 * @private
		 * @property {Object} initialConfig
		 */
		this.prototype.initialConfig = {
	
			// -----------------------------
			// Plugins
	
			// Force re-install of all plugin dependencies
			force: false,
	
			// Whether or not we should use the global docpad instance
			global: false,
	
			// Whether or not we should enable plugins that have not been listed or not
			enableUnlistedPlugins: true,
	
			// Plugins which should be enabled or not pluginName: pluginEnabled
			enabledPlugins: {},
	
			// Whether or not we should skip unsupported plugins
			skipUnsupportedPlugins: true,
	
			// Whether or not to warn about uncompiled private plugins
			warnUncompiledPrivatePlugins: true,
	
			// Configuration to pass to any plugins pluginName: pluginConfiguration
			plugins: {},
	
	
			// -----------------------------
			// Project Paths
	
			// The project directory
			rootPath: process.cwd(),
	
			// The project's database cache path
			databaseCachePath: '.docpad.db',
	
			// The project's package.json path
			packagePath: 'package.json',
	
			// The project's configuration paths
			// Reads only the first one that exists
			// If you want to read multiple configuration paths, then point it to a coffee|js file that requires
			// the other paths you want and exports the merged config
			configPaths: [
				'docpad.js',
				'docpad.coffee',
				'docpad.json',
				'docpad.cson'
			],
	
			// Plugin directories to load
			pluginPaths: [],
	
			// The project's plugins directory
			pluginsPaths: [
				'node_modules',
				'plugins'
			],
	
			// Paths that we should watch for reload changes in
			reloadPaths: [],
	
			// Paths that we should watch for regeneration changes in
			regeneratePaths: [],
	
			// The time to wait after a source file has changed before using it to regenerate
			regenerateDelay: 100,
	
			// The time to wait before outputting the files we are waiting on
			slowFilesDelay: 20*1000,
	
			// The project's out directory
			outPath: 'out',
	
			// The project's src directory
			srcPath: 'src',
	
			// The project's documents directories
			// relative to the srcPath
			documentsPaths: [
				'documents',
				'render'
			],
	
			// The project's files directories
			// relative to the srcPath
			filesPaths: [
				'files',
				'static',
				'public'
			],
	
			// The project's layouts directory
			// relative to the srcPath
			layoutsPaths: [
				'layouts'
			],
	
			// Ignored file patterns during directory parsing
			ignorePaths: false,
			ignoreHiddenFiles: false,
			ignoreCommonPatterns: true,
			ignoreCustomPatterns: false,
	
			// Watch options
			watchOptions: null,
	
	
			// -----------------------------
			// Server
	
			// Port
			// The port that the server should use
			// Defaults to these environment variables:
			// - PORT — Heroku, Nodejitsu, Custom
			// - VCAP_APP_PORT — AppFog
			// - VMC_APP_PORT — CloudFoundry
			port: null,
	
			// Hostname
			// The hostname we wish to listen to
			// Defaults to these environment variables:
			// HOSTNAME — Generic
			// Do not set to "localhost" it does not work on heroku
			hostname: null,
	
			// Max Age
			// The caching time limit that is sent to the client
			maxAge: 86400000,
	
			// Server
			// The Express.js server that we want docpad to use
			serverExpress: null,
			// The HTTP server that we want docpad to use
			serverHttp: null,
	
			// Extend Server
			// Whether or not we should extend the server with extra middleware and routing
			extendServer: true,
	
			// Which middlewares would you like us to activate
			// The standard middlewares (bodyParser, methodOverride, express router)
			middlewareStandard: true,
			// The standard bodyParser middleware
			middlewareBodyParser: true,
			// The standard methodOverride middleware
			middlewareMethodOverride: true,
			// The standard express router middleware
			middlewareExpressRouter: true,
			// Our own 404 middleware
			middleware404: true,
			// Our own 500 middleware
			middleware500: true,
	
	
			// -----------------------------
			// Logging
	
			// Log Level
			// Which level of logging should we actually output
			logLevel: ((Array.from(process.argv).includes('-d')) ? 7 : 6),
	
			// Catch uncaught exceptions
			catchExceptions: true,
	
			// Report Errors
			// Whether or not we should report our errors back to DocPad
			// By default it is only enabled if we are not running inside a test
			reportErrors: process.argv.join('').indexOf('test') === -1,
	
			// Report Statistics
			// Whether or not we should report statistics back to DocPad
			// By default it is only enabled if we are not running inside a test
			reportStatistics: process.argv.join('').indexOf('test') === -1,
	
			// Color
			// Whether or not our terminal output should have color
			// `null` will default to what the terminal supports
			color: null,
	
	
			// -----------------------------
			// Other
	
			// Utilise the database cache
			databaseCache: false,  // [false, true, 'write']
	
			// Detect Encoding
			// Should we attempt to auto detect the encoding of our files?
			// Useful when you are using foreign encoding (e.g. GBK) for your files
			detectEncoding: false,
	
			// Render Single Extensions
			// Whether or not we should render single extensions by default
			renderSingleExtensions: false,
	
			// Render Passes
			// How many times should we render documents that reference other documents?
			renderPasses: 1,
	
			// Offline
			// Whether or not we should run in offline mode
			// Offline will disable the following:
			// - checkVersion
			// - reportErrors
			// - reportStatistics
			offline: false,
	
			// Check Version
			// Whether or not to check for newer versions of DocPad
			checkVersion: false,
	
			// Welcome
			// Whether or not we should display any custom welcome callbacks
			welcome: false,
	
			// Prompts
			// Whether or not we should display any prompts
			prompts: false,
	
			// Progress
			// Whether or not we should display any progress bars
			// Requires prompts being true, and log level 6 or above
			progress: true,
	
			// Powered By DocPad
			// Whether or not we should include DocPad in the Powered-By meta header
			// Please leave this enabled as it is a standard practice and promotes DocPad in the web eco-system
			poweredByDocPad: true,
	
			// Helper Url
			// Used for subscribing to newsletter, account information, and statistics etc
			// Helper's source-code can be found at: https://github.com/docpad/helper
			helperUrl: true ? 'http://helper.docpad.org/' : 'http://localhost:8000/',
	
			// Template Data
			// What data would you like to expose to your templates
			templateData: {},
	
			// Collections
			// A hash of functions that create collections
			collections: {},
	
			// Events
			// A hash of event handlers
			events: {},
	
			// Regenerate Every
			// Performs a regenerate every x milliseconds, useful for always having the latest data
			regenerateEvery: false,
	
			// Regerenate Every Options
			// The generate options to use on the regenerate every call
			regenerateEveryOptions: {
				populate: true,
				partial:  false
			},
	
	
			// -----------------------------
			// Environment Configuration
	
			// Locale Code
			// The code we shall use for our locale (e.g. en, fr, etc)
			localeCode: null,
	
			// Environment
			// Whether or not we are in production or development
			// Separate environments using a comma or a space
			env: null,
	
			// Environments
			// Environment specific configuration to over-ride the global configuration
			environments: {
				development: {
					// Always refresh from server
					maxAge: false,
	
					// Only do these if we are running standalone (aka not included in a module)
					checkVersion: isUser,
					welcome: isUser,
					prompts: isUser
				}
			}
		};
	
		/**
		 * Regenerate Timer
		 * When config.regenerateEvery is set to a value, we create a timer here
		 * @private
		 * @property {Object} regenerateTimer
		 */
		this.prototype.regenerateTimer = null;
	
	
		// ---------------------------------
		// Generate
	
		// Generate Helpers
		/**
		 * Has DocPad's generation process started?
		 * @private
		 * @property {Boolean} generateStarted
		 */
		this.prototype.generateStarted = null;
	
		/**
		 * Has DocPad's generation process ended?
		 * @private
		 * @property {Boolean} generateEnded
		 */
		this.prototype.generateEnded = null;
	
		/**
		 * Is DocPad currently generating?
		 * @private
		 * @property {Boolean} generating
		 */
		this.prototype.generating = false;
	
		/**
		 * Has DocPad done at least one generation?
		 * True once the first generation has occured.
		 * @private
		 * @property {Object} generated
		 */
		this.prototype.generated = false;
	
	
		// ---------------------------------
		// Watch
	
		/**
		 * Array of file watchers
		 * @private
		 * @property {Array} watchers
		 */
		this.prototype.watchers = null;
	}
	// Libraries
	// Here for legacy API reasons
	//@DocPad: DocPad
	//@Backbone: require('backbone')
	//@queryEngine: queryEngine

	// Allow for `DocPad.create()` as an alias for `new DocPad()`
	// Allow for `DocPad.createInstance()` as an alias for `new DocPad()` (legacy alias)
	static create(...args) { return new (this)(...Array.from(args || [])); }
	static createInstance(...args) { return new (this)(...Array.from(args || [])); }

	// Require a local DocPad file
	// Before v6.73.0 this allowed requiring of files inside src/lib, as well as files inside src
	// Now it only allows requiring of files inside src/lib as that makes more sense
	static require(relativePath) {
		// Absolute the path
		const absolutePath = pathUtil.normalize(pathUtil.join(__dirname, relativePath));

		// Check if we are actually a local docpad file
		if (absolutePath.replace(__dirname, '') === absolutePath) {
			throw new Error(`docpad.require is limited to local docpad files only: ${relativePath}`);
		}

		// Require the path
		return require(absolutePath);
	}

	/**
	 * Get the DocPad version number
	 * @method getVersion
	 * @return {Number}
	 */
	getVersion() {
		if (this.version == null) { this.version = require(this.packagePath).version; }
		return this.version;
	}

	/**
	 * Get the DocPad version string
	 * @method getVersionString
	 * @return {String}
	 */
	getVersionString() {
		if (docpadUtil.isLocalDocPadExecutable()) {
			return util.format(this.getLocale().versionLocal, this.getVersion(), this.corePath);
		} else {
			return util.format(this.getLocale().versionGlobal, this.getVersion(), this.corePath);
		}
	}

	// Process getters
	/**
	 * Get the process platform
	 * @method getProcessPlatform
	 * @return {Object}
	 */
	getProcessPlatform() { return process.platform; }

	/**
	 * Get the process version string
	 * @method getProcessVersion
	 * @return {String}
	 */
	getProcessVersion() { return process.version.replace(/^v/,''); }

	/**
	 * Get the DocPad express.js server instance and, optionally,
	 * the node.js https server instance
	 * @method getServer
	 * @param {Boolean} [both=false]
	 * @return {Object}
	 */
	getServer(both) {
		if (both == null) { both = false; }
		const {serverExpress,serverHttp} = this;
		if (both) {
			return {serverExpress, serverHttp};
		} else {
			return serverExpress;
		}
	}

	/**
	 * Set the express.js server and node.js http server
	 * to bind to DocPad
	 * @method setServer
	 * @param {Object} servers
	 */
	setServer(servers) {
		// Apply
		if (servers.serverExpress && servers.serverHttp) {
			this.serverExpress = servers.serverExpress;
			this.serverHttp = servers.serverHttp;
		}

		// Cleanup
		delete this.config.serverHttp;
		delete this.config.serverExpress;
		return delete this.config.server;
	}

	/**
	 * Destructor. Close and destroy the node.js http server
	 * @private
	 * @method destroyServer
	 */
	destroyServer() {
		if (this.serverHttp != null) {
			this.serverHttp.close();
		}
		return this.serverHttp = null;
	}

	/**
	 * Get the caterpillar logger instance bound to DocPad
	 * @method getLogger
	 * @return {Object} caterpillar logger
	 */
	getLogger() { return (this.loggerInstances != null ? this.loggerInstances.logger : undefined); }

	/**
	 * Get all the caterpillar logger instances bound to DocPad
	 * @method getLoggers
	 * @return {Object} collection of caterpillar loggers
	 */
	getLoggers() { return this.loggerInstances; }

	/**
	 * Sets the caterpillar logger instances bound to DocPad
	 * @method setLoggers
	 * @param {Object} loggers
	 * @return {Object} logger instances bound to DocPad
	 */
	setLoggers(loggers) {
		if (this.loggerInstances) {
			this.warn(this.getLocale().loggersAlreadyDefined);
		} else {
			this.loggerInstances = loggers;
			this.loggerInstances.logger.setConfig({dry:true});
			this.loggerInstances.console.setConfig({dry:false}).pipe(process.stdout);
		}
		return loggers;
	}

	/**
	 * Destructor. Destroy the caterpillar logger instances bound to DocPad
	 * @private
	 * @method {Object} destroyLoggers
	 */
	destroyLoggers() {
		if (this.loggerInstances) {
			for (let key of Object.keys(this.loggerInstances || {})) {
				const value = this.loggerInstances[key];
				value.end();
			}
		}
		return this;
	}

	/**
	 * Get the action runner instance bound to docpad
	 * @method getActionRunner
	 * @return {Object} the action runner instance
	 */
	getActionRunner() { return this.actionRunnerInstance; }

	/**
	 * Apply the passed DocPad action arguments
	 * @method {Object} action
	 * @param {Object} args
	 * @return {Object}
	 */
	action(...args) { return docpadUtil.action.apply(this, args); }

	/**
	 * Get the error runner instance
	 * @method {Object} getErrorRunner
	 * @return {Object} the error runner instance
	 */
	getErrorRunner() { return this.errorRunnerInstance; }

	/**
	 * Get the track runner instance
	 * @method getTrackRunner
	 * @return {Object} the track runner instance
	 */
	getTrackRunner() { return this.trackRunnerInstance; }

	/**
	 * Get the list of available events
	 * @method getEvents
	 * @return {Object} string array of event names
	 */
	getEvents() {
		return this.events;
	}

	/**
	 * Description for getDatabase
	 * @method {Object} getDatabase
	 */
	getDatabase() { return this.database; }

	/**
	 * Safe method for retrieving the database by
	 * either returning the database itself or the temporary
	 * database cache
	 * @method getDatabaseSafe
	 * @return {Object}
	 */
	getDatabaseSafe() { return this.databaseTempCache || this.database; }

	/**
	 * Destructor. Destroy the DocPad database
	 * @private
	 * @method destroyDatabase
	 */
	destroyDatabase() {
		if (this.database != null) {
			this.database.destroy();
			this.database = null;
		}
		if (this.databaseTempCache != null) {
			this.databaseTempCache.destroy();
			this.databaseTempCache = null;
		}
		return this;
	}
	/* {
		* A collection of meta elements
		meta: null  # Elements Collection

		* A collection of script elements
		scripts: null  # Scripts Collection

		* Collection of style elements
		styles: null  # Styles Collection
	} */

	/**
	 * Get a block by block name. Optionally clone block.
	 * @method getBlock
	 * @param {String} name
	 * @param {Object} [clone]
	 * @return {Object} block
	 */
	getBlock(name,clone) {
		let block = this.blocks[name];
		if (clone) {
			const classname = name[0].toUpperCase()+name.slice(1)+'Collection';
			block = new (this[classname])(block.models);
		}
		return block;
	}

	/**
	 * Set a block by name and value
	 * @method setBlock
	 * @param {String} name
	 * @param {Object} value
	 */
	setBlock(name,value) {
		if (this.blocks[name] != null) {
			this.blocks[name].destroy();
			if (value) {
				this.blocks[name] = value;
			} else {
				delete this.blocks[name];
			}
		} else {
			this.blocks[name] = value;
		}
		return this;
	}

	/**
	 * Get all blocks
	 * @method getBlocks
	 * @return {Object} collection of blocks
	 */
	getBlocks() { return this.blocks; }

	/**
	 * Set all blocks
	 * @method setBlocks
	 * @param {Object} blocks
	 */
	setBlocks(blocks) {
		for (let name of Object.keys(blocks || {})) {
			const value = blocks[name];
			this.setBlock(name,value);
		}
		return this;
	}

	/**
	 * Apply the passed function to each block
	 * @method eachBlock
	 * @param {Function} fn
	 */
	eachBlock(fn) {
		eachr(this.blocks, fn);
		return this;
	}

	/**
	 * Destructor. Destroy all blocks
	 * @private
	 * @method destroyBlocks
	 */
	destroyBlocks() {
		if (this.blocks) {
			for (let name of Object.keys(this.blocks || {})) {
				const block = this.blocks[name];
				block.destroy();
				this.blocks[name] = null;
			}
		}
		return this;
	}

	/**
	 * Get a collection by collection name or key.
	 * This is often accessed within the docpad.coffee
	 * file or a layout/page via @getCollection.
	 * Because getCollection returns a docpad collection,
	 * a call to this method is often chained with a
	 * QueryEngine style query.
	 *
	 * 	@getCollection('documents').findAllLive({relativeOutDirPath: 'posts'},[{date:-1}])
	 *
	 * @method getCollection
	 * @param {String} value
	 * @return {Object} collection
	 */
	getCollection(value) {
		if (value) {
			let collection;
			if (typeof value === 'string') {
				if (value === 'database') {
					return this.getDatabase();

				} else {
					for (collection of Array.from(this.collections)) {
						if ([collection.options.name, collection.options.key].includes(value)) {
							return collection;
						}
					}
				}

			} else {
				for (collection of Array.from(this.collections)) {
					if (value === collection) {
						return collection;
					}
				}
			}
		}

		return null;
	}

	/**
	 * Destroy a collection by collection name or key
	 * @method destroyCollection
	 * @param {String} value
	 * @return {Object} description
	 */
	destroyCollection(value) {
		if (value) {
			if ((typeof value === 'string') && (value !== 'database')) {
				this.collections = this.collections.filter(function(collection) {
					if ([collection.options.name, collection.options.key].includes(value)) {
						if (collection != null) {
							collection.destroy();
						}
						return false;
					} else {
						return true;
					}
				});

			} else if (value !== this.getDatabase()) {
				this.collections = this.collections.filter(function(collection) {
					if (value === collection) {
						if (collection != null) {
							collection.destroy();
						}
						return false;
					} else {
						return true;
					}
				});
			}
		}

		return null;
	}

	/**
	 * Add a collection
	 * @method addCollection
	 * @param {Object} collection
	 */
	addCollection(collection) {
		let needle;
		if (collection && (needle = collection, ![this.getDatabase(), this.getCollection(collection)].includes(needle))) {
			this.collections.push(collection);
		}
		return this;
	}

	/**
	 * Set a name for a collection.
	 * A collection can have multiple names
	 *
	 * The partials plugin (https://github.com/docpad/docpad-plugin-partials)
	 * creates a live collection and passes this to setCollection with
	 * the name 'partials'.
	 *
	 * 	# Add our partials collection
	 *	docpad.setCollection('partials', database.createLiveChildCollection()
	 *		.setQuery('isPartial', {
	 *				$or:
	 *					isPartial: true
	 *					fullPath: $startsWith: config.partialsPath
	 *		})
	 *		.on('add', (model) ->
	 *			docpad.log('debug', util.format(locale.addingPartial, model.getFilePath()))
	 *			model.setDefaults(
	 *				isPartial: true
	 *				render: false
	 *				write: false
	 *			)
	 *		)
	 *	)
	 *
	 *
	 * @method setCollection
	 * @param {String} name the name to give to the collection
	 * @param {Object} collection a DocPad collection
	 */
	setCollection(name, collection) {
		if (collection) {
			if (name) {
				collection.options.name = name;
				if (this.getCollection(name) !== collection) {
					this.destroyCollection(name);
				}
			}
			return this.addCollection(collection);
		} else {
			return this.destroyCollection(name);
		}
	}

	/**
	 * Get the DocPad project's collections
	 * @method getCollections
	 * @return {Object} the collections
	 */
	getCollections() {
		return this.collections;
	}

	/**
	 * Set the DocPad project's collections
	 * @method setCollections
	 */
	setCollections(collections) {
		let value;
		if (Array.isArray(collections)) {
			for (value of Array.from(collections)) {
				this.addCollection(value);
			}
		} else {
			for (let name of Object.keys(collections || {})) {
				value = collections[name];
				this.setCollection(name, value);
			}
		}
		return this;
	}

	/**
	 * Apply the passed function to each collection
	 * @method eachCollection
	 * @param {Function} fn
	 */
	eachCollection(fn) {
		fn(this.getDatabase(), 'database');
		for (let index = 0; index < this.collections.length; index++) {
			const collection = this.collections[index];
			fn(collection, collection.options.name || collection.options.key || index);
		}
		return this;
	}

	/**
	 * Destructor. Destroy the DocPad project's collections.
	 * @private
	 * @method destroyCollections
	 */
	destroyCollections() {
		if (this.collections) {
			for (let collection of Array.from(this.collections)) {
				collection.destroy();
			}
			this.collections = [];
		}
		return this;
	}


	// ---------------------------------
	// Collection Helpers

	/**
	 * Get all the files in the DocPad database (will use live collections)
	 * @method getFiles
	 * @param {Object} query
	 * @param {Object} sorting
	 * @param {Object} paging
	 * @return {Object} collection
	 */
	getFiles(query,sorting,paging) {
		const key = JSON.stringify({query, sorting, paging});
		let collection = this.getCollection(key);
		if (!collection) {
			collection = this.getDatabase().findAllLive(query, sorting, paging);
			collection.options.key = key;
			this.addCollection(collection);
		}
		return collection;
	}


	/**
	 * Get a single file based on a query
	 * @method getFile
	 * @param {Object} query
	 * @param {Object} sorting
	 * @param {Object} paging
	 * @return {Object} a file
	 */
	getFile(query,sorting,paging) {
		const file = this.getDatabase().findOne(query, sorting, paging);
		return file;
	}

	/**
	 * Get files at a path
	 * @method getFilesAtPath
	 * @param {String} path
	 * @param {Object} sorting
	 * @param {Object} paging
	 * @return {Object} files
	 */
	getFilesAtPath(path,sorting,paging) {
		const query = {$or: [{relativePath: {$startsWith: path}}, {fullPath: {$startsWith: path}}]};
		const files = this.getFiles(query, sorting, paging);
		return files;
	}

	/**
	 * Get a file at a relative or absolute path or url
	 * @method getFileAtPath
	 * @param {String} path
	 * @param {Object} sorting
	 * @param {Object} paging
	 * @return {Object} a file
	 */
	getFileAtPath(path,sorting,paging) {
		const file = this.getDatabase().fuzzyFindOne(path, sorting, paging);
		return file;
	}


	// TODO: Does this still work???
	/**
	 * Get a file by its url
	 * @method getFileByUrl
	 * @param {String} url
	 * @param {Object} [opts={}]
	 * @return {Object} a file
	 */
	getFileByUrl(url,opts) {
		if (opts == null) { opts = {}; }
		if (opts.collection == null) { opts.collection = this.getDatabase(); }
		const file = opts.collection.get(this.filesByUrl[url]);
		return file;
	}


	/**
	 * Get a file by its id
	 * @method getFileById
	 * @param {String} id
	 * @param {Object} [opts={}]
	 * @return {Object} a file
	 */
	getFileById(id,opts) {
		if (opts == null) { opts = {}; }
		if (opts.collection == null) { opts.collection = this.getDatabase(); }
		const file = opts.collection.get(id);
		return file;
	}


	/**
	 * Remove the query string from a url
	 * Pathname convention taken from document.location.pathname
	 * @method getUrlPathname
	 * @param {String} url
	 * @return {String}
	 */
	getUrlPathname(url) {
		return url.replace(/\?.*/,'');
	}

	/**
	 * Get a file by its route and return
	 * it to the supplied callback.
	 * @method getFileByRoute
	 * @param {String} url
	 * @param {Object} next
	 * @param {Error} next.err
	 * @param {String} next.file
	 */
	getFileByRoute(url,next) {
		// Prepare
		const docpad = this;

		// If we have not performed a generation yet then wait until the initial generation has completed
		if (docpad.generated === false) {
			// Wait until generation has completed and recall ourselves
			docpad.once('generated', () => docpad.getFileByRoute(url, next));

			// hain
			return this;
		}

		// @TODO the above causes a signifcant delay when importing external documents (like tumblr data) into the database
		// we need to figure out a better way of doing this
		// perhaps it is via `writeSource: once` for imported documents
		// or providing an option to disable this so it forward onto the static handler instead

		// Prepare
		const database = docpad.getDatabaseSafe();

		// Fetch
		const cleanUrl = docpad.getUrlPathname(url);
		const file = docpad.getFileByUrl(url, {collection:database}) || docpad.getFileByUrl(cleanUrl, {collection:database});

		// Forward
		next(null, file);

		// Chain
		return this;
	}


	// TODO: What on earth is a selector?
	/**
	 * Get a file by its selector
	 * @method getFileBySelector
	 * @param {Object} selector
	 * @param {Object} [opts={}]
	 * @return {Object} a file
	 */
	getFileBySelector(selector,opts) {
		if (opts == null) { opts = {}; }
		if (opts.collection == null) { opts.collection = this.getDatabase(); }
		let file = opts.collection.get(this.filesBySelector[selector]);
		if (!file) {
			file = opts.collection.fuzzyFindOne(selector);
			if (file) {
				this.filesBySelector[selector] = file.id;
			}
		}
		return file;
	}

	/**
	 * Get Skeletons
	 * Get all the available skeletons with their details and
	 * return this collection to the supplied callback.
	 * @method getSkeletons
	 * @param {Function} next
	 * @param {Error} next.err
	 * @param {Object} next.skeletonsCollection DocPad collection of skeletons
	 * @return {Object} DocPad skeleton collection
	 */
	getSkeletons(next) {
		// Prepare
		const docpad = this;
		const locale = this.getLocale();

		// Check if we have cached locally
		if (this.skeletonsCollection != null) {
			return next(null, this.skeletonsCollection);
		}

		// Fetch the skeletons from the exchange
		this.skeletonsCollection = new Collection();
		this.skeletonsCollection.comparator = queryEngine.generateComparator({position:1, name:1});
		this.getExchange(function(err,exchange) {
			// Check
			if (err) { return next(err); }

			// Prepare
			let index = 0;

			// If we have the exchange data, then add the skeletons from it
			if (exchange) {
				eachr(exchange.skeletons, function(skeleton, skeletonKey) {
					if (skeleton.id == null) { skeleton.id = skeletonKey; }
					if (skeleton.name == null) { skeleton.name = skeletonKey; }
					if (skeleton.position == null) { skeleton.position = index; }
					docpad.skeletonsCollection.add(new Model(skeleton));
					return ++index;
				});
			}

			// Add No Skeleton Option
			docpad.skeletonsCollection.add(new Model({
				id: 'none',
				name: locale.skeletonNoneName,
				description: locale.skeletonNoneDescription,
				position: index
			}));

			// Return Collection
			return next(null, docpad.skeletonsCollection);
		});
		return this;  // {}
	}

	/**
	 * Get Complete Template Data
	 * @method getTemplateData
	 * @param {Object} userTemplateData
	 * @return {Object} templateData
	 */
	getTemplateData(userTemplateData) {
		// Prepare
		if (!userTemplateData) { userTemplateData = {}; }
		const docpad = this;
		const locale = this.getLocale();

		// Set the initial docpad template data
		if (this.initialTemplateData == null) { this.initialTemplateData = {
			// Site Properties
			site: {},

			// Environment
			getEnvironment() {
				return docpad.getEnvironment();
			},

			// Environments
			getEnvironments() {
				return docpad.getEnvironments();
			},

			// Set that we reference other files
			referencesOthers(flag) {
				const document = this.getDocument();
				document.referencesOthers();
				return null;
			},

			// Get the Document
			getDocument() {
				return this.documentModel;
			},

			// Get a Path in respect to the current document
			getPath(path,parentPath) {
				const document = this.getDocument();
				path = document.getPath(path, parentPath);
				return path;
			},

			// Get Files
			getFiles(query,sorting,paging) {
				this.referencesOthers();
				const result = docpad.getFiles(query, sorting, paging);
				return result;
			},

			// Get another file's URL based on a relative path
			getFile(query,sorting,paging) {
				this.referencesOthers();
				const result = docpad.getFile(query,sorting,paging);
				return result;
			},

			// Get Files At Path
			getFilesAtPath(path,sorting,paging) {
				this.referencesOthers();
				path = this.getPath(path);
				const result = docpad.getFilesAtPath(path, sorting, paging);
				return result;
			},

			// Get another file's model based on a relative path
			getFileAtPath(relativePath) {
				this.referencesOthers();
				const path = this.getPath(relativePath);
				const result = docpad.getFileAtPath(path);
				return result;
			},

			// Get a specific file by its id
			getFileById(id) {
				this.referencesOthers();
				const result = docpad.getFileById(id);
				return result;
			},

			// Get the entire database
			getDatabase() {
				this.referencesOthers();
				return docpad.getDatabase();
			},

			// Get a pre-defined collection
			getCollection(name) {
				this.referencesOthers();
				return docpad.getCollection(name);
			},

			// Get a block
			getBlock(name) {
				return docpad.getBlock(name,true);
			},

			// Include another file taking in a relative path
			include(subRelativePath,strict) {
				if (strict == null) { strict = true; }
				const file = this.getFileAtPath(subRelativePath);
				if (file) {
					if (strict && (file.get('rendered') === false)) {
						if (docpad.getConfig().renderPasses === 1) {
							docpad.warn(util.format(locale.renderedEarlyViaInclude, subRelativePath));
						}
						return null;
					}
					return file.getOutContent();
				} else {
					const err = new Error(util.format(locale.includeFailed, subRelativePath));
					throw err;
				}
			}
		}; }

		// Fetch our result template data
		const templateData = extendr.extend({}, this.initialTemplateData, this.pluginsTemplateData, this.getConfig().templateData, userTemplateData);

		// Add site data
		if (!templateData.site.url) { templateData.site.url = this.getSimpleServerUrl(); }
		if (!templateData.site.date) { templateData.site.date = new Date(); }
		if (!templateData.site.keywords) { templateData.site.keywords = []; }
		if (typeChecker.isString(templateData.site.keywords)) {
			templateData.site.keywords = templateData.site.keywords.split(/,\s*/g);
		}

		// Return
		return templateData;
	}


	/**
	 * Get the locale (language code and locale code)
	 * @method getLocale
	 * @return {Object} locale
	 */
	getLocale() {
		if ((this.locale != null) === false) {
			const config = this.getConfig();
			const codes = uniq([
				'en',
				safeps.getLanguageCode(config.localeCode),
				safeps.getLanguageCode(safeps.getLocaleCode()),
				safeps.getLocaleCode(config.localeCode),
				safeps.getLocaleCode(safeps.getLocaleCode())
			]);
			const locales = (Array.from(codes).map((code) => this.loadLocale(code))).filter(l => l);
			this.locale = extendr.extend(...Array.from(locales || []));
		}

		return this.locale;
	}

	/**
	 * Load the locale
	 * @method loadLocale
	 * @param {String} code
	 * @return {Object} locale
	 */
	loadLocale(code) {
		// Prepare
		const docpad = this;

		// Check if it exists
		const localeFilename = `${code}.cson`;
		const localePath = pathUtil.join(this.localePath, localeFilename);
		if (!safefs.existsSync(localePath)) { return null; }

		// Load it
		const locale = CSON.parseCSONFile(localePath);

		// Log the error in the background and continue
		if (locale instanceof Error) {
			locale.context = `Failed to parse the CSON locale file: ${localePath}`;
			docpad.error(locale);  // @TODO: should this be a fatal error instead?
			return null;
		}

		// Success
		return locale;
	}


	// -----------------------------
	// Environments


	/**
	 * Get the DocPad environment, eg: development,
	 * production or static
	 * @method getEnvironment
	 * @return {String} the environment
	 */
	getEnvironment() {
		const env = this.getConfig().env || 'development';
		return env;
	}

	/**
	 * Get the environments
	 * @method getEnvironments
	 * @return {Array} array of environment strings
	 */
	getEnvironments() {
		const env = this.getEnvironment();
		const envs = env.split(/[, ]+/);
		return envs;
	}

	/**
	* Get the DocPad configuration. Commonly
	* called within the docpad.coffee file or within
	* plugins to access application specific configurations.
	* 	serverExtend: (opts) ->
			* Extract the server from the options
			{server} = opts
			docpad = @docpad

			* As we are now running in an event,
			* ensure we are using the latest copy of the docpad configuraiton
			* and fetch our urls from it
			latestConfig = docpad.getConfig()
			oldUrls = latestConfig.templateData.site.oldUrls or []
			newUrl = latestConfig.templateData.site.url

			* Redirect any requests accessing one of our sites oldUrls to the new site url
			server.use (req,res,next) ->
				...
	* @method getConfig
	* @return {Object} the DocPad configuration object
	*/
	getConfig() {
		return this.config || {};
	}

	/**
	 * Get the port that DocPad is listening on (eg 9778)
	 * @method getPort
	 * @return {Number} the port number
	 */
	getPort() {
		let left, left1;
		return (left = (left1 = this.getConfig().port) != null ? left1 : require('hostenv').PORT) != null ? left : 9778;
	}

	/**
	 * Get the Hostname
	 * @method getHostname
	 * @return {String}
	 */
	getHostname() {
		let left, left1;
		return (left = (left1 = this.getConfig().hostname) != null ? left1 : require('hostenv').HOSTNAME) != null ? left : '0.0.0.0';
	}

	/**
	 * Get address
	 * @method getServerUrl
	 * @param {Object} [opts={}]
	 * @return {String}
	 */
	getServerUrl(opts) {
		if (opts == null) { opts = {}; }
		if (opts.hostname == null) { opts.hostname = this.getHostname(); }
		if (opts.port == null) { opts.port = this.getPort(); }
		if (opts.simple == null) { opts.simple = false; }
		if ((opts.simple === true) && ['0.0.0.0', '::', '::1'].includes(opts.hostname)) {
			return `http://127.0.0.1:${opts.port}`;
		} else {
			return `http://${opts.hostname}:${opts.port}`;
		}
	}

	/**
	 * Get simple server URL (changes 0.0.0.0, ::, and ::1 to 127.0.0.1)
	 * @method getSimpleServerUrl
	 * @param {Object} [opts={}]
	 * @param {Boolean} [opts.simple=true]
	 * @return {String}
	 */
	getSimpleServerUrl(opts) {
		if (opts == null) { opts = {}; }
		opts.simple = true;
		return this.getServerUrl(opts);
	}


	// =================================
	// Initialization Functions

	/**
	 * Create our own custom TaskGroup instance for DocPad.
	 * That will listen to tasks as they execute and provide debugging information.
	 * @method createTaskGroup
	 * @param {Object} opts
	 * @return {TaskGroup}
	 */
	createTaskGroup(...opts) {
		const docpad = this;
		const tasks = TaskGroup.create(...Array.from(opts || []));

		// Listen to executing tasks and output their progress
		tasks.on('running', function() {
			const config = tasks.getConfig();
			const name = tasks.getNames();
			const { progress } = config;
			if (progress) {
				const totals = tasks.getItemTotals();
				return progress.step(name).total(totals.total).setTick(totals.completed);
			} else {
				return docpad.log('debug', name+' > running');
			}
		});

		// Listen to executing tasks and output their progress
		tasks.on('item.add', function(item) {
			let totals;
			let config = tasks.getConfig();
			let name = item.getNames();
			let { progress } = config;
			if (progress) {
				totals = tasks.getItemTotals();
				progress.step(name).total(totals.total).setTick(totals.completed);
			} else {
				docpad.log('debug', name+' > added');
			}

			// Listen to executing tasks and output their progress
			item.on('started', function(item) {
				config = tasks.getConfig();
				name = item.getNames();
				({ progress } = config);
				if (progress) {
					totals = tasks.getItemTotals();
					return progress.step(name).total(totals.total).setTick(totals.completed);
				} else {
					return docpad.log('debug', name+' > started');
				}
			});

			// Listen to executing tasks and output their progress
			return item.done(function(err) {
				config = tasks.getConfig();
				name = item.getNames();
				({ progress } = config);
				if (progress) {
					totals = tasks.getItemTotals();
					return progress.step(name).total(totals.total).setTick(totals.completed);
				} else {
					return docpad.log('debug', name+' > done');
				}
			});
		});

		// Return
		return tasks;
	}

	/**
	 * Constructor method. Sets up the DocPad instance.
	 * next(err)
	 * @method constructor
	 * @param {Object} instanceConfig
	 * @param {Function} next callback
	 * @param {Error} next.err
	 */
	constructor(instanceConfig,next) {
		// Prepare
		let action, loggers;
		{
		  // Hack: trick Babel/TypeScript into allowing this before super.
		  if (false) { super(); }
		  let thisFn = (() => { this; }).toString();
		  let thisName = thisFn.slice(thisFn.indexOf('{') + 1, thisFn.indexOf(';')).trim();
		  eval(`${thisName} = this;`);
		}
		this.createTaskGroup = this.createTaskGroup.bind(this);
		[instanceConfig,next] = Array.from(extractOptsAndCallback(instanceConfig, next));
		super(instanceConfig, next);
		const docpad = this;

		// Binders
		// Using this over coffescript's => on class methods, ensures that the method length is kept
		for (let methodName of Array.from(`\
action
log warn error fatal inspector notify track identify subscribe checkRequest
serverMiddlewareRouter serverMiddlewareHeader serverMiddleware404 serverMiddleware500
destroyWatchers\
`.split(/\s+/))) {
			this[methodName] = this[methodName].bind(this);
		}

		// Allow DocPad to have unlimited event listeners
		this.setMaxListeners(0);

		// Setup configuration event wrappers
		const configEventContext = {docpad};  // here to allow the config event context to persist between event calls
		this.getEvents().forEach(eventName =>
			// Bind to the event
			docpad.on(eventName, function(opts,next) {
				const eventHandler = __guard__(docpad.getConfig().events, x => x[eventName]);
				// Fire the config event handler for this event, if it exists
				if (typeChecker.isFunction(eventHandler)) {
					const args = [opts,next];
					return ambi(eventHandler.bind(configEventContext), ...Array.from(args));
				// It doesn't exist, so lets continue
				} else {
					return next();
				}
			})
		);

		// Create our action runner
		this.actionRunnerInstance = this.createTaskGroup('action runner', {abortOnError: false, destroyOnceDone: false}).whenDone(function(err) {
			if (err) { return docpad.error(err); }
		});

		// Create our track runner
		this.trackRunnerInstance = this.createTaskGroup('track runner', {abortOnError: false, destroyOnceDone: false}).whenDone(function(err) {
			if (err && docpad.getDebugging()) {
				const locale = docpad.getLocale();
				return docpad.warn(locale.trackError, err);
			}
		});

		// Initialize the loggers
		if (loggers = instanceConfig.loggers) {
			delete instanceConfig.loggers;
		} else {
			// Create
			const logger = require('caterpillar').create({lineOffset: 2});

			// console
			const loggerConsole = logger
				.pipe(
					require('caterpillar-filter').create()
				)
				.pipe(
					require('caterpillar-human').create()
				);

			// Apply
			loggers = {logger, console:loggerConsole};
		}

		// Apply the loggers
		safefs.unlink(this.debugLogPath, function() {} );  // Remove the old debug log file
		this.setLoggers(loggers);  // Apply the logger streams
		this.setLogLevel(instanceConfig.logLevel != null ? instanceConfig.logLevel : this.initialConfig.logLevel);  // Set the default log level

		// Log to bubbled events
		this.on('log', function(...args) {
			return docpad.log.apply(this,args);
		});

		// Dereference and initialise advanced variables
		// we deliberately ommit initialTemplateData here, as it is setup in getTemplateData
		this.slowPlugins = {};
		this.loadedPlugins = {};
		this.exchange = {};
		this.pluginsTemplateData = {};
		this.instanceConfig = {};
		this.collections = [];
		this.blocks = {};
		this.filesByUrl = {};
		this.filesBySelector = {};
		this.filesByOutPath = {};
		this.database = new FilesCollection(null, {name:'database'})
			.on('remove', function(model,options) {
				// Skip if we are not a writeable file
				if (model.get('write') === false) { return; }

				// Delete the urls
				for (let url of Array.from(model.get('urls') || [])) {
					delete docpad.filesByUrl[url];
				}

				// Ensure we regenerate anything (on the next regeneration) that was using the same outPath
				const outPath = model.get('outPath');
				if (outPath) {
					const updatedModels = docpad.database.findAll({outPath});
					updatedModels.remove(model);
					updatedModels.each(model => model.set({'mtime': new Date()}));

					// Log
					docpad.log('debug', 'Updated mtime for these models due to remove of a similar one', updatedModels.pluck('relativePath'));
				}

				// Return safely
				return true;
			})
			.on('add change:urls', function(model) {
				// Skip if we are not a writeable file
				if (model.get('write') === false) { return; }

				// Delete the old urls
				for (var url of Array.from(model.previous('urls') || [])) {
					delete docpad.filesByUrl[url];
				}

				// Add the new urls
				for (url of Array.from(model.get('urls'))) {
					docpad.filesByUrl[url] = model.cid;
				}

				// Return safely
				return true;
			})
			.on('add change:outPath', function(model) {
				// Skip if we are not a writeable file
				let outPath;
				if (model.get('write') === false) { return; }

				// Check if we have changed our outPath
				const previousOutPath = model.previous('outPath');
				if (previousOutPath) {
					// Ensure we regenerate anything (on the next regeneration) that was using the same outPath
					const previousModels = docpad.database.findAll({outPath:previousOutPath});
					previousModels.remove(model);
					previousModels.each(model => model.set({'mtime': new Date()}));

					// Log
					docpad.log('debug', 'Updated mtime for these models due to addition of a similar one', previousModels.pluck('relativePath'));

					// Update the cache entry with another file that has the same outPath or delete it if there aren't any others
					const previousModelId = docpad.filesByOutPath[previousOutPath];
					if (previousModelId === model.id) {
						if (previousModels.length) {
							docpad.filesByOutPath[previousOutPath] = previousModelId;
						} else {
							delete docpad.filesByOutPath[previousOutPath];
						}
					}
				}

				// Update the cache entry and fetch the latest if it was already set
				if (outPath = model.get('outPath')) {
					const existingModelId = docpad.filesByOutPath[outPath] != null ? docpad.filesByOutPath[outPath] : (docpad.filesByOutPath[outPath] = model.id);
					if (existingModelId !== model.id) {
						const existingModel = docpad.database.get(existingModelId);
						if (existingModel) {
							// We have a conflict, let the user know
							const modelPath = model.get('fullPath') || (model.get('relativePath')+':'+model.id);
							const existingModelPath = existingModel.get('fullPath') || (existingModel.get('relativePath')+':'+existingModel.id);
							docpad.warn(util.format(docpad.getLocale().outPathConflict, outPath, modelPath, existingModelPath));
						} else {
							// There reference was old, update it with our new one
							docpad.filesByOutPath[outPath] = model.id;
						}
					}
				}

				// Return safely
				return true;
			});
		this.userConfig = extendr.dereferenceJSON(this.userConfig);
		this.initialConfig = extendr.dereferenceJSON(this.initialConfig);

		// Extract action
		if (instanceConfig.action != null) {
			({ action } = instanceConfig);
		} else {
			action = 'load ready';
		}

		// Check if we want to perform an action
		if (action) {
			this.action(action, instanceConfig, function(err) {
				if (next != null) {
					return next(err, docpad);
				} else if (err) {
					return docpad.fatal(err);
				}
			});
		} else {
			if (typeof next === 'function') {
				next(null, docpad);
			}
		}

		// Chain
		this;
	}

	/**
	 * Destructor. Destroy the DocPad instance
	 * This is an action, and should be called as such
	 * E.g. docpad.action('destroy', next)
	 * @method destroy
	 * @param {Object} opts
	 * @param {Function} next
	 * @param {Error} next.err
	 */
	destroy(opts, next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts, next));
		const docpad = this;

		// Destroy Regenerate Timer
		docpad.destroyRegenerateTimer();

		// Wait one second to wait for any logging to complete
		docpadUtil.wait(1000, () =>

			// Destroy Plugins
			docpad.emitSerial('docpadDestroy', function(err) {
				// Check
				if (err) { return (typeof next === 'function' ? next(err) : undefined); }

				// Destroy Plugins
				docpad.destroyPlugins();

				// Destroy Server
				docpad.destroyServer();

				// Destroy Watchers
				docpad.destroyWatchers();

				// Destroy Blocks
				docpad.destroyBlocks();

				// Destroy Collections
				docpad.destroyCollections();

				// Destroy Database
				docpad.destroyDatabase();

				// Destroy Logging
				docpad.destroyLoggers();

				// Destroy Process Listners
				process.removeListener('uncaughtException', docpad.error);

				// Destroy DocPad Listeners
				docpad.removeAllListeners();

				// Forward
				return (typeof next === 'function' ? next() : undefined);
			})
		);

		// Chain
		return this;
	}

	/**
	 * Emit event, serial
	 * @private
	 * @method emitSerial
	 * @param {String} eventName
	 * @param {Object} opts
	 * @param {Function} next
	 * @param {Error} next.err
	 */
	emitSerial(eventName, opts, next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts, next));
		const docpad = this;
		const locale = docpad.getLocale();

		// Log
		docpad.log('debug', util.format(locale.emittingEvent, eventName));

		// Emit
		super.emitSerial(eventName, opts, function(err) {
			// Check
			if (err) { return next(err); }

			// Log
			docpad.log('debug', util.format(locale.emittedEvent, eventName));

			// Forward
			return next(err);
		});

		// Chain
		return this;
	}

	/**
	 * Emit event, parallel
	 * @private
	 * @method emitParallel
	 * @param {String} eventName
	 * @param {Object} opts
	 * @param {Function} next
	 * @param {Error} next.err
	 */
	emitParallel(eventName, opts, next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts, next));
		const docpad = this;
		const locale = docpad.getLocale();

		// Log
		docpad.log('debug', util.format(locale.emittingEvent, eventName));

		// Emit
		super.emitParallel(eventName, opts, function(err) {
			// Check
			if (err) { return next(err); }

			// Log
			docpad.log('debug', util.format(locale.emittedEvent, eventName));

			// Forward
			return next(err);
		});

		// Chain
		return this;
	}


	// =================================
	// Helpers

	/**
	 * Get the ignore options for the DocPad project
	 * @method getIgnoreOpts
	 * @return {Array} string array of ignore options
	 */
	getIgnoreOpts() {
		return pick(this.config, ['ignorePaths', 'ignoreHiddenFiles', 'ignoreCommonPatterns', 'ignoreCustomPatterns']);
	}

	/**
	 * Is the supplied path ignored?
	 * @method isIgnoredPath
	 * @param {String} path
	 * @param {Object} [opts={}]
	 * @return {Boolean}
	 */
	isIgnoredPath(path,opts) {
		if (opts == null) { opts = {}; }
		opts = extendr.extend(this.getIgnoreOpts(), opts);
		return ignorefs.isIgnoredPath(path, opts);
	}

	/**
	 * Scan directory
	 * @method scandir
	 * @param {Object} [opts={}]
	 */
	//NB: How does this work? What is returned?
	//Does it require a callback (next) passed as
	//one of the options
	scandir(opts) {
		if (opts == null) { opts = {}; }
		opts = extendr.extend(this.getIgnoreOpts(), opts);
		return scandir(opts);
	}

	/**
	 * Watch Directory. Wrapper around the Bevry watchr
	 * module (https://github.com/bevry/watchr). Used
	 * internally by DocPad to watch project documents
	 * and files and then activate the regeneration process
	 * when any of those items are updated.
	 * @private
	 * @method watchdir
	 * @param {String} path - the path to watch
	 * @param {Object} listeners - listeners to attach to the watcher
	 * @param {Function} next - completion callback accepting error
	 * @return {Object} the watcher
	 */
	watchdir(path, listeners, next) {
		const opts = extendr.extend(this.getIgnoreOpts(), this.config.watchOptions || {});
		const stalker = require('watchr').create(path);
		for (let key of Object.keys(listeners || {})) {
			const value = listeners[key];
			stalker.on(key, value);
		}
		stalker.setConfig(opts);
		stalker.watch(next);
		return stalker;
	}

	/**
	 * Watch Directories. Wrapper around watchdir.
	 * @private
	 * @method watchdirs
	 * @param {Array} paths - the paths to watch
	 * @param {Object} listeners - listeners to attach to the watcher
	 * @param {Function} next - completion callback accepting error and watchers/stalkers
	 */
	watchdirs(paths, listeners, next) {
		const docpad = this;
		const stalkers = [];

		const tasks = new TaskGroup('watching directories').setConfig({concurrency:0}).done(function(err) {
			if (err) {
				for (let stalker of Array.from(stalkers)) {
					stalker.close();
				}
				return next(err);
			} else {
				return next(err, stalkers);
			}
		});

		paths.forEach(path =>
			tasks.addTask(`watching ${path}`, done =>
				// check if the dir exists first as reloadPaths may not apparently
				safefs.exists(path, function(exists) {
					if (!exists) { return done(); }
					return stalkers.push(docpad.watchdir(path, listeners, done));
				})
			)
		);

		tasks.run();

		// Chain
		return this;
	}


	// =================================
	// Setup and Loading

	/**
	 * DocPad is ready. Peforms the tasks needed after DocPad construction
	 * and DocPad has loaded. Triggers the docpadReady event.
	 * next(err,docpadInstance)
	 * @private
	 * @method ready
	 * @param {Object} [opts]
	 * @param {Function} next
	 * @param {Error} next.err
	 * @param {Object} next.docpadInstance
	 */
	ready(opts,next) {
		// Prepare
		let instanceConfig, pluginsList;
		[instanceConfig,next] = Array.from(extractOptsAndCallback(instanceConfig,next));
		const docpad = this;
		const config = this.getConfig();
		const locale = this.getLocale();

		// Render Single Extensions
		this.DocumentModel.prototype.defaults.renderSingleExtensions = config.renderSingleExtensions;

		// Version Check
		this.compareVersion();

		// Welcome Prepare
		if (this.getDebugging()) {
			pluginsList = (Array.from(Object.keys(this.loadedPlugins).sort()).map((pluginName) => `${pluginName} v${this.loadedPlugins[pluginName].version}`)).join(', ');
		} else {
			pluginsList = Object.keys(this.loadedPlugins).sort().join(', ');
		}

		// Welcome Output
		docpad.log('info', util.format(locale.welcome, this.getVersionString()));
		docpad.log('notice', locale.welcomeDonate);
		docpad.log('info', locale.welcomeContribute);
		docpad.log('info', util.format(locale.welcomePlugins, pluginsList));
		docpad.log('info', util.format(locale.welcomeEnvironment, this.getEnvironment()));

		// Prepare
		const tasks = this.createTaskGroup('ready tasks', { next(err) {
			// Error?
			if (err) { return docpad.error(err); }

			// All done, forward our DocPad instance onto our creator
			return (typeof next === 'function' ? next(null,docpad) : undefined);
		}
	}
		);

		tasks.addTask('welcome event', function(complete) {
			// No welcome
			if (!config.welcome) { return complete(); }

			// Welcome
			return docpad.emitSerial('welcome', {docpad}, complete);
		});

		tasks.addTask('track', complete =>
			// Identify
			docpad.identify(complete)
		);

		tasks.addTask('emit docpadReady', complete => docpad.emitSerial('docpadReady', {docpad}, complete));

		// Run tasks
		tasks.run();

		// Chain
		return this;
	}

	/**
	 * Performs the merging of the passed configuration objects
	 * @private
	 * @method mergeConfigurations
	 * @param {Object} configPackages
	 * @param {Object} configsToMerge
	 */
	mergeConfigurations(configPackages,configsToMerge) {
		// Prepare
		const envs = this.getEnvironments();

		// Figure out merging
		for (let configPackage of Array.from(configPackages)) {
			if (!configPackage) { continue; }
			configsToMerge.push(configPackage);
			for (let env of Array.from(envs)) {
				const envConfig = configPackage.environments != null ? configPackage.environments[env] : undefined;
				if (envConfig) { configsToMerge.push(envConfig); }
			}
		}

		// Merge
		extendr.deep(...Array.from(configsToMerge || []));

		// Chain
		return this;
	}

	/**
	 * Set the instance configuration
	 * by merging the properties of the passed object
	 * with the existing DocPad instanceConfig object
	 * @private
	 * @method setInstanceConfig
	 * @param {Object} instanceConfig
	 */
	setInstanceConfig(instanceConfig) {
		// Merge in the instance configurations
		if (instanceConfig) {
			const logLevel = this.getLogLevel();
			extendr.deepDefaults(this.instanceConfig, instanceConfig);
			if (this.config) { extendr.deepDefaults(this.config, instanceConfig); }  // @TODO document why there is the if
			if (instanceConfig.logLevel && (instanceConfig.logLevel !== logLevel)) { this.setLogLevel(instanceConfig.logLevel); }
		}
		return this;
	}

	/**
	 * Set the DocPad configuration object.
	 * Performs a number of tasks, including
	 * merging the pass instanceConfig with DocPad's
	 * other config objects.
	 * next(err,config)
	 * @private
	 * @method setConfig
	 * @param {Object} instanceConfig
	 * @param {Object} next
	 * @param {Error} next.err
	 * @param {Object} next.config
	 */
	setConfig(instanceConfig,next) {
		// Prepare
		let key, typePath, typePaths;
		[instanceConfig,next] = Array.from(extractOptsAndCallback(instanceConfig,next));
		const docpad = this;
		const locale = this.getLocale();

		// Apply the instance configuration, generally we won't have it at this level
		// as it would have been applied earlier the load step
		if (instanceConfig) { this.setInstanceConfig(instanceConfig); }

		// Apply the environment
		// websitePackageConfig.env is left out of the detection here as it is usually an object
		// that is already merged with our process.env by the environment runner
		// rather than a string which is the docpad convention
		this.config.env = this.instanceConfig.env || this.websiteConfig.env || this.initialConfig.env || process.env.NODE_ENV;

		// Merge configurations
		const configPackages = [this.initialConfig, this.userConfig, this.websiteConfig, this.instanceConfig];
		const configsToMerge = [this.config];
		docpad.mergeConfigurations(configPackages, configsToMerge);

		// Extract and apply the server
		this.setServer(extendr.defaults({
			serverHttp: this.config.serverHttp,
			serverExpress: this.config.serverExpress
		}, this.config.server || {})
		);

		// Extract and apply the logger
		this.setLogLevel(this.config.logLevel);

		// Resolve any paths
		this.config.rootPath = pathUtil.resolve(this.config.rootPath);
		this.config.outPath = pathUtil.resolve(this.config.rootPath, this.config.outPath);
		this.config.srcPath = pathUtil.resolve(this.config.rootPath, this.config.srcPath);
		this.config.databaseCachePath = pathUtil.resolve(this.config.rootPath, this.config.databaseCachePath);
		this.config.packagePath = pathUtil.resolve(this.config.rootPath, this.config.packagePath);

		// Resolve Documents, Files, Layouts paths
		for (var type of ['documents','files','layouts']) {
			typePaths = this.config[type+'Paths'];
			for (key = 0; key < typePaths.length; key++) {
				typePath = typePaths[key];
				typePaths[key] = pathUtil.resolve(this.config.srcPath, typePath);
			}
		}

		// Resolve Plugins paths
		for (type of ['plugins']) {
			typePaths = this.config[type+'Paths'];
			for (key = 0; key < typePaths.length; key++) {
				typePath = typePaths[key];
				typePaths[key] = pathUtil.resolve(this.config.rootPath, typePath);
			}
		}

		// Bind the error handler, so we don't crash on errors
		process.removeListener('uncaughtException', this.error);
		this.removeListener('error', this.error);
		if (this.config.catchExceptions) {
			process.setMaxListeners(0);
			process.on('uncaughtException', this.error);
			this.on('error', this.error);
		}

		// Prepare the Post Tasks
		const postTasks = this.createTaskGroup('setConfig post tasks', { next(err) {
			return next(err, docpad.config);
		}

		/*
		postTasks.addTask 'lazy depedencnies: encoding', (complete) =>
			return complete()  unless @config.detectEncoding
			return lazyRequire 'encoding', {cwd:corePath, stdio:'inherit'}, (err) ->
				docpad.warn(locale.encodingLoadFailed)  if err
				return complete()
		*/
	}
		);

		postTasks.addTask('load plugins', complete => docpad.loadPlugins(complete));

		postTasks.addTask('extend collections', complete => docpad.extendCollections(complete));

		postTasks.addTask('fetch plugins templateData', complete => docpad.emitSerial('extendTemplateData', {templateData:docpad.pluginsTemplateData}, complete));

		postTasks.addTask('fire the docpadLoaded event', complete => docpad.emitSerial('docpadLoaded', complete));

		// Fire post tasks
		postTasks.run();

		// Chain
		return this;
	}


	/**
	 * Load the various configuration files from the
	 * file system. Set the instanceConfig.
	 * next(err,config)
	 * @private
	 * @method load
	 * @param {Object} instanceConfig
	 * @param {Function} next
	 * @param {Error} next.err
	 * @param {Object} next.config
	 */
	load(instanceConfig,next) {
		// Prepare
		[instanceConfig,next] = Array.from(extractOptsAndCallback(instanceConfig,next));
		const docpad = this;
		const locale = this.getLocale();
		if (!instanceConfig) { instanceConfig = {}; }

		// Reset non persistant configurations
		this.websitePackageConfig = {};
		this.websiteConfig = {};
		this.config = {};

		// Merge in the instance configurations
		this.setInstanceConfig(instanceConfig);

		// Prepare the Load Tasks
		const preTasks = this.createTaskGroup('load tasks', { next:err => {
			if (err) { return next(err); }
			return this.setConfig(next);
		}
	}
		);

		preTasks.addTask('normalize the userConfigPath', complete => {
			return safeps.getHomePath((err,homePath) => {
				if (err) { return complete(err); }
				const dropboxPath = pathUtil.resolve(homePath, 'Dropbox');
				return safefs.exists(dropboxPath, dropboxPathExists => {
					// @TODO: Implement checks here for
					// https://github.com/bevry/docpad/issues/799
					const userConfigDirPath = dropboxPathExists ? dropboxPath : homePath;
					this.userConfigPath = pathUtil.resolve(userConfigDirPath, this.userConfigPath);
					return complete();
				});
			});
		});

		preTasks.addTask("load the user's configuration", complete => {
			const configPath = this.userConfigPath;
			docpad.log('debug', util.format(locale.loadingUserConfig, configPath));
			return this.loadConfigPath({configPath}, (err,data) => {
				if (err) { return complete(err); }

				// Apply loaded data
				extendr.extend(this.userConfig, data || {});

				// Done
				docpad.log('debug', util.format(locale.loadingUserConfig, configPath));
				return complete();
			});
		});

		preTasks.addTask("load the anonymous user's configuration", complete => {
			// Ignore if username is already identified
			if (this.userConfig.username) { return complete(); }

			// User is anonymous, set their username to the hashed and salted mac address
			return require('getmac').getMac((err,macAddress) => {
				let macAddressHash;
				if (err || !macAddress) {
					docpad.warn(locale.macError, err);
					return complete();
				}

				// Hash with salt
				try {
					macAddressHash = require('crypto').createHmac('sha1', docpad.hashKey).update(macAddress).digest('hex');
				} catch (error) {
					err = error;
					if (err) { return complete(); }
				}

				// Apply
				if (macAddressHash) {
					if (this.userConfig.name == null) { this.userConfig.name = `MAC ${macAddressHash}`; }
					if (this.userConfig.username == null) { this.userConfig.username = macAddressHash; }
				}

				// Next
				return complete();
			});
		});

		preTasks.addTask("load the website's package data", complete => {
			const rootPath = pathUtil.resolve(this.instanceConfig.rootPath || this.initialConfig.rootPath);
			const configPath = pathUtil.resolve(rootPath, this.instanceConfig.packagePath || this.initialConfig.packagePath);
			docpad.log('debug', util.format(locale.loadingWebsitePackageConfig, configPath));
			return this.loadConfigPath({configPath}, (err,data) => {
				if (err) { return complete(err); }
				if (!data) { data = {}; }

				// Apply loaded data
				this.websitePackageConfig = data;

				// Done
				docpad.log('debug', util.format(locale.loadedWebsitePackageConfig, configPath));
				return complete();
			});
		});

		preTasks.addTask("read the .env file if it exists", complete => {
			const rootPath = pathUtil.resolve(this.instanceConfig.rootPath || this.websitePackageConfig.rootPath || this.initialConfig.rootPath);
			const configPath = pathUtil.resolve(rootPath, '.env');
			docpad.log('debug', util.format(locale.loadingEnvConfig, configPath));
			return safefs.exists(configPath, function(exists) {
				if (!exists) { return complete(); }
				return require('envfile').parseFile(configPath, function(err,data) {
					if (err) { return complete(err); }
					for (let key of Object.keys(data || {})) {
						const value = data[key];
						process.env[key] = value;
					}
					docpad.log('debug', util.format(locale.loadingEnvConfig, configPath));
					return complete();
				});
			});
		});

		preTasks.addTask("load the website's configuration", complete => {
			docpad.log('debug', util.format(locale.loadingWebsiteConfig));
			const rootPath = pathUtil.resolve(this.instanceConfig.rootPath || this.initialConfig.rootPath);
			const configPaths = this.instanceConfig.configPaths || this.initialConfig.configPaths;
			for (let index = 0; index < configPaths.length; index++) {
				const configPath = configPaths[index];
				configPaths[index] = pathUtil.resolve(rootPath, configPath);
			}
			return this.loadConfigPath({configPaths}, (err,data) => {
				if (err) { return complete(err); }
				if (!data) { data = {}; }

				// Apply loaded data
				extendr.extend(this.websiteConfig, data);

				// Done
				docpad.log('debug', util.format(locale.loadedWebsiteConfig));
				return complete();
			});
		});

		// Run the load tasks synchronously
		preTasks.run();

		// Chain
		return this;
	}


	// =================================
	// Configuration

	/**
	 * Update user configuration with the passed data
	 * @method updateUserConfig
	 * @param {Object} [data={}]
	 * @param {Function} next
	 * @param {Error} next.err
	 */
	updateUserConfig(data,next) {
		// Prepare
		if (data == null) { data = {}; }
		[data,next] = Array.from(extractOptsAndCallback(data,next));
		const docpad = this;
		const { userConfigPath } = this;

		// Apply back to our loaded configuration
		// does not apply to @config as we would have to reparse everything
		// and that appears to be an imaginary problem
		if (data) { extendr.extend(this.userConfig, data); }

		// Convert to CSON
		CSON.createCSONString(this.userConfig, function(err, userConfigString) {
			if (err) {
				err.context = "Failed to create the CSON string for the user configuration";
				return next(err);
			}

			// Write it
			return safefs.writeFile(userConfigPath, userConfigString, 'utf8', err =>
				// Forward
				next(err)
			);
		});

		// Chain
		return this;
	}

	/**
	 * Load a configuration url.
	 * @method loadConfigUrl
	 * @param {String} configUrl
	 * @param {Function} next
	 * @param {Error} next.err
	 * @param {Object} next.parsedData
	 */
	loadConfigUrl(configUrl,next) {
		// Prepare
		const docpad = this;
		const locale = this.getLocale();

		// Log
		docpad.log('debug', util.format(locale.loadingConfigUrl, configUrl));

		// Read the URL
		superAgent
			.get(configUrl)
			.timeout(30*1000)
			.end(function(err,res) {
				// Check
				if (err) { return next(err); }

				// Read the string using CSON
				return CSON.parseCSONString(res.text, next);
		});

		// Chain
		return this;
	}


	/**
	 * Load the configuration from a file path
	 * passed as one of the options (opts.configPath) or
	 * from DocPad's configPaths
	 * @private
	 * @method loadConfigPath
	 * @param {Object} opts
	 * @param {Function} next
	 * @param {Error} next.err
	 * @param {Object} next.parsedData
	 */
	loadConfigPath(opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts, next));
		const docpad = this;
		const locale = this.getLocale();

		// Prepare
		const load = function(configPath) {
			// Check
			if (!configPath) { return next(); }

			// Log
			docpad.log('debug', util.format(locale.loadingConfigPath, configPath));

			// Check that it exists
			return safefs.exists(configPath, function(exists) {
				if (!exists) { return next(); }

				// Prepare CSON Options
				const csonOptions = {
					cson: true,
					json: true,
					coffeescript: true,
					javascript: true
				};

				// Read the path using CSON
				return CSON.requireFile(configPath, csonOptions, function(err, data) {
					if (err) {
						err.context = util.format(locale.loadingConfigPathFailed, configPath);
						return next(err);
					}

					// Check if the data is a function, if so, then execute it as one
					while (typeChecker.isFunction(data)) {
						try {
							data = data(docpad);
						} catch (error) {
							err = error;
							return next(err);
						}
					}
					if (!typeChecker.isObject(data)) {
						err = new Error(`Loading the configuration ${docpad.inspector(configPath)} returned an invalid result ${docpad.inspector(data)}`);
						if (err) { return next(err); }
					}

					// Return the data
					return next(null, data);
				});
			});
		};

		// Check
		if (opts.configPath) {
			load(opts.configPath);
		} else {
			this.getConfigPath(opts, (err,configPath) => load(configPath));
		}

		// Chain
		return this;
	}

	/**
	 * Get config paths and check that those
	 * paths exist
	 * @private
	 * @method getConfigPath
	 * @param {Object} opts
	 * @param {Object} next
	 * @param {Error} next.err
	 * @param {String} next.path
	 */
	getConfigPath(opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts, next));
		const docpad = this;
		const config = this.getConfig();
		let result = null;

		// Ensure array
		if (opts.configPaths == null) { opts.configPaths = config.configPaths; }
		if (!typeChecker.isArray(opts.configPaths)) { opts.configPaths = [opts.configPaths]; }

		const tasks = this.createTaskGroup('getConfigPath tasks', { next(err) {
			return next(err, result);
		}
	}
		);

		// Determine our configuration path
		opts.configPaths.forEach(configPath =>
			tasks.addTask(`Checking if [${configPath}] exists`, function(complete) {
				if (result) { return complete(); }
				return safefs.exists(configPath, function(exists) {
					if (exists) {
						result = configPath;
						tasks.clear();
						return complete();
					} else {
						return complete();
					}
				});
			})
		);

		// Run them synchronously
		tasks.run();

		// Chain
		return this;
	}


	/**
	 * Extend collecitons. Create DocPad's
	 * standard (documents, files
	 * layouts) and special (generate, referencesOthers,
	 * hasLayout, html, stylesheet) collections. Set blocks
	 * @private
	 * @method extendCollections
	 * @param {Function} next
	 * @param {Error} next.err
	 */
	extendCollections(next) {
		// Prepare
		const docpad = this;
		const docpadConfig = this.getConfig();
		const locale = this.getLocale();
		const database = this.getDatabase();

		// Standard Collections
		this.setCollections({
			// Standard Collections
			documents: database.createLiveChildCollection()
				.setQuery('isDocument', {
					render: true,
					write: true
				})
				.on('add', model => docpad.log('debug', util.format(locale.addingDocument, model.getFilePath()))),
			files: database.createLiveChildCollection()
				.setQuery('isFile', {
					render: false,
					write: true
				})
				.on('add', model => docpad.log('debug', util.format(locale.addingFile, model.getFilePath()))),
			layouts: database.createLiveChildCollection()
				.setQuery('isLayout', {
					$or: {
						isLayout: true,
						fullPath: { $startsWith: docpadConfig.layoutsPaths
					}
					}
				})
				.on('add', function(model) {
					docpad.log('debug', util.format(locale.addingLayout, model.getFilePath()));
					return model.setDefaults({
						isLayout: true,
						render: false,
						write: false
					});
				}),

			// Special Collections
			generate: database.createLiveChildCollection()
				.setQuery('generate', {
					dynamic: false,
					ignored: false
				})
				.on('add', model => docpad.log('debug', util.format(locale.addingGenerate, model.getFilePath()))),
			referencesOthers: database.createLiveChildCollection()
				.setQuery('referencesOthers', {
					dynamic: false,
					ignored: false,
					referencesOthers: true
				})
				.on('add', model => docpad.log('debug', util.format(locale.addingReferencesOthers, model.getFilePath()))),
			hasLayout: database.createLiveChildCollection()
				.setQuery('hasLayout', {
					dynamic: false,
					ignored: false,
					layout: { $exists: true
				}
				})
				.on('add', model => docpad.log('debug', util.format(locale.addingHasLayout, model.getFilePath()))),
			html: database.createLiveChildCollection()
				.setQuery('isHTML', {
					write: true,
					outExtension: 'html'
				})
				.on('add', model => docpad.log('debug', util.format(locale.addingHtml, model.getFilePath()))),
			stylesheet: database.createLiveChildCollection()
				.setQuery('isStylesheet', {
					write: true,
					outExtension: 'css'
				})
		});

		// Blocks
		this.setBlocks({
			meta: new MetaCollection(),
			scripts: new ScriptsCollection(),
			styles: new StylesCollection()
		});

		// Custom Collections Group
		const tasks = this.createTaskGroup("extendCollections tasks", { concurrency:0, next(err) {
			if (err) { docpad.error(err); }
			return docpad.emitSerial('extendCollections', next);
		}
	}
		);

		// Cycle through Custom Collections
		eachr(docpadConfig.collections || {}, function(fn,name) {
			let err;
			if (!name || !typeChecker.isString(name)) {
				err = new Error(`Inside your DocPad configuration you have a custom collection with an invalid name of: ${docpad.inspector(name)}`);
				docpad.error(err);
				return;
			}

			if (!fn || !typeChecker.isFunction(fn)) {
				err = new Error(`Inside your DocPad configuration you have a custom collection called ${docpad.inspector(name)} with an invalid method of: ${docpad.inspector(fn)}`);
				docpad.error(err);
				return;
			}

			return tasks.addTask(`creating the custom collection: ${name}`, complete =>
				// Init
				ambi([fn.bind(docpad), fn], database, function(err, collection) {
					// Check for error
					if (err) {
						docpad.error(err);
						return complete();

					// Check the type of the collection
					} else if (!(collection instanceof QueryCollection)) {
						docpad.warn(util.format(locale.errorInvalidCollection, name));
						return complete();
					}

					// Make it a live collection
					if (collection) { collection.live(true); }

					// Apply the collection
					docpad.setCollection(name, collection);
					return complete();
				})
			);
		});

		// Run Custom collections
		tasks.run();

		// Chain
		return this;
	}


	/**
	 * Reset collections. Perform a complete clean of our collections
	 * @private
	 * @method resetCollections
	 * @param {Object} opts
	 * @param {Function} next
	 * @param {Error} next.err
	 */
	resetCollections(opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts, next));
		const docpad = this;
		const database = docpad.getDatabase();

		// Make it as if we have never generated before
		docpad.generated = false;

		// Perform a complete clean of our collections
		database.reset([]);
		const meta = this.getBlock('meta').reset([]);
		const scripts = this.getBlock('scripts').reset([]);
		const styles = this.getBlock('styles').reset([]);
		// ^ Backbone.js v1.1 changes the return values of these, however we change that in our Element class
		// because if we didn't, all our skeletons would fail

		// Add default block entries
		if (docpad.getConfig().poweredByDocPad !== false) { meta.add(`<meta name="generator" content="DocPad v${docpad.getVersion()}" />`); }

		// Reset caches
		this.filesByUrl = {};
		this.filesBySelector = {};
		this.filesByOutPath = {};

		// Chain
		next();
		return this;
	}


	/**
	 * Initialise git repo
	 * @private
	 * @method initGitRepo
	 * @param {Object} opts
	 * @param {Function} next
	 * @param {Error} next.err
	 * @param {Object} next.results
	 */
	initGitRepo(opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts, next));
		const docpad = this;
		const config = this.getConfig();

		// Extract
		if (opts.cwd == null) { opts.cwd = config.rootPath; }
		if (opts.output == null) { opts.output = this.getDebugging(); }

		// Forward
		safeps.initGitRepo(opts, next);

		// Chain
		return this;
	}

	/**
	 * Init node modules
	 * @private
	 * @method initNodeModules
	 * @param {Object} opts
	 * @param {Function} next
	 * @param {Error} next.err
	 * @param {Object} next.results
	 */
	initNodeModules(opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts, next));
		const docpad = this;
		const config = this.getConfig();

		// Extract
		if (opts.cwd == null) { opts.cwd = config.rootPath; }
		if (opts.output == null) { opts.output = docpad.getDebugging(); }
		if (opts.force == null) { opts.force = config.offline ? false : true; }
		// ^ @todo this line causes --force to be added, when it shouldn't be
		if (opts.args == null) { opts.args = []; }
		if (config.force) { opts.args.push('--force'); }
		if (config.offline) { opts.args.push('--no-registry'); }

		// Log
		if (opts.output) { docpad.log('info', 'npm install'); }

		// Forward
		safeps.initNodeModules(opts, next);

		// Chain
		return this;
	}

	/**
	 * Fix node package versions
	 * Combat to https://github.com/npm/npm/issues/4587#issuecomment-35370453
	 * @private
	 * @method fixNodePackageVersions
	 * @param {Object} opts
	 * @param {Function} next
	 * @param {Error} next.err
	 */
	fixNodePackageVersions(opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts, next));
		const docpad = this;
		const config = this.getConfig();

		// Extract
		if (opts.packagePath == null) { opts.packagePath = config.packagePath; }

		// Read and replace
		safefs.readFile(opts.packagePath, function(err,buffer) {
			let data = buffer.toString();
			data = data.replace(/("docpad(?:.*?)": ")\^/g, '$1~');
			return safefs.writeFile(opts.packagePath, data, err => next(err));
		});

		// Chain
		return this;
	}


	/**
	 * Install node module. Same as running
	 * 'npm install' through the command line
	 * @private
	 * @method installNodeModule
	 * @param {Array} names
	 * @param {Object} opts
	 * @param {Function} next
	 * @param {Error} next.err
	 * @param {Object} next.result
	 */
	installNodeModule(names,opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts, next));
		const docpad = this;
		const config = this.getConfig();

		// Extract
		if (opts.cwd == null) { opts.cwd = config.rootPath; }
		if (opts.args == null) { opts.args = []; }
		if (docpad.getDebugging()) {
			if (opts.stdio == null) { opts.stdio = 'inherit'; }
		}

		if (opts.global == null) { opts.global = false; }
		if (opts.global === true) { opts.global = ['--global']; }
		if (opts.global && (Array.isArray(opts.global) === false)) { opts.global = [opts.global]; }

		if (opts.save == null) { opts.save = !opts.global; }
		if (opts.save === true) { opts.save = ['--save']; }
		if (opts.save && (Array.isArray(opts.save) === false)) { opts.save = [opts.save]; }

		// Command
		const command = ['npm', 'install'];

		// Names
		if (!typeChecker.isArray(names)) { names = names.split(/[,\s]+/); }
		names.forEach(function(name) {
			// Check
			if (!name) { return; }

			// Ensure latest if version isn't specfied
			if (name.indexOf('@') === -1) { name += '@latest'; }

			// Push the name to the commands
			return command.push(name);
		});

		// Arguments
		command.push(...Array.from(opts.args || []));
		if (config.force) { command.push('--force'); }
		if (config.offline) { command.push('--no-registry'); }
		if (opts.save) { command.push(...Array.from(opts.save || [])); }
		if (opts.global) { command.push(...Array.from(opts.global || [])); }

		// Log
		if (opts.output) { docpad.log('info', command.join(' ')); }

		// Forward
		safeps.spawn(command, opts, next);

		// Chain
		return this;
	}


	/**
	 * Uninstall node module. Same as running
	 * 'npm uninstall' through the command line
	 * @private
	 * @method uninstallNodeModule
	 * @param {Array} names
	 * @param {Object} opts
	 * @param {Function} next
	 * @param {Error} next.err
	 * @param {Object} next.result
	 */
	uninstallNodeModule(names,opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts, next));
		const docpad = this;
		const config = this.getConfig();

		// Extract
		if (opts.cwd == null) { opts.cwd = config.rootPath; }
		if (opts.output == null) { opts.output = docpad.getDebugging(); }
		if (opts.args == null) { opts.args = []; }

		if (opts.global == null) { opts.global = false; }
		if (opts.global === true) { opts.global = ['--global']; }
		if (opts.global && (Array.isArray(opts.global) === false)) { opts.global = [opts.global]; }

		if (opts.save == null) { opts.save = !opts.global; }
		if (opts.save === true) { opts.save = ['--save', '--save-dev']; }
		if (opts.save && (Array.isArray(opts.save) === false)) { opts.save = [opts.save]; }

		// Command
		const command = ['npm', 'uninstall'];

		// Names
		if (!typeChecker.isArray(names)) { names = names.split(/[,\s]+/); }
		command.push(...Array.from(names || []));

		// Arguments
		command.push(...Array.from(opts.args || []));
		if (opts.save) { command.push(...Array.from(opts.save || [])); }
		if (opts.global) { command.push(...Array.from(opts.global || [])); }

		// Log
		if (opts.output) { docpad.log('info', command.join(' ')); }

		// Forward
		safeps.spawn(command, opts, next);

		// Chain
		return this;
	}



	// =================================
	// Logging

	/**
	 * Set the log level
	 * @private
	 * @method setLogLevel
	 * @param {Number} level
	 */
	setLogLevel(level) {
		this.getLogger().setConfig({level});
		if (level === 7) {
			const loggers = this.getLoggers();
			if ((loggers.debug != null) === false) {
				loggers.debug = loggers.logger
					.pipe(
						require('caterpillar-human').create({color:false})
					)
					.pipe(
						require('fs').createWriteStream(this.debugLogPath)
					);
			}
		}
		return this;
	}

	/**
	 * Get the log level
	 * @method getLogLevel
	 * @return {Number} the log level
	 */
	getLogLevel() {
		return this.getConfig().logLevel;
	}

	/**
	 * Are we debugging?
	 * @method getDebugging
	 * @return {Boolean}
	 */
	getDebugging() {
		return this.getLogLevel() === 7;
	}


	/**
	 * Handle a fatal error
	 * @private
	 * @method fatal
	 * @param {Object} err
	 */
	fatal(err) {
		const docpad = this;
		const config = this.getConfig();

		// Check
		if (!err) { return this; }

		// Handle
		this.error(err);

		// Even though the error would have already been logged by the above
		// Ensure it is definitely outputted in the case the above fails
		docpadUtil.writeError(err);

		// Destroy DocPad
		this.destroy();

		// Chain
		return this;
	}


	/**
	 * Inspect. Converts object to JSON string. Wrapper around nodes util.inspect method.
	 * Can't use the inspect namespace as for some silly reason it destroys everything
	 * @method inspector
	 * @param {Object} obj
	 * @param {Object} opts
	 * @return {String} JSON string of passed object
	 */
	inspector(obj, opts) {
		if (opts == null) { opts = {}; }
		if (opts.colors == null) { opts.colors = this.getConfig().color; }
		return docpadUtil.inspect(obj, opts);
	}

	/**
	 * Log arguments
	 * @property {Object} log
	 * @param {Mixed} args...
	 */
	log(...args) {
		// Log
		const logger = this.getLogger() || console;
		logger.log.apply(logger, args);

		// Chain
		return this;
	}


	/**
	 * Create an error object
	 * @method createError
	 * @param {Object} err
	 * @param {Object} opts
	 * @return {Object} the error
	 */
	// @TODO: Decide whether or not we should track warnings
	// Previously we didn't, but perhaps it would be useful
	// If the statistics gets polluted after a while, we will remove it
	// Ask @balupton to check the stats after March 30th 2015
	createError(err, opts) {
		// Prepare
		if (opts == null) { opts = {}; }
		if (opts.level == null) { opts.level = err.level != null ? err.level : 'error'; }
		if (opts.track == null) { opts.track = err.track != null ? err.track : true; }
		if (opts.tracked == null) { opts.tracked = err.tracked != null ? err.tracked : false; }
		if (opts.log == null) { opts.log = err.log != null ? err.log : true; }
		if (opts.logged == null) { opts.logged = err.logged != null ? err.logged : false; }
		if (opts.notify == null) { opts.notify = err.notify != null ? err.notify : true; }
		if (opts.notified == null) { opts.notified = err.notified != null ? err.notified : false; }
		if (err.context != null) { if (opts.context == null) { opts.context = err.context; } }

		// Ensure we have an error object
		if (!err.stack) { err = new Error(err); }

		// Add our options to the error object
		for (let key of Object.keys(opts || {})) {
			const value = opts[key];
			if (err[key] == null) { err[key] = value; }
		}

		// Return the error
		return err;
	}


	/**
	 * Create an error (tracks it) and log it
	 * @method error
	 * @param {Object} err
	 * @param {Object} [level='err']
	 */
	error(err, level) {
		// Prepare
		if (level == null) { level = 'err'; }
		const docpad = this;

		// Create the error and track it
		err = this.createError(err, {level});

		// Track the error
		this.trackError(err);

		// Log the error
		this.logError(err);

		// Notify the error
		this.notifyError(err);

		// Chain
		return this;
	}

	/**
	 * Log an error
	 * @method logError
	 * @param {Object} err
	 */
	logError(err) {
		// Prepare
		const docpad = this;
		const locale = this.getLocale();

		// Track
		if (err && (err.log !== false) && (err.logged !== true)) {
			err = this.createError(err, {logged:true});
			const occured =
				['warn', 'warning'].includes(err.level) ?
					locale.warnOccured
				:
					locale.errorOccured;
			let message =
				err.context ?
					err.context+locale.errorFollows
				:
					occured;
			message += `\n\n${err.stack.toString().trim()}`;
			message += `\n\n${locale.errorSubmission}`;
			docpad.log(err.level, message);
		}

		// Chain
		return this;
	}


	/**
	 * Track an error in the background
	 * @private
	 * @method trackError
	 * @param {Object} err
	 */
	trackError(err) {
		// Prepare
		const docpad = this;
		const config = this.getConfig();

		// Track
		if (err && (err.track !== false) && (err.tracked !== true) && (config.offline === false) && (config.reportErrors === true)) {
			err = this.createError(err, {tracked:true});
			const data = {};
			data.message = err.message;
			if (err.stack) { data.stack = err.stack.toString().trim(); }
			data.config = config;
			data.env = process.env;
			docpad.track('error', data);
		}

		// Chain
		return this;
	}

	/**
	 * Notify error
	 * @private
	 * @method notifyError
	 * @param {Object} err
	 */
	notifyError(err) {
		// Prepare
		const docpad = this;
		const locale = this.getLocale();

		// Check
		if ((err.notify !== false) && (err.notified !== true)) {
			err.notified = true;
			const occured =
				['warn', 'warning'].includes(err.level) ?
					locale.warnOccured
				:
					locale.errorOccured;
			docpad.notify(err.message, {title:occured});
		}

		// Chain
		return this;
	}

	/**
	 * Log an error of level 'warn'
	 * @method warn
	 * @param {String} message
	 * @param {Object} err
	 * @return {Object} description
	 */
	warn(message, err) {
		// Handle
		if (err) {
			err.context = message;
			err.level = 'warn';
			this.error(err);
		} else {
			err =
				message instanceof Error ?
					message
				:
					new Error(message);
			err.level = 'warn';
			this.error(err);
		}

		// Chain
		return this;
	}


	/**
	 * Send a notify event to plugins (like growl)
	 * @method notify
	 * @param {String} message
	 * @param {Object} [opts={}]
	 */
	notify(message,opts) {
		// Prepare
		if (opts == null) { opts = {}; }
		const docpad = this;

		// Emit
		docpad.emitSerial('notify', {message,opts}, function(err) {
			if (err) { return docpad.error(err); }
		});

		// Chain
		return this;
	}


	/**
	 * Check Request
	 * @private
	 * @method checkRequest
	 * @param {Function} next
	 * @param {Error} next.err
	 * @param {Object} next.res
	 */
	checkRequest(next) {
		if (next == null) { next = this.error.bind(this); }
		return function(err,res) {
			// Check
			if (err) { return next(err, res); }

			// Check
			if (((res.body != null ? res.body.success : undefined) === false) || (res.body != null ? res.body.error : undefined)) {
				err = new Error(res.body.error || 'unknown request error');  // @TODO localise this
				return next(err, res);
			}

			// Success
			return next(null, res);
		};
	}


	/**
	 * Subscribe to the DocPad email list.
	 * @private
	 * @method subscribe
	 * @param {Function} next
	 * @param {Error} next.err
	 */
	subscribe(next) {
		// Prepare
		const config = this.getConfig();

		// Check
		if (config.offline === false) {
			if (this.userConfig != null ? this.userConfig.email : undefined) {
				// Data
				const data = {};
				data.email = this.userConfig.email;  // required
				data.name = this.userConfig.name || null;
				data.username = this.userConfig.username || null;

				// Apply
				superAgent
					.post(config.helperUrl)
					.type('json').set('Accept', 'application/json')
					.query({
						method: 'add-subscriber'
					})
					.send(data)
					.timeout(30*1000)
					.end(this.checkRequest(next));
			} else {
				const err = new Error('Email not provided');  // @TODO localise this
				if (typeof next === 'function') {
					next(err);
				}
			}
		} else {
			if (typeof next === 'function') {
				next();
			}
		}

		// Chain
		return this;
	}

	/**
	 * Track
	 * @private
	 * @method track
	 * @param {String} name
	 * @param {Object} [things={}]
	 * @param {Function} next
	 * @param {Error} next.err
	 */
	track(name,things,next) {
		// Prepare
		if (things == null) { things = {}; }
		const docpad = this;
		const config = this.getConfig();

		// Check
		if ((config.offline === false) && config.reportStatistics) {
			// Data
			const data = {};
			data.userId = this.userConfig.username || null;
			data.event = name;
			data.properties = things;

			// Things
			if (this.websitePackageConfig != null ? this.websitePackageConfig.name : undefined) { things.websiteName = this.websitePackageConfig.name; }
			things.platform = this.getProcessPlatform();
			things.environment = this.getEnvironment();
			things.version = this.getVersion();
			things.nodeVersion = this.getProcessVersion();

			// Plugins
			eachr(docpad.loadedPlugins, (value,key) => things[`plugin-${key}`] = value.version || true);

			// Apply
			const trackRunner = docpad.getTrackRunner();
			trackRunner.addTask('track task', complete =>
				superAgent
					.post(config.helperUrl)
					.type('json').set('Accept', 'application/json')
					.query({
						method: 'analytics',
						action: 'track'
					})
					.send(data)
					.timeout(30*1000)
					.end(docpad.checkRequest(function(err) {
						if (typeof next === 'function') {
							next(err);
						}
						return complete(err);
					})
				)
			);  // we pass the error here, as if we error, we want to stop all tracking

			// Execute the tracker tasks
			trackRunner.run();
		} else {
			if (typeof next === 'function') {
				next();
			}
		}

		// Chain
		return this;
	}

	/**
	 * Identify DocPad user
	 * @private
	 * @method identify
	 * @param {Function} next
	 * @param {Error} next.err
	 */
	identify(next) {
		// Prepare
		const docpad = this;
		const config = this.getConfig();

		// Check
		if ((config.offline === false) && config.reportStatistics && (this.userConfig != null ? this.userConfig.username : undefined)) {
			// Data
			let things;
			const data = {};
			data.userId = this.userConfig.username;  // required
			data.traits = (things = {});

			// Things
			const now = new Date();
			things.username = this.userConfig.username;  // required
			things.email = this.userConfig.email || null;
			things.name = this.userConfig.name || null;
			things.lastLogin = now.toISOString();
			things.lastSeen = now.toISOString();
			things.countryCode = safeps.getCountryCode();
			things.languageCode = safeps.getLanguageCode();
			things.platform = this.getProcessPlatform();
			things.version = this.getVersion();
			things.nodeVersion = this.getProcessVersion();

			// Is this a new user?
			if (docpad.userConfig.identified !== true) {
				// Update
				things.created = now.toISOString();

				// Create the new user
				docpad.getTrackRunner().addTask('create new user', complete =>
					superAgent
						.post(config.helperUrl)
						.type('json').set('Accept', 'application/json')
						.query({
							method: 'analytics',
							action: 'identify'
						})
						.send(data)
						.timeout(30*1000)
						.end(docpad.checkRequest(err =>
							// Save the changes with these
							docpad.updateUserConfig({identified:true}, complete)
						)
					)
				);

			// Or an existing user?
			} else {
				// Update the existing user's information witht he latest
				docpad.getTrackRunner().addTask('update user', complete =>
					superAgent
						.post(config.helperUrl)
						.type('json').set('Accept', 'application/json')
						.query({
							method: 'analytics',
							action: 'identify'
						})
						.send(data)
						.timeout(30*1000)
						.end(docpad.checkRequest(complete))
				);
			}
		}

		// Chain
		if (typeof next === 'function') {
			next();
		}
		return this;
	}


	// =================================
	// Models and Collections

	// ---------------------------------
	// b/c compat functions

	/**
	 * Create file model. Calls
	 * {{#crossLink "DocPad/createModel:method"}}{{/crossLink}}
	 * with the 'file' modelType.
	 * @method createFile
	 * @param {Object} [attrs={}]
	 * @param {Object} [opts={}]
	 * @return {Object} FileModel
	 */
	createFile(attrs,opts) {
		if (attrs == null) { attrs = {}; }
		if (opts == null) { opts = {}; }
		opts.modelType = 'file';
		return this.createModel(attrs, opts);
	}

	/**
	 * Create document model. Calls
	 * {{#crossLink "DocPad/createModel:method"}}{{/crossLink}}
	 * with the 'document' modelType.
	 * @method createDocument
	 * @param {Object} [attrs={}]
	 * @param {Object} [opts={}]
	 * @return {Object} DocumentModel
	 */
	createDocument(attrs,opts) {
		if (attrs == null) { attrs = {}; }
		if (opts == null) { opts = {}; }
		opts.modelType = 'document';
		return this.createModel(attrs, opts);
	}


	/**
	 * Parse the files directory and
	 * return a files collection to
	 * the passed callback
	 * @method parseFileDirectory
	 * @param {Object} [opts={}]
	 * @param {Function} next callback
	 * @param {Error} next.err
	 * @param {Object} next.files files collection
	 */
	parseFileDirectory(opts,next) {
		if (opts == null) { opts = {}; }
		if (opts.modelType == null) { opts.modelType = 'file'; }
		if (opts.collection == null) { opts.collection = this.getDatabase(); }
		return this.parseDirectory(opts, next);
	}

	/**
	 * Parse the documents directory and
	 * return a documents collection to
	 * the passed callback.
	 *
	 * The partials plugin (https://github.com/docpad/docpad-plugin-partials)
	 * uses this method to load a collection of
	 * files from the partials directory.
	 *
	 * 	docpad.parseDocumentDirectory({path: config.partialsPath}, next)
	 *
	 * @method parseDocumentDirectory
	 * @param {Object} [opts={}]
	 * @param {String} [opts.modelType='document']
	 * @param {Object} [opts.collection=docpad.database]
	 * @param {Object} [opts.path]
	 * @param {Function} next
	 * @param {Error} next.err
	 * @param {Object} next.files files collection of documents
	 */
	parseDocumentDirectory(opts,next) {
		if (opts == null) { opts = {}; }
		if (opts.modelType == null) { opts.modelType = 'document'; }
		if (opts.collection == null) { opts.collection = this.getDatabase(); }
		return this.parseDirectory(opts, next);
	}


	// ---------------------------------
	// Standard functions


	/**
	 * Attach events to a document model.
	 * @private
	 * @method attachModelEvents
	 * @param {Object} model
	 */
	attachModelEvents(model) {
		// Prepare
		const docpad = this;

		// Only attach events if we haven't already done so
		if (model.attachedDocumentEvents !== true) {
			model.attachedDocumentEvents = true;

			// Attach document events
			if (model.type === 'document') {
				// Clone
				model.on('clone', clonedModel => docpad.attachModelEvents(clonedModel));

				// Render
				model.on('render', (...args) => docpad.emitSerial('render', ...Array.from(args)));

				// Render document
				model.on('renderDocument', (...args) => docpad.emitSerial('renderDocument', ...Array.from(args)));

				// Fetch a layout
				model.on('getLayout', function(opts,next) {
					if (opts == null) { opts = {}; }
					opts.collection = docpad.getCollection('layouts');
					const layout = docpad.getFileBySelector(opts.selector, opts);
					return next(null, {layout});
				});
			}

			// Remove
			//model.on 'remove', (file) ->
			//	docpad.getDatabase().remove(file)
			// ^ Commented out as for some reason this stops layouts from working

			// Error
			model.on('error', (...args) => docpad.error(...Array.from(args || [])));

			// Log
			model.on('log', function(...args) {
				if (args.length === 2) {
					if (['err', 'error'].includes(args[0])) {
						docpad.error(args[1]);
						return;
					}

					if (['warn', 'warning'].includes(args[0])) {
						docpad.warn(args[1]);
						return;
					}
				}

				return docpad.log(...Array.from(args || []));
			});
		}

		// Chain
		return this;
	}

	/**
	 * Add supplied model to the DocPad database. If the passed
	 * model definition is a plain object of properties, a new
	 * model will be created prior to adding to the database.
	 * Calls {{#crossLink "DocPad/createModel:method"}}{{/crossLink}}
	 * before adding the model to the database.
	 *
	 *	# Override the stat's mtime to now
	 *	# This is because renames will not update the mtime
	 *	fileCurrentStat?.mtime = new Date()
	 *
	 *	# Create the file object
	 *	file = docpad.addModel({fullPath:filePath, stat:fileCurrentStat})
	 *
	 * @method addModel
	 * @param {Object} model either a plain object defining the required properties, in particular
	 * the file path or an actual model object
	 * @param {Object} opts
	 * @return {Object} the model
	 */
	addModel(model, opts) {
		model = this.createModel(model, opts);
		this.getDatabase().add(model);
		return model;
	}

	/**
	 * Add the supplied collection of models to the DocPad database.
	 * Calls {{#crossLink "DocPad/createModels:method"}}{{/crossLink}}
	 * before adding the models to the database.
	 *
	 * 	databaseData = JSON.parse data.toString()
	 *	models = docpad.addModels(databaseData.models)
	 *
	 * @method addModels
	 * @param {Object} models DocPad collection of models
	 * @param {Object} opts
	 * @return {Object} the models
	 */
	addModels(models, opts) {
		models = this.createModels(models, opts);
		this.getDatabase().add(models);
		return models;
	}

	/**
	 * Create a collection of models from the supplied collection
	 * ensuring that the collection is suitable for adding to the
	 * DocPad database. The method calls {{#crossLink "DocPad/createModel"}}{{/crossLink}}
	 * for each model in the models array.
	 * @private
	 * @method createModels
	 * @param {Object} models DocPad collection of models
	 * @param {Object} opts
	 * @return {Object} the models
	 */
	createModels(models, opts) {
		return Array.from(models).map((model) =>
			this.createModel(model, opts));
	}
		// return the for loop results

	/**
	* Creates either a file or document model.
	* The model type to be created can be passed
	* as an opts property, if not, the method will
	* attempt to determing the model type by checking
	* if the file is in one of the documents or
	* layout paths.
	*
	* Ensures a duplicate model is not created
	* and all required attributes are present and
	* events attached.
	*
	* Generally it is not necessary for an application
	* to manually create a model via creatModel as DocPad
	* will handle this process when watching a project's
	* file and document directories. However, it is possible
	* that a plugin might have a requirement to do so.
	*
	* 	model = @docpad.createModel({fullPath:fullPath})
    *   model.load()
    *   @docpad.getDatabase().add(model)
	*
	* @method createModel
	* @param {Object} [attrs={}]
	* @param {String} attrs.fullPath the full path to the file
	* @param {Object} [opts={}]
	* @param {String} opts.modelType either 'file' or 'document'
	* @return {Object} the file or document model
	*/
	createModel(attrs,opts) {
		// Check
		let model;
		if (attrs == null) { attrs = {}; }
		if (opts == null) { opts = {}; }
		if (attrs instanceof FileModel) {
			return attrs;
		}

		// Prepare
		const docpad = this;
		const config = this.getConfig();
		const database = this.getDatabase();
		const fileFullPath = attrs.fullPath || null;


		// Find or create
		// This functionality use to be inside ensureModel
		// But that caused duplicates in some instances
		// So now we will always check
		if (attrs.fullPath) {
			const result = database.findOne({fullPath: attrs.fullPath});
			if (result) {
				return result;
			}
		}


		// -----------------------------
		// Try and determine the model type

		// If the type hasn't been specified try and detemrine it based on the full path
		if (fileFullPath) {
			// Check if we have a document or layout
			let dirPath;
			if (!opts.modelType) {
				for (dirPath of Array.from(config.documentsPaths.concat(config.layoutsPaths))) {
					if (fileFullPath.indexOf(dirPath) === 0) {
						if (!attrs.relativePath) { attrs.relativePath = fileFullPath.replace(dirPath, '').replace(/^[\/\\]/,''); }
						opts.modelType = 'document';
						break;
					}
				}
			}

			// Check if we have a file
			if (!opts.modelType) {
				for (dirPath of Array.from(config.filesPaths)) {
					if (fileFullPath.indexOf(dirPath) === 0) {
						if (!attrs.relativePath) { attrs.relativePath = fileFullPath.replace(dirPath, '').replace(/^[\/\\]/,''); }
						opts.modelType = 'file';
						break;
					}
				}
			}
		}

		// -----------------------------
		// Create the appropriate emodel

		// Extend the opts with things we need
		opts = extendr.extend({
			detectEncoding: config.detectEncoding,
			rootOutDirPath: config.outPath,
			locale: this.getLocale(),
			TaskGroup: this.createTaskGroup  // @TODO this a bit dodgy, but works well enough
		}, opts);

		if (opts.modelType === 'file') {
			// Create a file model
			model = new FileModel(attrs, opts);
		} else {
			// Create document model
			model = new DocumentModel(attrs, opts);
		}

		// -----------------------------
		// Finish up

		// Attach Events
		this.attachModelEvents(model);

		// Return
		return model;
	}

	/**
	 * Parse a directory and return a
	 * files collection
	 * @method parseDirectory
	 * @param {Object} [opts={}]
	 * @param {Object} next
	 * @param {Error} next.err
	 * @param {Object} next.files files collection
	 */
	parseDirectory(opts,next) {
		// Prepare
		if (opts == null) { opts = {}; }
		[opts,next] = Array.from(extractOptsAndCallback(opts, next));
		const docpad = this;
		const locale = this.getLocale();

		// Extract
		let {path,createFunction} = opts;
		if (createFunction == null) { createFunction = this.createModel; }
		const files = opts.collection || new FilesCollection();

		// Check if the directory exists
		safefs.exists(path, function(exists) {
			// Check
			if (!exists) {
				// Log
				docpad.log('debug', util.format(locale.renderDirectoryNonexistant, path));

				// Forward
				return next();
			}

			// Log
			docpad.log('debug', util.format(locale.renderDirectoryParsing, path));

			// Tasks
			const tasks = new TaskGroup('parse directory').setConfig({concurrency:0}).done(function(err) {
				// Check
				if (err) { return next(err); }

				// Log
				docpad.log('debug', util.format(locale.renderDirectoryParsed, path));

				// Forward
				return next(null, files);
			});

			// Files
			return docpad.scandir({
				// Path
				path,

				// File Action
				fileAction(fileFullPath, fileRelativePath, filename, fileStat) {
					// Prepare
					const data = {
						fullPath: fileFullPath,
						relativePath: fileRelativePath,
						stat: fileStat
					};

					// Create file
					const file = createFunction.call(docpad, data, opts);

					// Create a task to load the file
					tasks.addTask(`load the file ${fileRelativePath}`, complete =>
						// Update the file's stat
						// To ensure changes files are handled correctly in generation
						file.action('load', function(err) {
							// Error?
							if (err) { return complete(err); }

							// Add the file to the collection
							files.add(file);

							// Next
							return complete();
						})
					);

					// Return
				},

				// Next
				next(err) {
					if (err) { return next(err); }
					return tasks.run();
				}
			});
		});

		// Chain
		return this;
	}


	// =================================
	// Plugins

	/**
	 * Get a plugin by it's name
	 * @method getPlugin
	 * @param {Object} pluginName
	 * @return {Object} a DocPad plugin
	 */
	getPlugin(pluginName) {
		return this.loadedPlugins[pluginName];
	}


	/**
	 * Check if we have any plugins
	 * @method hasPlugins
	 * @return {Boolean}
	 */
	hasPlugins() {
		return typeChecker.isEmptyObject(this.loadedPlugins) === false;
	}

	/**
	 * Destructor. Destroy plugins
	 * @private
	 * @method destroyPlugins
	 */
	destroyPlugins() {
		for (let name of Object.keys(this.loadedPlugins || {})) {
			const plugin = this.loadedPlugins[name];
			plugin.destroy();
			this.loadedPlugins[name] = null;
		}
		return this;
	}

	/**
	 * Load plugins from the file system
	 * next(err)
	 * @private
	 * @method loadPlugins
	 * @param {Function} next
	 * @param {Error} next.err
	 */
	loadPlugins(next) {
		// Prepare
		const docpad = this;
		const locale = this.getLocale();

		// Snore
		this.slowPlugins = {};
		const snore = balUtil.createSnore(() => docpad.log('notice', util.format(locale.pluginsSlow, Object.keys(docpad.slowPlugins).join(', '))));

		// Async
		const tasks = this.createTaskGroup("loadPlugins tasks", { concurrency:0, next(err) {
			docpad.slowPlugins = {};
			snore.clear();
			return next(err);
		}
	}
		);

		// Load website plugins
		(this.config.pluginsPaths || []).forEach(pluginsPath =>
			tasks.addTask(`load the website's plugins at: ${pluginsPath}`, complete =>
				safefs.exists(pluginsPath, function(exists) {
					if (!exists) { return complete(); }
					return docpad.loadPluginsIn(pluginsPath, complete);
				})
			)
		);

		// Load specific plugins
		(this.config.pluginPaths || []).forEach(pluginPath =>
			tasks.addTask(`load custom plugins at: ${pluginPath}`, complete =>
				safefs.exists(pluginPath, function(exists) {
					if (!exists) { return complete(); }
					return docpad.loadPlugin(pluginPath, complete);
				})
			)
		);

		// Execute the loading asynchronously
		tasks.run();

		// Chain
		return this;
	}

	/**
	 * Checks if a plugin was loaded succesfully.
	 * @method loadedPlugin
	 * @param {String} pluginName
	 * @param {Function} next
	 * @param {Error} next.err
	 * @param {Boolean} next.loaded
	 */
	loadedPlugin(pluginName,next) {
		// Prepare
		const docpad = this;

		// Check
		const loaded = (docpad.loadedPlugins[pluginName] != null);
		next(null,loaded);

		// Chain
		return this;
	}

	/**
	 * Load a plugin from its full file path
	 * _next(err)
	 * @private
	 * @method loadPlugin
	 * @param {String} fileFullPath
	 * @param {Function} _next
	 * @param {Error} _next.err
	 * @return {Object} description
	 */
	loadPlugin(fileFullPath,_next) {
		// Prepare
		const docpad = this;
		const config = this.getConfig();
		const locale = this.getLocale();
		const next = function(err) {
			// Remove from slow plugins
			delete docpad.slowPlugins[pluginName];
			// Forward
			return _next(err);
		};

		// Prepare variables
		const loader = new PluginLoader({
			dirPath: fileFullPath,
			docpad: this,
			BasePlugin
		});
		var { pluginName } = loader;
		const enabled = (
			(config.enableUnlistedPlugins  &&  ((config.enabledPlugins[pluginName] != null) === false))  ||
			(config.enabledPlugins[pluginName] === true)
		);

		// If we've already been loaded, then exit early as there is no use for us to load again
		if (docpad.loadedPlugins[pluginName] != null) {
			// However we probably want to reload the configuration as perhaps the user or environment configuration has changed
			docpad.loadedPlugins[pluginName].setConfig();
			// Complete
			return _next();
		}

		// Add to loading stores
		docpad.slowPlugins[pluginName] = true;

		// Check
		if (!enabled) {
			// Skip
			docpad.log('debug', util.format(locale.pluginSkipped, pluginName));
			return next();
		} else {
			// Load
			docpad.log('debug', util.format(locale.pluginLoading, pluginName));

			// Check existance
			loader.exists(function(err,exists) {
				// Error or doesn't exist?
				if (err || !exists) { return next(err); }

				// Check support
				return loader.unsupported(function(err,unsupported) {
					// Error?
					if (err) { return next(err); }

					// Unsupported?
					if (unsupported) {
						// Version?
						if (['version-docpad','version-plugin'].includes(unsupported) && (config.skipUnsupportedPlugins === false)) {
							docpad.log('warn', util.format(locale.pluginContinued, pluginName));
						} else {
							// Type?
							if (unsupported === 'type') {
								docpad.log('debug', util.format(locale.pluginSkippedDueTo, pluginName, unsupported));

							// Something else?
							} else {
								docpad.log('warn', util.format(locale.pluginSkippedDueTo, pluginName, unsupported));
							}
							return next();
						}
					}

					// Load the class
					return loader.load(function(err) {
						if (err) { return next(err); }

						// Create an instance
						return loader.create({}, function(err,pluginInstance) {
							if (err) { return next(err); }

							// Add to plugin stores
							docpad.loadedPlugins[loader.pluginName] = pluginInstance;

							// Log completion
							docpad.log('debug', util.format(locale.pluginLoaded, pluginName));

							// Forward
							return next();
						});
					});
				});
			});
		}

		// Chain
		return this;
	}

	/**
	 * Load plugins from a directory path
	 * @private
	 * @method loadPluginsIn
	 * @param {String} pluginsPath
	 * @param {Function} next
	 * @param {Error} next.err
	 */
	loadPluginsIn(pluginsPath, next) {
		// Prepare
		const docpad = this;
		const locale = this.getLocale();

		// Tasks
		const tasks = new TaskGroup('load plugins').setConfig({concurrency:0}).done(function(err) {
			docpad.log('debug', util.format(locale.pluginsLoadedFor, pluginsPath));
			return next(err);
		});

		// Load Plugins
		docpad.log('debug', util.format(locale.pluginsLoadingFor, pluginsPath));
		docpad.scandir({
			// Path
			path: pluginsPath,

			// Skip files
			fileAction: false,

			// Handle directories
			dirAction(fileFullPath, fileRelativePath, pluginName) {
				// Prepare
				pluginName = pathUtil.basename(fileFullPath);

				// Add the task to load the oplugin to the queue
				return tasks.addTask(`load the plugin ${pluginName}`, complete =>
					// Otherwise, it is a plugin directory, so load the plugin
					docpad.loadPlugin(fileFullPath, function(err) {
						// Warn about the plugin load error if there is one
						if (err) {
							docpad.warn(util.format(locale.pluginFailedToLoad, pluginName, fileFullPath), err);
						}

						// All done and don't recurse into this directory
						return complete();
					})
				);
			},

			// Next
			next(err) {
				if (err) { return next(err); }
				return tasks.run();
			}
		});

		// Chain
		return this;
	}


	// =================================
	// Utilities

	// ---------------------------------
	// Utilities: Misc

	/**
	 * Compare current DocPad version to the latest
	 * and print out the result to the console.
	 * Used at startup.
	 * @private
	 * @method compareVersion
	 */
	compareVersion() {
		// Prepare
		const docpad = this;
		const config = this.getConfig();
		const locale = this.getLocale();

		// Check
		if (config.offline || !config.checkVersion) { return this; }

		// Check
		balUtil.packageCompare({
			local: this.packagePath,
			remote: config.helperUrl+'latest',
			newVersionCallback(details) {
				const isLocalInstallation = docpadUtil.isLocalDocPadExecutable();
				const message = (isLocalInstallation ? locale.versionOutdatedLocal : locale.versionOutdatedGlobal);
				const currentVersion = `v${details.local.version}`;
				const latestVersion = `v${details.remote.version}`;
				const upgradeUrl = details.local.upgradeUrl || details.remote.installUrl || details.remote.homepage;
				const messageFilled = util.format(message, currentVersion, latestVersion, upgradeUrl);
				docpad.notify(latestVersion, {title:locale.versionOutdatedNotification});
				return docpad.log('notice', messageFilled);
			}
		});

		// Chain
		return this;
	}


	// ---------------------------------
	// Utilities: Exchange


	/**
	 * Get DocPad's exchange data
	 * Requires internet access
	 * next(err,exchange)
	 * @private
	 * @method getExchange
	 * @param {Function} next
	 * @param {Error} next.err
	 * @param {Object} next.exchange docpad.exchange
	 */
	getExchange(next) {
		// Prepare
		const docpad = this;
		const config = this.getConfig();
		let locale = this.getLocale();

		// Check if it is stored locally
		if (typeChecker.isEmptyObject(docpad.exchange) === false) { return next(null, docpad.exchange); }

		// Offline?
		if (config.offline) { return next(null, null); }

		// Log
		docpad.log('info', locale.exchangeUpdate+' '+locale.pleaseWait);

		// Otherwise fetch it from the exchangeUrl
		const exchangeUrl = config.helperUrl+'?method=exchange&version='+this.version;
		docpad.loadConfigUrl(exchangeUrl, function(err,parsedData) {
			// Check
			if (err) {
				locale = docpad.getLocale();
				docpad.warn(locale.exchangeError, err);
				return next();
			}

			// Log
			docpad.log('info', locale.exchangeUpdated);

			// Success
			docpad.exchange = parsedData;
			return next(null, parsedData);
		});

		// Chain
		return this;
	}


	// ---------------------------------
	// Utilities: Files

	/**
	 * Contextualize files.
	 * Contextualizing is the process of adding layouts and
	 * awareness of other documents to our document. The
	 * contextualizeBefore and contextualizeAfter events
	 * are emitted here.
	 * @private
	 * @method contextualizeFiles
	 * @param {Object} [opts={}]
	 * @param {Function} next
	 * @param {Error} next.err
	 */
	contextualizeFiles(opts,next) {
		// Prepare
		if (opts == null) { opts = {}; }
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));
		const {collection,templateData} = opts;
		const docpad = this;
		const config = this.getConfig();
		const locale = this.getLocale();
		const slowFilesObject = {};
		let slowFilesTimer = null;

		// Update progress
		if (opts.progress != null) {
			opts.progress.step("contextualizeFiles (preparing)").total(1).setTick(0);
		}

		// Log
		docpad.log('debug', util.format(locale.contextualizingFiles, collection.length));

		// Start contextualizing
		docpad.emitSerial('contextualizeBefore', {collection,templateData}, function(err) {
			// Prepare
			if (err) { return next(err); }

			// Completion callback
			const tasks = docpad.createTaskGroup("contextualizeFiles tasks", { concurrency:0, next(err) {
				// Kill the timer
				clearInterval(slowFilesTimer);
				slowFilesTimer = null;

				// Check
				if (err) { return next(err); }

				// Update progress
				if (opts.progress != null) {
					opts.progress.step("contextualizeFiles (postparing)").total(1).setTick(0);
				}

				// After
				return docpad.emitSerial('contextualizeAfter', {collection}, function(err) {
					// Check
					if (err) { return next(err); }

					// Log
					docpad.log('debug', util.format(locale.contextualizedFiles, collection.length));

					// Forward
					return next();
				});
			}
		}
			);

			// Add contextualize tasks
			if (opts.progress != null) {
				opts.progress.step('contextualizeFiles').total(collection.length).setTick(0);
			}
			collection.forEach(function(file,index) {
				const filePath = file.getFilePath();
				slowFilesObject[file.id] = file.get('relativePath') || file.id;
				return tasks.addTask(`conextualizing: ${filePath}`, complete =>
					file.action('contextualize', function(err) {
						delete slowFilesObject[file.id];
						if (opts.progress != null) {
							opts.progress.tick();
						}
						return complete(err);
					})
				);
			});

			// Setup the timer
			slowFilesTimer = setInterval(
				function() {
					const slowFilesArray = ((() => {
						const result = [];
						for (let key of Object.keys(slowFilesObject || {})) {
							const value = slowFilesObject[key];
							result.push(value || key);
						}
						return result;
					})());
					return docpad.log('info', util.format(locale.slowFiles, 'contextualizeFiles')+' \n'+slowFilesArray.join('\n'));
				},
				config.slowFilesDelay
			);

			// Run tasks
			return tasks.run();
		});

		// Chain
		return this;
	}

	/**
	 * Render the DocPad project's files.
	 * The renderCollectionBefore, renderCollectionAfter,
	 * renderBefore, renderAfter events are all emitted here.
	 * @private
	 * @method renderFiles
	 * @param {Object} [opts={}]
	 * @param {Function} next
	 * @param {Error} next.err
	 */
	renderFiles(opts,next) {
		// Prepare
		if (opts == null) { opts = {}; }
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));
		const {collection,templateData,renderPasses} = opts;
		const docpad = this;
		const config = this.getConfig();
		const locale = this.getLocale();
		const slowFilesObject = {};
		let slowFilesTimer = null;

		// Update progress
		if (opts.progress != null) {
			opts.progress.step("renderFiles (preparing)").total(1).setTick(0);
		}

		// Log
		docpad.log('debug', util.format(locale.renderingFiles, collection.length));

		// Render File
		// next(null, outContent, file)
		const renderFile = function(file,next) {
			// Render
			if ((file.get('render') === false) || !file.get('relativePath')) {
				file.attributes.rtime = new Date();
				next(null, file.getOutContent(), file);
			} else {
				file.action('render', {templateData}, next);
			}

			// Return
			return file;
		};

		// Render Collection
		const renderCollection = (collectionToRender,{renderPass},next) =>
			// Plugin Event
			docpad.emitSerial('renderCollectionBefore', {collection:collectionToRender,renderPass}, function(err) {
				// Prepare
				if (err) { return next(err); }

				const subTasks = docpad.createTaskGroup(`renderCollection: ${collectionToRender.options.name}`, { concurrency:0, next(err) {
					// Prepare
					if (err) { return next(err); }

					// Plugin Event
					return docpad.emitSerial('renderCollectionAfter', {collection:collectionToRender,renderPass}, next);
				}
			}
				);

				// Cycle
				if (opts.progress != null) {
					opts.progress.step(`renderFiles (pass ${renderPass})`).total(collectionToRender.length).setTick(0);
				}
				collectionToRender.forEach(function(file) {
					const filePath = file.getFilePath();
					slowFilesObject[file.id] = file.get('relativePath');
					return subTasks.addTask(`rendering: ${filePath}`, complete =>
						renderFile(file, function(err) {
							delete slowFilesObject[file.id] || file.id;
							if (opts.progress != null) {
								opts.progress.tick();
							}
							return complete(err);
						})
					);
				});

				// Return
				subTasks.run();
				return collectionToRender;
			})
		;

		// Plugin Event
		docpad.emitSerial('renderBefore', {collection,templateData}, function(err) {
			// Prepare
			if (err) { return next(err); }

			// Async
			const tasks = docpad.createTaskGroup("renderCollection: renderBefore tasks", { next(err) {
				// Kill the timer
				clearInterval(slowFilesTimer);
				slowFilesTimer = null;

				// Check
				if (err) { return next(err); }

				// Update progress
				if (opts.progress != null) {
					opts.progress.step("renderFiles (postparing)").total(1).setTick(0);
				}

				// After
				return docpad.emitSerial('renderAfter', {collection}, function(err) {
					// Check
					if (err) { return next(err); }

					// Log
					docpad.log('debug', util.format(locale.renderedFiles, collection.length));

					// Forward
					return next();
				});
			}
		}
			);

			// Queue the initial render
			const initialCollection = collection.findAll({'referencesOthers':false});
			let subsequentCollection = null;
			tasks.addTask("rendering the initial collection", complete =>
				renderCollection(initialCollection, {renderPass:1}, function(err) {
					if (err) { return complete(err); }
					subsequentCollection = collection.findAll({'referencesOthers':true});
					return renderCollection(subsequentCollection, {renderPass:2}, complete);
				})
			);

			// Queue the subsequent renders
			if (renderPasses > 1) {
				__range__(3, renderPasses, true).forEach(renderPass =>  tasks.addTask(`rendering the subsequent collection index ${renderPass}`, complete => renderCollection(subsequentCollection, {renderPass}, complete))
				 );
			}

			// Setup the timer
			slowFilesTimer = setInterval(
				function() {
					const slowFilesArray = ((() => {
						const result = [];
						for (let key of Object.keys(slowFilesObject || {})) {
							const value = slowFilesObject[key];
							result.push(value || key);
						}
						return result;
					})());
					return docpad.log('info', util.format(locale.slowFiles, 'renderFiles')+' \n'+slowFilesArray.join('\n'));
				},
				config.slowFilesDelay
			);

			// Run tasks
			return tasks.run();
		});

		// Chain
		return this;
	}

	/**
	 * Write rendered files to the DocPad out directory.
	 * The writeBefore and writeAfter events are emitted here.
	 * @private
	 * @method writeFiles
	 * @param {Object} [opts={}]
	 * @param {Function} next
	 * @param {Error} next.err
	 */
	writeFiles(opts,next) {
		// Prepare
		if (opts == null) { opts = {}; }
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));
		const {collection,templateData} = opts;
		const docpad = this;
		const config = this.getConfig();
		const locale = this.getLocale();
		const slowFilesObject = {};
		let slowFilesTimer = null;

		// Update progress
		if (opts.progress != null) {
			opts.progress.step("writeFiles (preparing)").total(1).setTick(0);
		}

		// Log
		docpad.log('debug', util.format(locale.writingFiles, collection.length));

		// Plugin Event
		docpad.emitSerial('writeBefore', {collection,templateData}, function(err) {
			// Prepare
			if (err) { return next(err); }

			// Completion callback
			const tasks = docpad.createTaskGroup("writeFiles tasks", { concurrency:0, next(err) {
				// Kill the timer
				clearInterval(slowFilesTimer);
				slowFilesTimer = null;

				// Check
				if (err) { return next(err); }

				// Update progress
				if (opts.progress != null) {
					opts.progress.step("writeFiles (postparing)").total(1).setTick(0);
				}

				// After
				return docpad.emitSerial('writeAfter', {collection}, function(err) {
					// Check
					if (err) { return next(err); }

					// docpad.log 'debug', util.format(locale.wroteFiles, collection.length)
					return next();
				});
			}
		}
			);

			// Add write tasks
			if (opts.progress != null) {
				opts.progress.step('writeFiles').total(collection.length).setTick(0);
			}
			collection.forEach(function(file,index) {
				const filePath = file.getFilePath();
				return tasks.addTask(`writing the file: ${filePath}`, function(complete) {
					// Prepare
					slowFilesObject[file.id] = file.get('relativePath');

					// Create sub tasks
					const fileTasks = docpad.createTaskGroup(`tasks for file write: ${filePath}`, { concurrency:0, next(err) {
						delete slowFilesObject[file.id];
						if (opts.progress != null) {
							opts.progress.tick();
						}
						return complete(err);
					}
				}
					);

					// Write out
					if ((file.get('write') !== false) && (file.get('dynamic') !== true) && file.get('outPath')) {
						fileTasks.addTask("write out", complete => file.action('write', complete));
					}

					// Write source
					if ((file.get('writeSource') === true) && file.get('fullPath')) {
						fileTasks.addTask("write source", complete => file.action('writeSource', complete));
					}

					// Run sub tasks
					return fileTasks.run();
				});
			});

			// Setup the timer
			slowFilesTimer = setInterval(
				function() {
					const slowFilesArray = ((() => {
						const result = [];
						for (let key of Object.keys(slowFilesObject || {})) {
							const value = slowFilesObject[key];
							result.push(value || key);
						}
						return result;
					})());
					return docpad.log('info', util.format(locale.slowFiles, 'writeFiles')+' \n'+slowFilesArray.join('\n'));
				},
				config.slowFilesDelay
			);

			// Run tasks
			return tasks.run();
		});

		// Chain
		return this;
	}

	/**
	 * Create the console progress bar.
	 * Progress only shown if the DocPad config 'progress'
	 * option is true, the DocPad config 'prompts' option is true
	 * and the log level is 6 (default)
	 * @private
	 * @method createProgress
	 * @return {Object} the progress object
	 */
	createProgress() {
		// Prepare
		const docpad = this;
		const config = docpad.getConfig();

		// Only show progress if
		// - progress is true
		// - prompts are supported (so no servers)
		// - and we are log level 6 (the default level)
		let progress = null;
		if (config.progress && config.prompts && (this.getLogLevel() === 6)) {
			progress = require('progressbar').create();
			this.getLoggers().console.unpipe(process.stdout);
			this.getLogger().once('log', progress.logListener != null ? progress.logListener : (progress.logListener = function(data) {
				if (data.levelNumber <= 5) {  // notice or higher
					return docpad.destroyProgress(progress);
				}
			})
			);
		}

		// Return
		return progress;
	}

	/**
	 * Destructor. Destroy the progress object
	 * @private
	 * @method destroyProgress
	 * @param {Object} progress
	 * @return {Object} the progress object
	 */
	destroyProgress(progress) {
		// Fetch
		if (progress) {
			progress.finish();
			this.getLoggers().console.unpipe(process.stdout).pipe(process.stdout);
		}

		// Return
		return progress;
	}

	/**
	 * Destructor. Destroy the regeneration timer.
	 * @private
	 * @method destroyRegenerateTimer
	 */
	destroyRegenerateTimer() {
		// Prepare
		const docpad = this;

		// Clear Regenerate Timer
		if (docpad.regenerateTimer) {
			clearTimeout(docpad.regenerateTimer);
			docpad.regenerateTimer = null;
		}

		// Chain
		return this;
	}

	/**
	 * Create the regeneration timer
	 * @private
	 * @method createRegenerateTimer
	 */
	createRegenerateTimer() {
		// Prepare
		const docpad = this;
		const locale = docpad.getLocale();
		const config = docpad.getConfig();

		// Create Regenerate Timer
		if (config.regenerateEvery) {
			docpad.regenerateTimer = setTimeout(
				function() {
					docpad.log('info', locale.renderInterval);
					return docpad.action('generate', config.regenerateEveryOptions);
				},
				config.regenerateEvery
			);
		}

		// Chain
		return this;
	}

	/**
	 * Set off DocPad's generation process.
	 * The generated, populateCollectionsBefore, populateCollections, populateCollections
	 * generateBefore and generateAfter events are emitted here
	 * @method generate
	 * @param {Object} opts
	 * @param {Function} next
	 * @param {Error} next.err
	 */
	generate(opts, next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));
		const docpad = this;
		const config = docpad.getConfig();
		const locale = docpad.getLocale();
		const database = docpad.getDatabase();

		// Check
		if ((opts.collection != null ? opts.collection.length : undefined) === 0) { return next(); }


		// Update generating flag
		let lastGenerateStarted = docpad.generateStarted;
		docpad.generateStarted = new Date();
		docpad.generateEnded = null;
		docpad.generating = true;

		// Update the cached database
		if (database.models.length) { docpad.databaseTempCache = new FilesCollection(database.models); }

		// Create Progress
		// Can be over-written by API calls
		if (opts.progress == null) { opts.progress = docpad.createProgress(); }

		// Grab the template data we will use for rendering
		opts.templateData = docpad.getTemplateData(opts.templateData || {});

		// How many render passes will we require?
		// Can be over-written by API calls
		if (!opts.renderPasses) { opts.renderPasses = config.renderPasses; }


		// Destroy Regenerate Timer
		docpad.destroyRegenerateTimer();

		// Check plugin count
		if (!docpad.hasPlugins()) { docpad.log('notice', locale.renderNoPlugins); }

		// Log
		docpad.log('info', locale.renderGenerating);
		docpad.notify((new Date()).toLocaleTimeString(), {title: locale.renderGeneratingNotification});

		// Tasks
		const tasks = this.createTaskGroup("generate tasks", {progress: opts.progress}).done(function(err) {
			// Update generating flag
			docpad.generating = false;
			docpad.generateEnded = new Date();

			// Update caches
			docpad.databaseTempCache = null;

			// Create Regenerate Timer
			docpad.createRegenerateTimer();

			// Clear Progress
			if (opts.progress) {
				docpad.destroyProgress(opts.progress);
				opts.progress = null;
			}

			// Error?
			if (err) { return next(err); }

			// Log success message
			const seconds = (docpad.generateEnded - docpad.generateStarted) / 1000;
			const howMany = `${(opts.collection != null ? opts.collection.length : undefined) || 0}/${database.length}`;
			docpad.log('info', util.format(locale.renderGenerated, howMany, seconds));
			docpad.notify((new Date()).toLocaleTimeString(), {title: locale.renderGeneratedNotification});

			// Generated
			if (opts.initial === true) {
				docpad.generated = true;
				return docpad.emitSerial('generated', opts, next);

			// Safety check if generated is false but initial was false too
			// https://github.com/bevry/docpad/issues/811
			} else if (docpad.generated === false) {
				return next(
					new Error('DocPad is in an invalid state, please report this on the github issue tracker. Reference 3360')
				);

			} else {
				return next();
			}
		});

		// Extract functions from tasks for simplicity
		// when dealing with nested tasks/groups
		const addGroup = tasks.addGroup.bind(tasks);
		const addTask = tasks.addTask.bind(tasks);


		// Setup a clean database
		addTask('Reset our collections', function(complete) {
			// Skip if we are not a reset generation, or an initial generation (generated is false)
			if ((opts.reset !== true) && (docpad.generated !== false)) { return complete(); }
			return docpad.resetCollections(opts, complete);
		});


		// Figure out the options
		// This is here as resetCollections could change our state
		// https://github.com/bevry/docpad/issues/811
		addTask('Figure out options', function() {
			// Mode: Cache
			// Shall we write to the database cache?
			// Set to true if the configuration option says we can, and we are the initial generation
			if (opts.cache == null) {     opts.cache = config.databaseCache; }

			// Mode: Initial
			// Shall we do some basic initial checks
			// Set to the opts.reset value if specified, or whether are the initial generation
			if (opts.initial == null) {   opts.initial = !(docpad.generated); }

			// Mode: Reset
			// Shall we reset the database
			// Set to true if we are the initial generation
			if (opts.reset == null) {     opts.reset = opts.initial; }

			// Mode: Populate
			// Shall we fetch in new data?
			// Set to the opts.reset value if specified, or the opts.initial value
			if (opts.populate == null) {  opts.populate = opts.reset; }

			// Mode: Reload
			// Shall we rescan the file system for changes?
			// Set to the opts.reset value if specified, or the opts.initial value
			if (opts.reload == null) {    opts.reload = opts.reset; }

			// Mode: Partial
			// Shall we perform a partial generation (false) or a completion generation (true)?
			// Set to false if we are the initial generation
			if (opts.partial == null) {   opts.partial = !(opts.reset); }

			// Log our opts
			return docpad.log(
				'debug',
				'Generate options:',
				pick(opts, ['cache', 'initial', 'reset', 'populate', 'reload', 'partial', 'renderPasses'])
			);
		});


		// Check directory structure
		addTask('check source directory exists', function(complete) {
			// Skip if we are not the initial generation
			if (opts.initial !== true) { return complete(); }

			// Continue if we are the initial generation
			return safefs.exists(config.srcPath, function(exists) {
				// Check
				if (!exists) {
					const err = new Error(locale.renderNonexistant);
					return complete(err);
				}

				// Forward
				return complete();
			});
		});


		addGroup('fetch data to render', function(addGroup, addTask) {
			// Fetch new data
			// If we are a populate generation (by default an initial generation)
			if (opts.populate === true) {
				// This will pull in new data from plugins
				addTask('populateCollectionsBefore', complete => docpad.emitSerial('populateCollectionsBefore', opts, complete));

				// Import the cached data
				// If we are the initial generation, and we have caching enabled
				if ((opts.initial === true) && [true, 'read'].includes(opts.cache)) {
					addTask('import data from cache', complete =>
						// Check if we do have a databae cache
						safefs.exists(config.databaseCachePath, function(exists) {
							if (exists === false) { return complete(); }

							// Read the database cache if it exists
							return safefs.readFile(config.databaseCachePath, function(err, data) {
								if (err) { return complete(err); }

								// Parse it and apply the data values
								const databaseData = JSON.parse(data.toString());
								opts.cache     = true;
								opts.initial   = true;
								opts.reset     = false;
								opts.populate  = true;
								opts.reload    = true;
								opts.partial   = true;

								lastGenerateStarted = new Date(databaseData.generateStarted);
								const addedModels = docpad.addModels(databaseData.models);
								docpad.log('info', util.format(locale.databaseCacheRead, database.length, databaseData.models.length));

								// @TODO we need a way of detecting deleted files between generations

								return complete();
							});
						})
					);
				}

				// Rescan the file system
				// If we are a reload generation (by default an initial generation)
				// This is useful when the database is out of sync with the source files
				// For instance, someone shut down docpad, and made some changes, then ran docpad again
				// See https://github.com/bevry/docpad/issues/705#issuecomment-29243666 for details
				if (opts.reload === true) {
					addGroup('import data from file system', function(addGroup, addTask) {
						// Documents
						config.documentsPaths.forEach(documentsPath =>
							addTask('import documents', complete =>
								docpad.parseDirectory({
									modelType: 'document',
									collection: database,
									path: documentsPath,
									next: complete
								})
							)
						);

						// Files
						config.filesPaths.forEach(filesPath =>
							addTask('import files', complete =>
								docpad.parseDirectory({
									modelType: 'file',
									collection: database,
									path: filesPath,
									next: complete
								})
							)
						);

						// Layouts
						return config.layoutsPaths.forEach(layoutsPath =>
							addTask('import layouts', complete =>
								docpad.parseDirectory({
									modelType: 'document',
									collection: database,
									path: layoutsPath,
									next: complete
								})
							)
						);
					});
				}

				// This will pull in new data from plugins
				return addTask('populateCollections', complete => docpad.emitSerial('populateCollections', opts, complete));
			}
		});


		addGroup('determine files to render', function(addGroup, addTask) {
			// Perform a complete regeneration
			// If we are a reset generation (by default an initial non-cached generation)
			if (opts.partial === false) {
				// Use Entire Collection
				return addTask('Add all database models to render queue', () => opts.collection != null ? opts.collection : (opts.collection = new FilesCollection().add(docpad.getCollection('generate').models)));

			// Perform a partial regeneration
			// If we are not a reset generation (by default any non-initial generation)
			} else {
				// Use Partial Collection
				return addTask('Add only changed models to render queue', function() {
					const changedQuery = {
						$or: {
							// Get changed files
							mtime: { $gte: lastGenerateStarted
						},

							// Get new files
							$and: {
								wtime: null,
								write: true
							}
						}
					};
					return opts.collection != null ? opts.collection : (opts.collection = new FilesCollection().add(docpad.getCollection('generate').findAll(changedQuery).models));
				});
			}
		});


		addTask('generateBefore', function(complete) {
			// If we have nothing to generate
			if (opts.collection.length === 0) {
				// then there is no need to execute further tasks
				tasks.clear();
				return complete();

			// Otherwise continue down the task loop
			} else {
				return docpad.emitSerial('generateBefore', opts, complete);
			}
		});


		addTask('prepare files', function(complete) {
			// Log the files to generate if we are in debug mode
			let model;
			docpad.log('debug', 'Files to generate at', (lastGenerateStarted), '\n', ((() => {
				const result = [];
				
				for (model of Array.from(opts.collection.models)) { 					result.push({
						id: model.id,
						path: model.getFilePath(),
						mtime: model.get('mtime'),
						wtime: model.get('wtime'),
						dynamic: model.get('dynamic'),
						ignored: model.get('ignored'),
						write: model.get('write')
					});
				}
			
				return result;
			})())
			);

			// Add anything that references other documents (e.g. partials, listing, etc)
			// This could eventually be way better
			const standalones = opts.collection.pluck('standalone');
			const allStandalone = standalones.indexOf(false) === -1;
			if (allStandalone === false) {
				opts.collection.add(docpad.getCollection('referencesOthers').models);
			}

			// Deeply/recursively add the layout children
			var addLayoutChildren = collection =>
				collection.forEach(function(file) {
					if (file.get('isLayout') === true) {
						// Find
						const layoutChildrenQuery =
							{layoutRelativePath: file.get('relativePath')};
						const layoutChildrenCollection = docpad.getCollection('hasLayout').findAll(layoutChildrenQuery);

						// Log the files to generate if we are in debug mode
						docpad.log('debug', 'Layout children to generate at', (lastGenerateStarted), '\n', ((() => {
							const result1 = [];
							
							for (model of Array.from(layoutChildrenCollection.models)) { 								result1.push({
									id: model.id,
									path: model.getFilePath(),
									mtime: model.get('mtime'),
									wtime: model.get('wtime'),
									write: model.get('write')
								});
							}
						
							return result1;
						})()), '\n', layoutChildrenQuery);

						// Recurse
						addLayoutChildren(layoutChildrenCollection);

						// Add
						return opts.collection.add(layoutChildrenCollection.models);
					}
				})
			;
			addLayoutChildren(opts.collection);

			// Filter out ignored, and no-render no-write files
			opts.collection.reset(opts.collection.reject(file => (file.get('render') === false) && (file.get('write') === false))
			);

			// Log the files to generate if we are in debug mode
			docpad.log('debug', 'Files to generate at', (lastGenerateStarted), '\n', ((() => {
				const result1 = [];
				
				for (model of Array.from(opts.collection.models)) { 					result1.push({
						id: model.id,
						path: model.getFilePath(),
						mtime: model.get('mtime'),
						wtime: model.get('wtime'),
						dynamic: model.get('dynamic'),
						ignored: model.get('ignored'),
						write: model.get('write')
					});
				}
			
				return result1;
			})())
			);

			// Forward
			return complete();
		});


		addGroup('process file', function(addGroup, addTask) {
			addTask('contextualizeFiles', {args:[opts]}, docpad.contextualizeFiles.bind(docpad));
			addTask('renderFiles', {args:[opts]}, docpad.renderFiles.bind(docpad));
			return addTask('writeFiles', {args:[opts]}, docpad.writeFiles.bind(docpad));
		});


		addTask('generateAfter', complete => docpad.emitSerial('generateAfter', opts, complete));


		// Write the cache file
		addTask('Write the database cache', function(complete) {
			// Skip if we do not care for writing the cache
			if (![true, 'write'].includes(opts.cache)) { return complete(); }

			// Write the cache
			const databaseData = {
				generateStarted: docpad.generateStarted,
				generateEnded: docpad.generateEnded,
				models: (Array.from(database.models).map((model) => model.getAttributes()))
			};
			const databaseDataDump = JSON.stringify(databaseData, null, '  ');
			docpad.log('info', util.format(locale.databaseCacheWrite, databaseData.models.length));
			return safefs.writeFile(config.databaseCachePath, databaseDataDump, complete);
		});


		// Run
		tasks.run();

		// Chain
		return this;
	}


	// ---------------------------------
	// Render

	/**
	 * Load a document
	 * @private
	 * @method loadDocument
	 * @param {Object} document
	 * @param {Object} opts
	 * @param {Function} next
	 * @param {Error} next.err
	 * @param {Object} next.document
	 */
	loadDocument(document,opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));
		console.log("Docpad.loadDoc: -> opts:");
		console.log(opts);
		console.log(`Docpad.loadDoc: -> next:${next}`);

		// Load
		// @TODO: don't load if already loaded
		document.action('load contextualize', opts, next);

		// Chain
		return this;
	}

	/**
	 * Load and render a document
	 * @method loadAndRenderDocument
	 * @param {Object} document
	 * @param {Object} opts
	 * @param {Function} next
	 * @param {Error} next.err
	 * @param {Object} next.document
	 */
	loadAndRenderDocument(document,opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));
		const docpad = this;

		// Load
		docpad.loadDocument(document, opts, function(err) {
			if (err) { return next(err); }

			// Render
			return docpad.renderDocument(document, opts, next);
		});

		// Chain
		return this;
	}

	/**
	 * Render a document
	 * @method renderDocument
	 * @param {Object} document
	 * @param {Object} opts
	 * @param {Object} next
	 * @param {Error} next.err
	 * @param {Object} next.result
	 * @param {Object} next.document
	 */
	renderDocument(document,opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));
		console.log("Docpad.renderDoc: -> opts:");
		console.log(opts);
		console.log(`Docpad.renderDoc: -> next:${next}`);

		// Render
		var clone = document.clone().action('render', opts, function(err) {
			const result = clone.getOutContent();
			return next(err, result, document);
		});

		// Chain
		return this;
	}

	/**
	 * Render a document at a file path
	 * next(err,result)
	 * @method renderPath
	 * @param {String} path
	 * @param {Object} opts
	 * @param {Function} next
	 * @param {Error} next.err
	 * @param {Object} next.result the rendered document
	 */
	renderPath(path,opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));
		const attributes = extendr.extend({
			fullPath: path
		}, opts.attributes || {});

		// Handle
		const document = this.createDocument(attributes);
		this.loadAndRenderDocument(document, opts, next);

		// Chain
		return this;
	}

	/**
	 * Render the passed content data as a
	 * document. Required option, filename
	 * (opts.filename)
	 * next(err,result)
	 * @method renderData
	 * @param {String} content
	 * @param {Object} opts
	 * @param {Function} next
	 * @param {Error} next.err
	 * @param {Object} next.result the rendered document
	 */
	renderData(content,opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));
		const attributes = extendr.extend({
			filename: opts.filename,
			data: content
		}, opts.attributes || {});

		// Handle
		const document = this.createDocument(attributes);
		this.loadAndRenderDocument(document, opts, next);

		// Chain
		return this;
	}

	// Render Text
	// Doesn't extract meta information, or render layouts
	// TODO: Why not? Why not just have renderData?

	/**
	 * Render the passed text data as a
	 * document. Required option, filename
	 * (opts.filename)
	 * next(err,result)
	 * @private
	 * @method renderText
	 * @param {String} text
	 * @param {Object} opts
	 * @param {Function} next
	 * @param {Error} next.err
	 * @param {Object} next.result the rendered content
	 * @param {Object} next.document the rendered document model
	 */
	renderText(text,opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));
		if (opts.actions == null) { opts.actions = ['renderExtensions', 'renderDocument']; }
		const attributes = extendr.extend({
			filename: opts.filename,
			data: text,
			body: text,
			content: text
		}, opts.attributes || {});

		// Handle
		const document = this.createDocument(attributes);

		// Render
		var clone = document.clone().action('normalize contextualize render', opts, function(err) {
			const result = clone.getOutContent();
			return next(err, result, document);
		});

		// Chain
		return this;
	}

	/**
	 * Render action
	 * next(err,document,result)
	 * @method render
	 * @param {Object} opts
	 * @param {Function} next
	 * @param {Error} next.err
	 */
	render(opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));
		const locale = this.getLocale();

		console.log("Docpad.render: -> opts:");
		console.log(opts);
		console.log(`Docpad.render: -> next:${next}`);

		// Extract document
		if (opts.document) {
			this.renderDocument(opts.document, opts, next);
		} else if (opts.data) {
			this.renderData(opts.data, opts, next);
		} else if (opts.text) {
			this.renderText(opts.text, opts, next);
		} else {
			const path = opts.path || opts.fullPath || opts.filename || null;
			if (path) {
				this.renderPath(path, opts, next);
			} else {
				// Check
				const err = new Error(locale.renderInvalidOptions);
				return next(err);
			}
		}

		// Chain
		return this;
	}

	/**
	 * Destructor. Destroy the watchers used
	 * by DocPad
	 * @private
	 * @method destroyWatchers
	 */
	destroyWatchers() {
		// Prepare
		const docpad = this;

		// Check
		if (docpad.watchers) {
			// Close each of them
			for (let watcher of Array.from(docpad.watchers)) {
				watcher.close();
			}

			// Reset the array
			docpad.watchers = [];
		}

		// Chain
		return this;
	}

	/**
	 * Start up file watchers used by DocPad
	 * @private
	 * @method watch
	 * @param {Object} opts
	 * @param {Function} next
	 * @param {Error} next.err
	 */
	watch(opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));
		const docpad = this;
		const config = this.getConfig();
		const locale = this.getLocale();
		const database = this.getDatabase();
		if (this.watchers == null) { this.watchers = []; }

		// Restart our watchers
		const restartWatchers = function(next) {
			// Close our watchers
			docpad.destroyWatchers();

			// Start a group
			const tasks = docpad.createTaskGroup("watch tasks", {concurrency:0, next});

			// Watch reload paths
			const reloadPaths = union(config.reloadPaths, config.configPaths);
			tasks.addTask("watch reload paths", complete =>
				docpad.watchdirs(
					reloadPaths,
					{
						'log': docpad.log,
						'error': docpad.error,
						'change'() {
							docpad.log('info', util.format(locale.watchReloadChange, new Date().toLocaleTimeString()));
							return docpad.action('load', function(err) {
								if (err) { return docpad.fatal(err); }
								return performGenerate({reset:true});
							});
						}
					},
					function(err,_watchers) {
						if (err) {
							docpad.warn(`Watching the reload paths has failed:\n${docpad.inspector(reloadPaths)}`, err);
							return complete();
						}
						for (let watcher of Array.from(_watchers)) {
							docpad.watchers.push(watcher);
						}
						return complete();
				})
			);

			// Watch regenerate paths
			const { regeneratePaths } = config;
			tasks.addTask("watch regenerate paths", complete =>
				docpad.watchdirs(
					regeneratePaths,
					{
						'log': docpad.log,
						'error': docpad.error,
						'change'() { return performGenerate({reset:true}); }
					},
					function(err,_watchers) {
						if (err) {
							docpad.warn(`Watching the regenerate paths has failed:\n${docpad.inspector(regeneratePaths)}`, err);
							return complete();
						}
						for (let watcher of Array.from(_watchers)) {
							docpad.watchers.push(watcher);
						}
						return complete();
				})
			);

			// Watch the source
			const { srcPath } = config;
			tasks.addTask("watch the source path", complete =>
				docpad.watchdirs(
					[srcPath],
					{
						'log': docpad.log,
						'error': docpad.error,
						'change': changeHandler
					},
					function(err,_watchers) {
						if (err) {
							docpad.warn(`Watching the src path has failed: ${srcPath}`, err);
							return complete();
						}
						for (let watcher of Array.from(_watchers)) {
							docpad.watchers.push(watcher);
						}
						return complete();
				})
			);

			// Run
			tasks.run();

			// Chain
			return this;
		};

		// Timer
		let regenerateTimer = null;
		const queueRegeneration = function() {
			// Reset the wait
			if (regenerateTimer) {
				clearTimeout(regenerateTimer);
				regenerateTimer = null;
			}

			// Regenerat after a while
			return regenerateTimer = setTimeout(performGenerate, config.regenerateDelay);
		};

		var performGenerate = function(opts) {
			// Q: Should we also pass over the collection?
			// A: No, doing the mtime query in generate is more robust

			// Log
			if (opts == null) { opts = {}; }
			docpad.log(util.format(locale.watchRegenerating, new Date().toLocaleTimeString()));

			// Afterwards, re-render anything that should always re-render
			return docpad.action('generate', opts, function(err) {
				if (err) { docpad.error(err); }
				return docpad.log(util.format(locale.watchRegenerated, new Date().toLocaleTimeString()));
			});
		};

		// Change event handler
		var changeHandler = function(changeType,filePath,fileCurrentStat,filePreviousStat) {
			// Prepare
			const fileEitherStat = (fileCurrentStat || filePreviousStat);

			// For some reason neither of the stats may exist, this will cause errors as this is an invalid state
			// as we depend on at least one stat existing, otherwise, what on earth is going on?
			// Whatever the case, this should be fixed within watchr, not docpad
			// as watchr should not be giving us invalid data
			// https://github.com/bevry/docpad/issues/792
			if (!fileEitherStat) {
				const err = new Error(`\
DocPad has encountered an invalid state while detecting changes for your files.
So the DocPad team can fix this right away, please provide any information you can to:
https://github.com/bevry/docpad/issues/792\
`);
				return docpad.error(err);
			}

			// Log the change
			docpad.log('info', util.format(locale.watchChange, new Date().toLocaleTimeString()), changeType, filePath);

			// Check if we are a file we don't care about
			// This check should not be needed with v2.3.3 of watchr
			// however we've still got it here as it may still be an issue
			const isIgnored = docpad.isIgnoredPath(filePath);
			if (isIgnored) {
				docpad.log('debug', util.format(locale.watchIgnoredChange, new Date().toLocaleTimeString()), filePath);
				return;
			}

			// Don't care if we are a directory
			const isDirectory = fileEitherStat.isDirectory();
			if (isDirectory) {
				docpad.log('debug', util.format(locale.watchDirectoryChange, new Date().toLocaleTimeString()), filePath);
				return;
			}

			// Override the stat's mtime to now
			// This is because renames will not update the mtime
			if (fileCurrentStat != null) {
				fileCurrentStat.mtime = new Date();
			}

			// Create the file object
			const file = docpad.addModel({fullPath:filePath, stat:fileCurrentStat});
			if (changeType === 'update') { file.setStat(fileCurrentStat); }

			// File was deleted, delete the rendered file, and remove it from the database
			if (changeType === 'delete') {
				database.remove(file);
				return file.action('delete', function(err) {
					if (err) { return docpad.error(err); }
					return queueRegeneration();
				});

			// File is new or was changed, update it's mtime by setting the stat
			} else if (['create', 'update'].includes(changeType)) {
				return file.action('load', function(err) {
					if (err) { return docpad.error(err); }
					return queueRegeneration();
				});
			}
		};

		// Watch
		docpad.log(locale.watchStart);
		restartWatchers(function(err) {
			if (err) { return next(err); }
			docpad.log(locale.watchStarted);
			return next();
		});

		// Chain
		return this;
	}


	// ---------------------------------
	// Run Action

	/**
	 * Run an action
	 * @method run
	 * @param {Object} opts
	 * @param {Function} next
	 * @param {Error} next.err
	 */
	run(opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts, next));
		const docpad = this;
		const locale = this.getLocale();
		const config = this.getConfig();
		const {srcPath, rootPath} = config;

		// Prepare
		const run = complete =>
			balUtil.flow({
				object: docpad,
				action: 'server generate watch',
				args: [opts],
				next: complete
			})
		;

		// Check if we have the docpad structure
		safefs.exists(srcPath, function(exists) {
			// Check if have the correct structure, if so let's proceed with DocPad
			if (exists) { return run(next); }

			// We don't have the correct structure
			// Check if we are running on an empty directory
			return safefs.readdir(rootPath, function(err,files) {
				if (err) { return next(err); }

				// Check if our directory is empty
				if (files.length) {
					// It isn't empty, display a warning
					docpad.warn(util.format(locale.skeletonNonexistant, rootPath));
					return next();
				} else {
					return docpad.skeleton(opts, function(err) {
						// Check
						if (err) { return next(err); }

						// Keep in global?
						if ((opts.global === true) || (docpad.getConfig().global === true)) { return run(next); }

						// Log
						docpad.log('notice', locale.startLocal);

						// Destroy our DocPad instance so we can boot the local one
						return docpad.destroy(function(err) {
							// Check
							if (err) { return next(err); }

							// Forward onto the local DocPad Instance now that it has been installed
							return docpadUtil.startLocalDocPadExecutable(next);
						});
					});
				}
			});
		});

		// Chain
		return this;
	}


	// ---------------------------------
	// Skeleton

	/**
	 * Initialize the skeleton install process.
	 * @private
	 * @method initInstall
	 * @param {Object} opts
	 * @param {Function} next
	 * @param {Error} next.err
	 */
	initInstall(opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));
		const docpad = this;
		const config = this.getConfig();

		// Tasks
		const tasks = this.createTaskGroup("initInstall tasks", {concurrency:0, next});

		tasks.addTask("node modules", function(complete) {
			const path = pathUtil.join(config.rootPath, 'node_modules');
			return safefs.ensurePath(path, complete);
		});

		tasks.addTask("package", function(complete) {
			// Exists?
			const path = pathUtil.join(config.rootPath, 'package.json');
			return safefs.exists(path, function(exists) {
				// Check
				if (exists) { return complete(); }

				// Write
				const data = JSON.stringify({
					name: 'no-skeleton.docpad',
					version: '0.1.0',
					description: 'New DocPad project without using a skeleton',
					dependencies: {
						docpad: `~${docpad.getVersion()}`
					},
					main: 'node_modules/.bin/docpad-server',
					scripts: {
						start: 'node_modules/.bin/docpad-server'
					}
				}, null, '  ');
				return safefs.writeFile(path, data, complete);
			});
		});

		// Run
		tasks.run();

		// Chain
		return this;
	}

	/**
	 * Uninstall a plugin.
	 * @private
	 * @method uninstall
	 * @param {Object} opts
	 * @param {Function} next
	 * @param {Error} next.err
	 */
	uninstall(opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));
		const docpad = this;
		const config = this.getConfig();

		// Tasks
		const tasks = this.createTaskGroup("uninstall tasks", {next});

		// Uninstall a plugin
		if (opts.plugin) {
			tasks.addTask(`uninstall the plugin: ${opts.plugin}`, function(complete) {
				const plugins =
					(() => {
					const result = [];
					for (let plugin of Array.from(opts.plugin.split(/[,\s]+/))) {
						if (plugin.indexOf('docpad-plugin-') !== 0) { plugin = `docpad-plugin-${plugin}`; }
						result.push(plugin);
					}
					return result;
				})();
				return docpad.uninstallNodeModule(plugins, {
					stdio: 'inherit',
					next: complete
				});
			});
		}

		// Re-load configuration
		tasks.addTask("re-load configuration", complete => docpad.load(complete));

		// Run
		tasks.run();

		// Chain
		return this;
	}

	/**
	 * Install a plugin
	 * @private
	 * @method install
	 * @param {Object} opts
	 * @param {Function} next
	 * @param {Error} next.err
	 */
	install(opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));
		const docpad = this;
		const config = this.getConfig();

		// Tasks
		const tasks = this.createTaskGroup("install tasks", {next});

		tasks.addTask("init the installation", complete => docpad.initInstall(opts, complete));

		// Install a plugin
		if (opts.plugin) {
			tasks.addTask(`install the plugin: ${opts.plugin}`, function(complete) {
				const plugins =
					(() => {
					const result = [];
					for (let plugin of Array.from(opts.plugin.split(/[,\s]+/))) {
						if (plugin.indexOf('docpad-plugin-') !== 0) { plugin = `docpad-plugin-${plugin}`; }
						if (plugin.indexOf('@') === -1) { plugin += `@${docpad.pluginVersion}`; }
						result.push(plugin);
					}
					return result;
				})();
				return docpad.installNodeModule(plugins, {
					stdio: 'inherit',
					next: complete
				});
			});
		}

		tasks.addTask("re-initialize the website's modules", complete =>
			docpad.initNodeModules({
				stdio: 'inherit',
				next: complete
			})
		);

		tasks.addTask("fix node package versions", complete => docpad.fixNodePackageVersions(complete));

		tasks.addTask("re-load the configuration", complete => docpad.load(complete));

		// Run
		tasks.run();

		// Chain
		return this;
	}

	/**
	 * Update global NPM and DocPad
	 * @private
	 * @method upgrade
	 * @param {Object} opts
	 * @param {Object} next
	 * @param {Error} next.err
	 * @return {Object} description
	 */
	upgrade(opts,next) {
		// Update Global NPM and DocPad
		this.installNodeModule('npm docpad@6', {
			global: true,
			stdio: 'inherit',
			next
		});

		// Chain
		return this;
	}

	/**
	 * Update the local DocPad and plugin dependencies
	 * @private
	 * @method update
	 * @param {Object} opts
	 * @param {Object} next
	 * @param {Error} next.err
	 */
	update(opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));
		const docpad = this;
		const config = this.getConfig();

		// Tasks
		const tasks = this.createTaskGroup("update tasks", {next});

		tasks.addTask("init the install", complete => docpad.initInstall(opts, complete));

		// Update the local docpad and plugin dependencies
		// Grouped together to avoid npm dependency shortcuts that can cause missing dependencies
		// But don't update git/http/https dependencies, those are special for some reason
		// > https://github.com/bevry/docpad/pull/701
		const dependencies = [];
		eachr(docpad.websitePackageConfig.dependencies, function(version,name) {
			if ((/^docpad-plugin-/.test(name) === false) || (new RegExp(`://`).test(version) === true)) { return; }
			return dependencies.push(name+'@'+docpad.pluginVersion);
		});
		if (dependencies.length !== 0) {
			tasks.addTask("update plugins that are dependencies", complete =>
				docpad.installNodeModule(`docpad@6 ${dependencies}`, {
					stdio: 'inherit',
					next: complete
				})
			);
		}

		// Update the plugin dev dependencies
		const devDependencies = [];
		eachr(docpad.websitePackageConfig.devDependencies, function(version,name) {
			if (/^docpad-plugin-/.test(name) === false) { return; }
			return devDependencies.push(name+'@'+docpad.pluginVersion);
		});
		if (devDependencies.length !== 0) {
			tasks.addTask("update plugins that are dev dependencies", complete =>
				docpad.installNodeModule(devDependencies, {
					save: '--save-dev',
					stdio: 'inherit',
					next: complete
				})
			);
		}

		tasks.addTask("fix node package versions", complete => docpad.fixNodePackageVersions(complete));

		tasks.addTask("re-initialize the rest of the website's modules", complete =>
			docpad.initNodeModules({
				stdio: 'inherit',
				next: complete
			})
		);

		// Run
		tasks.run();

		// Chain
		return this;
	}

	/**
	 * DocPad cleanup tasks.
	 * @private
	 * @method clean
	 * @param {Object} opts
	 * @param {Object} next
	 * @param {Error} next.err
	 * @return {Object} description
	 */
	clean(opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));
		const docpad = this;
		const config = docpad.getConfig();
		const locale = this.getLocale();

		// Log
		docpad.log('info', locale.renderCleaning);

		// Tasks
		const tasks = this.createTaskGroup("clean tasks", {concurrency:0}, { next(err) {
			// Error?
			if (err) { return next(err); }

			// Log
			docpad.log('info', locale.renderCleaned);

			// Forward
			return next();
		}
	}
		);

		tasks.addTask('reset the collecitons', complete => docpad.resetCollections(opts, complete));

		// Delete out path
		// but only if our outPath is not a parent of our rootPath
		tasks.addTask('delete out path', function(complete) {
			// Check if our outPath is higher than our root path, so do not remove files
			if (config.rootPath.indexOf(config.outPath) !== -1) { return complete(); }

			// Our outPath is not related or lower than our root path, so do remove it
			return rimraf(config.outPath, complete);
		});

		// Delete database cache
		tasks.addTask('delete database cache file', complete => safefs.unlink(config.databaseCachePath, complete));

		// Run tasks
		tasks.run();

		// Chain
		return this;
	}



	/**
	 * Initialize a Skeleton into to a Directory
	 * @private
	 * @method initSkeleton
	 * @param {Object} skeletonModel
	 * @param {Object} opts
	 * @param {Function} next
	 * @param {Error} next.err
	 */
	initSkeleton(skeletonModel,opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));
		const docpad = this;
		const config = this.getConfig();

		// Defaults
		if (opts.destinationPath == null) { opts.destinationPath = config.rootPath; }

		// Tasks
		const tasks = this.createTaskGroup("initSkeleton tasks", {next});

		tasks.addTask("ensure the path we are writing to exists", complete => safefs.ensurePath(opts.destinationPath, complete));

		// Clone out the repository if applicable
		if ((skeletonModel != null) && (skeletonModel.id !== 'none')) {
			tasks.addTask("clone out the git repo", complete =>
				docpad.initGitRepo({
					cwd: opts.destinationPath,
					url: skeletonModel.get('repo'),
					branch: skeletonModel.get('branch'),
					remote: 'skeleton',
					stdio: 'inherit',
					next: complete
				})
			);
		} else {
			tasks.addTask("ensure src path exists", complete => safefs.ensurePath(config.srcPath, complete));

			tasks.addGroup("initialize the website directory files", function() {
				this.setConfig({concurrency:0});

				// README
				this.addTask("README.md", function(complete) {
					// Exists?
					const path = pathUtil.join(config.rootPath, 'README.md');
					return safefs.exists(path, function(exists) {
						// Check
						if (exists) { return complete(); }

						// Write
						const data = `\
# Your [DocPad](http://docpad.org) Project

## License
Copyright &copy; ${(new Date()).getFullYear()}+ All rights reserved.\
`;
						return safefs.writeFile(path, data, complete);
					});
				});

				// Config
				this.addTask("docpad.coffee configuration file", complete =>
					// Exists?
					docpad.getConfigPath(function(err,path) {
						// Check
						if (err || path) { return complete(err); }
						path = pathUtil.join(config.rootPath, 'docpad.coffee');

						// Write
						const data = `\
# DocPad Configuration File
# http://docpad.org/docs/config

# Define the DocPad Configuration
docpadConfig = {
	# ...
}

# Export the DocPad Configuration
module.exports = docpadConfig\
`;
						return safefs.writeFile(path, data, complete);
					})
				);

				// Documents
				this.addTask("documents directory", complete => safefs.ensurePath(config.documentsPaths[0], complete));

				// Layouts
				this.addTask("layouts directory", complete => safefs.ensurePath(config.layoutsPaths[0], complete));

				// Files
				return this.addTask("files directory", complete => safefs.ensurePath(config.filesPaths[0], complete));
			});
		}

		// Run
		tasks.run();

		// Chain
		return this;
	}

	/**
	 * Install a Skeleton into a Directory
	 * @private
	 * @method installSkeleton
	 * @param {Object} skeletonModel
	 * @param {Object} opts
	 * @param {Function} next
	 * @param {Error} next.err
	 */
	installSkeleton(skeletonModel,opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));
		const docpad = this;

		// Defaults
		if (opts.destinationPath == null) { opts.destinationPath = this.getConfig().rootPath; }

		// Initialize and install the skeleton
		docpad.initSkeleton(skeletonModel, opts, function(err) {
			// Check
			if (err) { return next(err); }

			// Forward
			return docpad.install(opts, next);
		});

		// Chain
		return this;
	}

	/**
	 * Use a Skeleton
	 * @private
	 * @method useSkeleton
	 * @param {Object} skeletonModel
	 * @param {Object} opts
	 * @param {Object} next
	 * @param {Error} next.err
	 * @return {Object} description
	 */
	useSkeleton(skeletonModel,opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));
		const docpad = this;
		const locale = this.getLocale();

		// Defaults
		if (opts.destinationPath == null) { opts.destinationPath = this.getConfig().rootPath; }

		// Extract
		const skeletonId = (skeletonModel != null ? skeletonModel.id : undefined) || 'none';
		const skeletonName = (skeletonModel != null ? skeletonModel.get('name') : undefined) || locale.skeletonNoneName;

		// Track
		docpad.track('skeleton-use', {skeletonId});

		// Log
		docpad.log('info', util.format(locale.skeletonInstall, skeletonName, opts.destinationPath)+' '+locale.pleaseWait);

		// Install Skeleton
		docpad.installSkeleton(skeletonModel, opts, function(err) {
			// Error?
			if (err) { return next(err); }

			// Log
			docpad.log('info', locale.skeletonInstalled);

			// Forward
			return next(err);
		});

		// Chain
		return this;
	}


	/**
	 * Select a Skeleton
	 * @private
	 * @method selectSkeleton
	 * @param {Object} opts
	 * @param {Function} next
	 * @param {Error} next.err
	 * @param {Error} next.skeletonModel
	 */
	selectSkeleton(opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));
		const docpad = this;
		if (opts.selectSkeletonCallback == null) { opts.selectSkeletonCallback = null; }

		// Track
		docpad.track('skeleton-ask');

		// Get the available skeletons
		docpad.getSkeletons(function(err,skeletonsCollection) {
			// Check
			if (err) { return next(err); }

			// Provide selection to the interface
			return opts.selectSkeletonCallback(skeletonsCollection, next);
		});

		// Chain
		return this;
	}

	/**
	 * Skeleton Empty?
	 * @private
	 * @method skeletonEmpty
	 * @param {Object} path
	 * @param {Function} next
	 * @param {Error} next.err
	 */
	skeletonEmpty(path, next) {
		// Prepare
		const locale = this.getLocale();

		// Defaults
		if (path == null) { path = this.getConfig().rootPath; }

		// Check the destination path is empty
		safefs.exists(pathUtil.join(path, 'package.json'), function(exists) {
			// Check
			if (exists) {
				const err = new Error(locale.skeletonExists);
				return next(err);
			}

			// Success
			return next();
		});

		// Chain
		return this;
	}

	/**
	 * Initialize the project directory
	 * with the basic skeleton.
	 * @private
	 * @method skeleton
	 * @param {Object} opts
	 * @param {Function} next
	 * @param {Error} next.err
	 */
	skeleton(opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));
		const docpad = this;
		if (opts.selectSkeletonCallback == null) { opts.selectSkeletonCallback = null; }

		// Init the directory with the basic skeleton
		this.skeletonEmpty(null, function(err) {
			// Check
			if (err) { return next(err); }

			// Select Skeleton
			return docpad.selectSkeleton(opts, function(err,skeletonModel) {
				// Check
				if (err) { return next(err); }

				// Use Skeleton
				return docpad.useSkeleton(skeletonModel, next);
			});
		});

		// Chain
		return this;
	}

	/**
	 * Initialize the project directory
	 * with the basic skeleton.
	 * @private
	 * @method init
	 * @param {Object} opts
	 * @param {Object} next
	 * @param {Error} next.err
	 * @return {Object} description
	 */
	init(opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));
		const docpad = this;

		// Init the directory with the basic skeleton
		this.skeletonEmpty(null, function(err) {
			// Check
			if (err) { return next(err); }

			// Basic Skeleton
			return docpad.useSkeleton(null, next);
		});

		// Chain
		return this;
	}


	// ---------------------------------
	// Server

	/**
	 * Serve a document
	 * @private
	 * @method serveDocument
	 * @param {Object} opts
	 * @param {Function} next
	 * @param {Error} next.err
	 */
	serveDocument(opts,next) {
		// Prepare
		let charset;
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));
		const {document,err,req,res} = opts;
		const docpad = this;
		const config = this.getConfig();

		// If no document, then exit early
		if (!document) {
			if (opts.statusCode != null) {
				return res.send(opts.statusCode);
			} else {
				return next();
			}
		}

		// Prepare
		if (res.setHeaderIfMissing == null) { res.setHeaderIfMissing = function(name, value) {
			if (!res.getHeader(name)) { return res.setHeader(name, value); }
		}; }

		// Content Type + Encoding/Charset
		const encoding = document.get('encoding');
		if (['utf8', 'utf-8'].includes(encoding)) { charset = 'utf-8'; }
		const contentType = document.get('outContentType') || document.get('contentType');
		res.setHeaderIfMissing('Content-Type', contentType + (charset ? `; charset=${charset}` : ''));

		// Cache-Control (max-age)
		if (config.maxAge) { res.setHeaderIfMissing('Cache-Control', `public, max-age=${config.maxAge}`); }

		// Send
		const dynamic = document.get('dynamic');
		if (dynamic) {
			// If you are debugging why a dynamic document isn't rendering
			// it could be that you don't have cleanurls installed
			// e.g. if index.html is dynamic, and you are accessing it via /
			// then this code will not be reached, as we don't register that url
			// where if we have the cleanurls plugin installed, then do register that url
			// against the document, so this is reached
			const collection = new FilesCollection([document], {name:'dynamic collection'});
			const templateData = extendr.extend({}, req.templateData || {}, {req,err});
			docpad.action('generate', {collection, templateData}, function(err) {
				const content = document.getOutContent();
				if (err) {
					docpad.error(err);
					return next(err);
				} else {
					if (opts.statusCode != null) {
						return res.send(opts.statusCode, content);
					} else {
						return res.send(content);
					}
				}
			});

		} else {
			// ETag: `"<size>-<mtime>"`
			let etag;
			const ctime = document.get('date');    // use the date or mtime, it should always exist
			const mtime = document.get('wtime');   // use the last generate time, it may not exist though
			const stat = document.getStat();
			if (mtime && stat) { etag = stat.size + '-' + Number(mtime); }
			if (etag) { res.setHeaderIfMissing('ETag', `"${etag}"`); }

			// Date
			if ((ctime != null ? ctime.toUTCString : undefined) != null) { res.setHeaderIfMissing('Date', ctime.toUTCString()); }
			if ((mtime != null ? mtime.toUTCString : undefined) != null) { res.setHeaderIfMissing('Last-Modified', mtime.toUTCString()); }
			// @TODO:
			// The above .toUTCString? check is a workaround because sometimes the date object
			// isn't really a date object, this needs to be fixed properly
			// https://github.com/bevry/docpad/pull/781

			// Send
			if (etag && (etag === (req.get('If-None-Match') || '').replace(/^"|"$/g, ''))) {
				res.send(304);  // not modified
			} else {
				const content = document.getOutContent();
				if (content) {
					if (opts.statusCode != null) {
						res.send(opts.statusCode, content);
					} else {
						res.send(content);
					}
				} else {
					if (opts.statusCode != null) {
						res.send(opts.statusCode);
					} else {
						next();
					}
				}
			}
		}

		// Chain
		return this;
	}


	/**
	 * Server Middleware: Header
	 * @private
	 * @method serverMiddlewareHeader
	 * @param {Object} req
	 * @param {Object} res
	 * @param {Object} next
	 */
	serverMiddlewareHeader(req,res,next) {
		// Prepare
		const docpad = this;

		// Handle
		// Always enable this until we get a complaint about not having it
		// For instance, Express.js also forces this
		let tools = res.get('X-Powered-By').split(/[,\s]+/g);
		tools.push(`DocPad v${docpad.getVersion()}`);
		tools = tools.join(', ');
		res.set('X-Powered-By', tools);

		// Forward
		next();

		// Chain
		return this;
	}


	/**
	 * Server Middleware: Router
	 * @private
	 * @method serverMiddlewareRouter
	 * @param {Object} req
	 * @param {Object} res
	 * @param {Function} next
	 * @param {Error} next.err
	 */
	serverMiddlewareRouter(req,res,next) {
		// Prepare
		const docpad = this;

		// Get the file
		docpad.getFileByRoute(req.url, function(err,file) {
			// Check
			if (err || ((file != null) === false)) { return next(err); }

			// Check if we are the desired url
			// if we aren't do a permanent redirect
			const url = file.get('url');
			const cleanUrl = docpad.getUrlPathname(req.url);
			if ((url !== cleanUrl) && (url !== req.url)) {
				return res.redirect(301, url);
			}

			// Serve the file to the user
			return docpad.serveDocument({document:file, req, res, next});
		});

		// Chain
		return this;
	}


	/**
	 * Server Middleware: 404
	 * @private
	 * @method serverMiddleware404
	 * @param {Object} req
	 * @param {Object} res
	 * @param {Object} next
	 */
	serverMiddleware404(req,res,next) {
		// Prepare
		const docpad = this;
		const database = docpad.getDatabaseSafe();

		// Notify the user of a 404
		docpad.log('notice', "404 Not Found:", req.url);

		// Check
		if (!database) { return res.send(500); }

		// Serve the document to the user
		const document = database.findOne({relativeOutPath: '404.html'});
		docpad.serveDocument({document, req, res, next, statusCode:404});

		// Chain
		return this;
	}


	/**
	 * Server Middleware: 500
	 * @private
	 * @method serverMiddleware500
	 * @param {Object} err
	 * @param {Object} req
	 * @param {Object} res
	 * @param {Function} next
	 */
	serverMiddleware500(err,req,res,next) {
		// Prepare
		const docpad = this;
		const database = docpad.getDatabaseSafe();

		// Check
		if (!database) { return res.send(500); }

		// Serve the document to the user
		const document = database.findOne({relativeOutPath: '500.html'});
		docpad.serveDocument({document,err,req,res,next,statusCode:500});

		// Chain
		return this;
	}

	/**
	 * Configure and start up the DocPad web server.
	 * Http and express server is created, extended with
	 * middleware, started up and begins listening.
	 * The events serverBefore, serverExtend and
	 * serverAfter emitted here.
	 * @private
	 * @method server
	 * @param {Object} opts
	 * @param {Function} next
	 */
	server(opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));
		const docpad = this;
		const { config } = this;
		const locale = this.getLocale();
		const port = this.getPort();
		const hostname = this.getHostname();

		// Require
		const http = require('http');
		const express = require('express');

		// Config
		const servers = this.getServer(true);
		if (opts.serverExpress == null) { opts.serverExpress = servers.serverExpress; }
		if (opts.serverHttp == null) { opts.serverHttp = servers.serverHttp; }
		if (opts.middlewareBodyParser == null) { opts.middlewareBodyParser = config.middlewareBodyParser != null ? config.middlewareBodyParser : config.middlewareStandard; }
		if (opts.middlewareMethodOverride == null) { opts.middlewareMethodOverride = config.middlewareMethodOverride != null ? config.middlewareMethodOverride : config.middlewareStandard; }
		if (opts.middlewareExpressRouter == null) { opts.middlewareExpressRouter = config.middlewareExpressRouter != null ? config.middlewareExpressRouter : config.middlewareStandard; }
		if (opts.middleware404 == null) { opts.middleware404 = config.middleware404; }
		if (opts.middleware500 == null) { opts.middleware500 = config.middleware500; }
		// @TODO: Why do we do opts here instead of config???

		// Tasks
		const tasks = this.createTaskGroup("server tasks", {next});

		// Before Plugin Event
		tasks.addTask("emit serverBefore", complete => docpad.emitSerial('serverBefore', complete));

		// Create server when none is defined
		if (!opts.serverExpress || !opts.serverHttp) {
			tasks.addTask("create server", function() {
				if (!opts.serverExpress) { opts.serverExpress = express(); }
				if (!opts.serverHttp) { opts.serverHttp = http.createServer(opts.serverExpress); }
				return docpad.setServer(opts);
			});
		}

		// Extend the server with our middlewares
		if (config.extendServer === true) {
			tasks.addTask("extend the server", function(complete) {
				// Parse url-encoded and json encoded form data
				if (opts.middlewareBodyParser !== false) {
					opts.serverExpress.use(express.urlencoded());
					opts.serverExpress.use(express.json());
				}

				// Allow over-riding of the request type (e.g. GET, POST, PUT, DELETE)
				if (opts.middlewareMethodOverride !== false) {
					if (typeChecker.isString(opts.middlewareMethodOverride)) {
						opts.serverExpress.use(require('method-override')(opts.middlewareMethodOverride));
					} else {
						opts.serverExpress.use(require('method-override')());
					}
				}

				// Emit the serverExtend event
				// So plugins can define their routes earlier than the DocPad routes
				return docpad.emitSerial('serverExtend', {
					server: opts.serverExpress, // b/c
					express: opts.serverExpress, // b/c
					serverHttp: opts.serverHttp,
					serverExpress: opts.serverExpress
				}, function(err) {
					if (err) { return next(err); }

					// DocPad Header Middleware
					// Keep it after the serverExtend event
					opts.serverExpress.use(docpad.serverMiddlewareHeader);

					// Router Middleware
					// Keep it after the serverExtend event
					if (opts.middlewareExpressRouter !== false) { opts.serverExpress.use(opts.serverExpress.router); }

					// DocPad Router Middleware
					// Keep it after the serverExtend event
					opts.serverExpress.use(docpad.serverMiddlewareRouter);

					// Static
					// Keep it after the serverExtend event
					if (config.maxAge) {
						opts.serverExpress.use(express.static(config.outPath, {maxAge:config.maxAge}));
					} else {
						opts.serverExpress.use(express.static(config.outPath));
					}

					// DocPad 404 Middleware
					// Keep it after the serverExtend event
					if (opts.middleware404 !== false) { opts.serverExpress.use(docpad.serverMiddleware404); }

					// DocPad 500 Middleware
					// Keep it after the serverExtend event
					if (opts.middleware500 !== false) { opts.serverExpress.use(docpad.serverMiddleware500); }

					// Done
					return complete();
				});
			});
		}

		// Start Server
		tasks.addTask("start the server", function(complete) {
			// Catch
			opts.serverHttp.once('error', function(err) {
				// Friendlify the error message if it is what we suspect it is
				if (err.message.indexOf('EADDRINUSE') !== -1) {
					err = new Error(util.format(locale.serverInUse, port));
				}

				// Done
				return complete(err);
			});

			// Listen
			docpad.log('debug', util.format(locale.serverStart, hostname, port));
			return opts.serverHttp.listen(port, hostname,  function() {
				// Log
				const address = opts.serverHttp.address();
				const serverUrl = docpad.getServerUrl({
					hostname: address.hostname,
					port: address.port
				});
				const simpleServerUrl = docpad.getSimpleServerUrl({
					hostname: address.hostname,
					port: address.port
				});
				docpad.log('info', util.format(locale.serverStarted, serverUrl));
				if (serverUrl !== simpleServerUrl) {
					docpad.log('info', util.format(locale.serverBrowse, simpleServerUrl));
				}

				// Done
				return complete();
			});
		});

		// After Plugin Event
		tasks.addTask("emit serverAfter", complete =>
			docpad.emitSerial('serverAfter', {
				server: opts.serverExpress, // b/c
				express: opts.serverExpress, // b/c
				serverHttp: opts.serverHttp,
				serverExpress: opts.serverExpress
			}, complete)
		);

		// Run the tasks
		tasks.run();

		// Chain
		return this;
	}
}
DocPad.initClass();
