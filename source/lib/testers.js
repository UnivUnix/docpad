/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// =====================================
// Requires

// Standard Library
let PluginTester, RendererTester, ServerTester, test;
const pathUtil = require('path');

// External
const safefs = require('safefs');
const balUtil = require('bal-util');
const extendr = require('extendr');
const joe = require('joe');
const assert = require('assert');
const {equal, deepEqual, errorEqual} = require('assert-helpers');
const CSON = require('cson');
const {difference} = require('underscore');

// Local
const DocPad = require('./docpad');
const docpadUtil = require('./util');


// =====================================
// Helpers

// Prepare
// We want the plugn port to be a semi-random number above 2000
let pluginPort = 2000 + parseInt(String(Date.now()).substr(-6, 4));
const testers = {
	CSON,
	DocPad
};


// ---------------------------------
// Classes

/**
 * The Plugin Tester class
 * @class PluginTester
 * @constructor
 */
testers.PluginTester =
(PluginTester = (function() {
	PluginTester = class PluginTester {
		static initClass() {
			// Add support for BasePlugin.extend(proto)
			this.extend = require('csextends');
	
	
			/**
			 * Default plugin config
			 * @property {Object}
			 */
			this.prototype.config = {
				testerName: null,
				pluginName: null,
				pluginPath: null,
				testPath: null,
				outExpectedPath: null,
				removeWhitespace: false,
				contentRemoveRegex: null,
				autoExit: 'safe'
			};
	
			/**
			 * Default DocPad config
			 * @property {Object}
			 */
			this.prototype.docpadConfig = {
				global: true,
				port: null,
				logLevel: ((Array.from(process.argv).includes('-d')) ? 7 : 5),
				rootPath: null,
				outPath: null,
				srcPath: null,
				pluginPaths: null,
				enableUnlistedPlugins: true,
				enabledPlugins: null,
				skipUnsupportedPlugins: false,
				catchExceptions: false,
				environment: null
			};
	
	
			/**
			 * The DocPad instance
			 * @private
			 * @property {Object}
			 */
			this.prototype.docpad = null;
		}
	
		/**
		 * Constructor method
		 * @method constructor
		 * @param {Object} [config={}]
		 * @param {Object} [docpadConfig={}]
		 * @param {Function} next
		 */
		constructor(config,docpadConfig,next) {
			// Apply Configuration
			this.testCreate = this.testCreate.bind(this);
			this.testLoad = this.testLoad.bind(this);
			this.testServer = this.testServer.bind(this);
			this.testGenerate = this.testGenerate.bind(this);
			this.testEverything = this.testEverything.bind(this);
			if (config == null) { config = {}; }
			if (docpadConfig == null) { docpadConfig = {}; }
			const tester = this;
			this.config = extendr.deep({}, PluginTester.prototype.config, this.config, config);
			this.docpadConfig = extendr.deep({}, PluginTester.prototype.docpadConfig, this.docpadConfig, docpadConfig);
			if (this.docpadConfig.port == null) { this.docpadConfig.port = ++pluginPort; }
			if (this.config.testerName == null) { this.config.testerName = `${this.config.pluginName} plugin`; }

			// Extend Configuration
			if (!this.config.testPath) { this.config.testPath = pathUtil.join(this.config.pluginPath, 'test'); }
			if (!this.config.outExpectedPath) { this.config.outExpectedPath = pathUtil.join(this.config.testPath, 'out-expected'); }

			// Extend DocPad Configuration
			if (!this.docpadConfig.rootPath) { this.docpadConfig.rootPath = this.config.testPath; }
			if (!this.docpadConfig.outPath) { this.docpadConfig.outPath = pathUtil.join(this.docpadConfig.rootPath, 'out'); }
			if (!this.docpadConfig.srcPath) { this.docpadConfig.srcPath = pathUtil.join(this.docpadConfig.rootPath, 'src'); }
			if (this.docpadConfig.pluginPaths == null) { this.docpadConfig.pluginPaths = [this.config.pluginPath]; }
			const defaultEnabledPlugins = {};
			defaultEnabledPlugins[this.config.pluginName] = true;
			if (!this.docpadConfig.enabledPlugins) { this.docpadConfig.enabledPlugins = defaultEnabledPlugins; }

			// Test API
			joe.describe(this.config.testerName, function(suite,task) {
				tester.describe = (tester.suite = suite);
				tester.it = (tester.test = task);
				tester.done = (tester.exit = next => tester.docpad != null ? tester.docpad.action('destroy', next) : undefined);
				return (typeof next === 'function' ? next(null, tester) : undefined);
			});

			// Chain
			this;
		}


		/**
		 * Get tester Configuration
		 * @method getConfig
		 * @return {Object}
		 */
		getConfig() {
			return this.config;
		}

		/**
		 * Get the plugin instance
		 * @method getPlugin
		 * @return {Object} the plugin
		 */
		getPlugin() {
			return this.docpad.getPlugin(this.getConfig().pluginName);
		}


		/**
		 * Create the DocPad instance
		 * @method testCreate
		 */
		testCreate() {
			// Prepare
			const tester = this;
			const { docpadConfig } = this;

			// Create Instance
			this.test("create", done =>
				new DocPad(docpadConfig, function(err, docpad) {
					if (err) { return done(err); }
					tester.docpad = docpad;

					// init docpad in case the plugin is starting from scratch
					return tester.docpad.action('init', function(err) {
						if (err && (err.message !== tester.docpad.getLocale().skeletonExists)) {
							return done(err);  // care about the error providing it isn't the skeleton exists error
						}

						// clean up the docpad out directory
						return tester.docpad.action('clean', function(err) {
							if (err) { return done(err); }

							// install anything on the website that needs to be installed
							return tester.docpad.action('install', done);
						});
					});
				})
			);

			// Chain
			return this;
		}

		/**
		 * Test Loaded
		 * @method
		 */
		testLoad() {
			// Prepare
			const tester = this;

			// Test
			this.test(`load plugin ${tester.config.pluginName}`, done =>
				tester.docpad.loadedPlugin(tester.config.pluginName, function(err,loaded) {
					if (err) { return done(err); }
					assert.ok(loaded);
					return done();
				})
			);

			// Chain
			return this;
		}

		// Perform Server
		testServer(next) {
			// Prepare
			const tester = this;

			// Handle
			this.test("server", done =>
				tester.docpad.action('server', err => done(err))
			);

			// Chain
			return this;
		}

		/**
		 * Test generate
		 * @method
		 */
		testGenerate() {
			// Prepare
			const tester = this;

			// Test
			this.test("generate", done =>
				tester.docpad.action('generate', err => done(err))
			);

			// Chain
			return this;
		}

		/**
		 * Test everything
		 * @method {Object}
		 */
		testEverything() {
			// Prepare
			const tester = this;

			// Tests
			this.testCreate();
			this.testLoad();
			this.testGenerate();
			this.testServer();
			if (typeof this.testCustom === 'function') {
				this.testCustom();
			}

			// Finish
			this.finish();

			// Chain
			return this;
		}

		/**
		 * Finish
		 * @method finish
		 */
		finish() {
			// Prepare
			const tester = this;

			// Finish
			if (tester.config.autoExit) {
				this.test('finish up', next => tester.exit(next));
			}

			// Chain
			return this;
		}
	};
	PluginTester.initClass();
	return PluginTester;
})());

/**
 * Server tester
 * @class ServerTester
 * @extends PluginTester
 * @constructor
 */
testers.ServerTester =
(ServerTester = class ServerTester extends PluginTester {});


/**
 * Rednderer tester
 * @class ServerTester
 * @extends PluginTester
 * @constructor
 */
testers.RendererTester =
(RendererTester = class RendererTester extends PluginTester {
	// Test Generation
	testGenerate() {
		// Prepare
		const tester = this;

		// Test
		this.suite("generate", function(suite,test) {
			test('action', done =>
				tester.docpad.action('generate', err => done(err))
			);

			return suite('results', (suite,test,done) =>
				// Get actual results
				balUtil.scanlist(tester.docpadConfig.outPath, function(err,outResults) {
					if (err) { return done(err); }

					// Get expected results
					return balUtil.scanlist(tester.config.outExpectedPath, function(err,outExpectedResults) {
						if (err) { return done(err); }

						// Prepare
						const outResultsKeys = Object.keys(outResults);
						const outExpectedResultsKeys = Object.keys(outExpectedResults);

						// Check we have the same files
						test('same files', function() {
							let outDifferenceKeys = difference(outExpectedResultsKeys, outResultsKeys);
							deepEqual(outDifferenceKeys, [], 'The following file(s) should have been generated');
							outDifferenceKeys = difference(outResultsKeys, outExpectedResultsKeys);
							return deepEqual(outDifferenceKeys, [], 'The following file(s) should not have been generated');
						});

						// Check the contents of those files match
						outResultsKeys.forEach(key =>
							test(`same file content for: ${key}`, function() {
								// Fetch file value
								let actual = outResults[key];
								let expected = outExpectedResults[key];

								// Remove empty lines
								if (tester.config.removeWhitespace === true) {
									const replaceLinesRegex = /\s+/g;
									actual = actual.replace(replaceLinesRegex, '');
									expected = expected.replace(replaceLinesRegex, '');
								}

								// Content regex
								if (tester.config.contentRemoveRegex) {
									actual = actual.replace(tester.config.contentRemoveRegex, '');
									expected = expected.replace(tester.config.contentRemoveRegex, '');
								}

								// Compare
								return equal(actual, expected);
							})
						);

						// Forward
						return done();
					});
				})
			);
		});

		// Chain
		return this;
	}
});

/**
 * Test a plugin
 * test({pluginPath: String})
 * @property test
 */
testers.test =
(test = function(testerConfig, docpadConfig) {
	// Configure
	if (testerConfig.testerClass == null) { testerConfig.testerClass = PluginTester; }
	testerConfig.pluginPath = pathUtil.resolve(testerConfig.pluginPath);
	if (testerConfig.pluginName == null) { testerConfig.pluginName = pathUtil.basename(testerConfig.pluginPath).replace('docpad-plugin-',''); }
	if (testerConfig.testerPath == null) { testerConfig.testerPath = pathUtil.join('out', `${testerConfig.pluginName}.tester.js`); }
	if (testerConfig.testerPath) { testerConfig.testerPath = pathUtil.resolve(testerConfig.pluginPath, testerConfig.testerPath); }

	// Create tester
	const complete = function() {
		// Accept string inputs for testerClass
		if (typeof testerConfig.testerClass === 'string') { testerConfig.testerClass = testers[testerConfig.testerClass]; }

		// Create our tester
		return new testerConfig.testerClass(testerConfig, docpadConfig, function(err,testerInstance) {
			if (err) { throw err; }

			// Run the tests
			return testerInstance.testEverything();
		});
	};

	// Load the tester file
	if (testerConfig.testerPath) {
		safefs.exists(testerConfig.testerPath, function(exists) {
			if (exists) { testerConfig.testerClass = require(testerConfig.testerPath)(testers); }
			return complete();
		});

	// User the default tester
	} else {
		complete();
	}

	// Chain
	return testers;
});


// ---------------------------------
// Export Testers
module.exports = testers;
