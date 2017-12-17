/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS203: Remove `|| {}` from converted for-own loops
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// =====================================
// Requires

// Standard Library
import * as pathUtil from 'path'

// External
import * as safefs from 'safefs'
import * as safeps from 'safeps'
import {TaskGroup} from 'taskgroup'
import * as extendr from 'extendr'
import * as promptly from 'promptly'

// Local
import {DocpadUtil} from '../util'


// =====================================
// Classes

/**
 * Console Interface
 * @constructor
 */
class ConsoleInterface {


	/**
	 * Constructor method. Setup the CLI
	 * @private
	 * @method constructor
	 * @param {Object} opts
	 * @param {Function} next
	 */
	constructor(opts,next) {
		// Prepare
		let commander, docpad;
		this.start = this.start.bind(this);
		this.getCommander = this.getCommander.bind(this);
		this.destroy = this.destroy.bind(this);
		this.wrapAction = this.wrapAction.bind(this);
		this.performAction = this.performAction.bind(this);
		this.extractConfig = this.extractConfig.bind(this);
		this.selectSkeletonCallback = this.selectSkeletonCallback.bind(this);
		this.welcomeCallback = this.welcomeCallback.bind(this);
		this.action = this.action.bind(this);
		this.init = this.init.bind(this);
		this.generate = this.generate.bind(this);
		this.help = this.help.bind(this);
		this.info = this.info.bind(this);
		this.update = this.update.bind(this);
		this.upgrade = this.upgrade.bind(this);
		this.install = this.install.bind(this);
		this.uninstall = this.uninstall.bind(this);
		this.render = this.render.bind(this);
		this.run = this.run.bind(this);
		this.server = this.server.bind(this);
		this.clean = this.clean.bind(this);
		this.watch = this.watch.bind(this);
		const consoleInterface = this;
		this.docpad = (docpad = opts.docpad);
		this.commander = (commander = require('commander'));
		const locale = docpad.getLocale();


		// -----------------------------
		// Global config

		commander
			.version(
				docpad.getVersionString()
			)
			.option(
				'-o, --out <outPath>',
				locale.consoleOptionOut
			)
			.option(
				'-c, --config <configPath>',
				locale.consoleOptionConfig
			)
			.option(
				'-e, --env <environment>',
				locale.consoleOptionEnv
			)
			.option(
				'-d, --debug [logLevel]',
				locale.consoleOptionDebug,
				parseInt
			)
			.option(
				'-g, --global',
				locale.consoleOptionGlobal
			)
			.option(
				'-f, --force',
				locale.consoleOptionForce
			)
			.option(
				'--no-color',  // commander translates this to the `color` option for us
				locale.consoleOptionNoColor
			)
			.option(
				'-p, --port <port>',
				locale.consoleOptionPort,
				parseInt
			)
			.option(
				'--cache',
				locale.consoleOptionCache
			)
			.option(
				'--silent',
				locale.consoleOptionSilent
			)
			.option(
				'--skeleton <skeleton>',
				locale.consoleOptionSkeleton
			)
			.option(
				'--offline',
				locale.consoleOptionOffline
			);


		// -----------------------------
		// Commands

		// actions
		commander
			.command('action <actions>')
			.description(locale.consoleDescriptionRun)
			.action(consoleInterface.wrapAction(consoleInterface.action));

		// init
		commander
			.command('init')
			.description(locale.consoleDescriptionInit)
			.action(consoleInterface.wrapAction(consoleInterface.init));

		// run
		commander
			.command('run')
			.description(locale.consoleDescriptionRun)
			.action(consoleInterface.wrapAction(consoleInterface.run, {
				_stayAlive: true
			}));

		// server
		commander
			.command('server')
			.description(locale.consoleDescriptionServer)
			.action(consoleInterface.wrapAction(consoleInterface.server, {
				_stayAlive: true
			}));

		// render
		commander
			.command('render [path]')
			.description(locale.consoleDescriptionRender)
			.action(consoleInterface.wrapAction(consoleInterface.render, {
				// Disable anything unnecessary or that could cause extra output we don't want
				logLevel: 3,  // 3:error, 2:critical, 1:alert, 0:emergency
				checkVersion: false,
				welcome: false,
				prompts: false
			}));

		// generate
		commander
			.command('generate')
			.description(locale.consoleDescriptionGenerate)
			.action(consoleInterface.wrapAction(consoleInterface.generate));

		// watch
		commander
			.command('watch')
			.description(locale.consoleDescriptionWatch)
			.action(consoleInterface.wrapAction(consoleInterface.watch, {
				_stayAlive: true
			}));

		// update
		commander
			.command('update')
			.description(locale.consoleDescriptionUpdate)
			.action(consoleInterface.wrapAction(consoleInterface.update));

		// upgrade
		commander
			.command('upgrade')
			.description(locale.consoleDescriptionUpgrade)
			.action(consoleInterface.wrapAction(consoleInterface.upgrade));

		// install
		commander
			.command('install [pluginName]')
			.description(locale.consoleDescriptionInstall)
			.action(consoleInterface.wrapAction(consoleInterface.install));

		// uninstall
		commander
			.command('uninstall <pluginName>')
			.description(locale.consoleDescriptionUninstall)
			.action(consoleInterface.wrapAction(consoleInterface.uninstall));

		// clean
		commander
			.command('clean')
			.description(locale.consoleDescriptionClean)
			.action(consoleInterface.wrapAction(consoleInterface.clean));

		// info
		commander
			.command('info')
			.description(locale.consoleDescriptionInfo)
			.action(consoleInterface.wrapAction(consoleInterface.info));

		// help
		commander
			.command('help')
			.description(locale.consoleDescriptionHelp)
			.action(consoleInterface.wrapAction(consoleInterface.help));

		// unknown
		commander
			.command('*')
			.description(locale.consoleDescriptionUnknown)
			.action(consoleInterface.wrapAction(consoleInterface.help));


		// -----------------------------
		// DocPad Listeners

		// Welcome
		docpad.on('welcome', (data,next) => consoleInterface.welcomeCallback(data,next));


		// -----------------------------
		// Finish Up

		// Plugins
		docpad.emitSerial('consoleSetup', {consoleInterface,commander}, function(err) {
			if (err) { return consoleInterface.destroyWithError(err); }
			return next(null, consoleInterface);
		});

		// Chain
		this;
	}


	// =================================
	// Helpers

	/**
	 * Start the CLI
	 * @method start
	 * @param {Array} argv
	 */
	start(argv) {
		this.commander.parse(argv || process.argv);
		return this;
	}

	/**
	 * Get the commander
	 * @method getCommander
	 * @return the commander instance
	 */
	getCommander() {
		return this.commander;
	}

	/**
	 * Destructor.
	 * @method destroy
	 * @param {Object} err
	 */
	destroy(err) {
		// Prepare
		const { docpad } = this;
		const locale = docpad.getLocale();
		const logLevel = docpad.getLogLevel();

		// Error?
		if (err) { DocpadUtil.writeError(err); }

		// Log Shutdown
		docpad.log('info', locale.consoleShutdown);

		// Handle any errors that occur when stdin is closed
		// https://github.com/docpad/docpad/pull/1049
		process.stdin.on('error', function(err) {
			if (6 < logLevel) {
				return console.error(err);
			}
		});

		// Close stdin
		process.stdin.end();

		// Destroy docpad
		docpad.destroy(function(err) {
			// Error?
			if (err) { DocpadUtil.writeError(err); }

			// Output if we are not in silent mode
			if (6 <= logLevel) {
				// Note any requests that are still active
				const activeRequests = process._getActiveRequests();
				if (activeRequests != null ? activeRequests.length : undefined) {
					console.log(`\
Waiting on the requests:
${DocpadUtil.inspect(activeRequests)}\
`
					);
				}

				// Note any handles that are still active
				const activeHandles = process._getActiveHandles();
				if (activeHandles != null ? activeHandles.length : undefined) {
					return console.log(`\
Waiting on the handles:
${DocpadUtil.inspect(activeHandles)}\
`
					);
				}
			}
		});

		// Chain
		return this;
	}


	/**
	 * Wrap Action
	 * @method wrapAction
	 * @param {Object} action
	 * @param {Object} config
	 */
	wrapAction(action,config) {
		const consoleInterface = this;
		return (...args) => consoleInterface.performAction(action, args, config);
	}

	/**
	 * Perform Action
	 * @method performAction
	 * @param {Object} action
	 * @param {Object} args
	 * @param {Object} [config={}]
	 */
	performAction(action,args,config) {
		// Prepare
		if (config == null) { config = {}; }
		const consoleInterface = this;
		const { docpad } = this;

		// Special Opts
		let stayAlive = false;
		if (config._stayAlive) {
			stayAlive = config._stayAlive;
			delete config._stayAlive;
		}

		// Create
		const opts = {};
		opts.commander = args.slice(-1)[0];
		opts.args = args.slice(0, -1);
		opts.instanceConfig = extendr.deepDefaults({}, this.extractConfig(opts.commander), config);

		// Complete Action
		const completeAction = function(err) {
			// Prepare
			const locale = docpad.getLocale();

			// Handle the error
			if (err) {
				docpad.log('error', locale.consoleSuccess);
				return docpad.fatal(err);
			}

			// Success
			docpad.log('info', locale.consoleSuccess);

			// Shutdown
			if (stayAlive === false) { return consoleInterface.destroy(); }
		};

		// Load
		docpad.action('load ready', opts.instanceConfig, function(err) {
			// Check
			if (err) { return completeAction(err); }

			// Action
			return action(completeAction, opts);
		});  // this order for interface actions for b/c

		// Chain
		return this;
	}

	/**
	 * Extract Configuration
	 * @method extractConfig
	 * @param {Object} [customConfig={}]
	 * @return {Object} the DocPad config
	 */
	extractConfig(customConfig) {
		// Prepare
		let value;
		if (customConfig == null) { customConfig = {}; }
		const config = {};
		const commanderConfig = this.commander;
		const sourceConfig = this.docpad.initialConfig;

		// debug -> logLevel
		if (commanderConfig.debug) {
			if (commanderConfig.debug === true) { commanderConfig.debug = 7; }
			commanderConfig.logLevel = commanderConfig.debug;
		}

		// silent -> prompt
		if (commanderConfig.silent != null) {
			commanderConfig.prompts = !(commanderConfig.silent);
		}

		// cache -> databaseCache
		if (commanderConfig.silent != null) {
			commanderConfig.databaseCache = commanderConfig.cache;
		}

		// config -> configPaths
		if (commanderConfig.config) {
			const configPath = pathUtil.resolve(process.cwd(),commanderConfig.config);
			commanderConfig.configPaths = [configPath];
		}

		// out -> outPath
		if (commanderConfig.out) {
			const outPath = pathUtil.resolve(process.cwd(),commanderConfig.out);
			commanderConfig.outPath = outPath;
		}

		// Apply global configuration
		for (var key of Object.keys(commanderConfig || {})) {
			value = commanderConfig[key];
			if (typeof sourceConfig[key] !== 'undefined') {
				config[key] = value;
			}
		}

		// Apply custom configuration
		for (key of Object.keys(customConfig || {})) {
			value = customConfig[key];
			if (typeof sourceConfig[key] !== 'undefined') {
				config[key] = value;
			}
		}

		// Return config object
		return config;
	}

	/**
	 * Select a skeleton
	 * @method selectSkeletonCallback
	 * @param {Object} skeletonsCollection
	 * @param {Function} next
	 */
	selectSkeletonCallback(skeletonsCollection,next) {
		// Prepare
		const consoleInterface = this;
		const { commander } = this;
		const { docpad } = this;
		const locale = docpad.getLocale();
		const skeletonNames = [];

		// Already selected?
		if (this.commander.skeleton) {
			const skeletonModel = skeletonsCollection.get(this.commander.skeleton);
			if (skeletonModel) {
				next(null, skeletonModel);
			} else {
				const err = new Error(`Couldn't fetch the skeleton with id ${this.commander.skeleton}`);
				next(err);
			}
			return this;
		}

		// Show
		docpad.log('info', locale.skeletonSelectionIntroduction+'\n');
		skeletonsCollection.forEach(function(skeletonModel) {
			const skeletonName = skeletonModel.get('name');
			const skeletonDescription = skeletonModel.get('description').replace(/\n/g,'\n\t');
			skeletonNames.push(skeletonName);
			return console.log(`  ${skeletonModel.get('position')+1}.\t${skeletonName}\n  \t${skeletonDescription}\n`);
		});

		// Select
		consoleInterface.choose(locale.skeletonSelectionPrompt, skeletonNames, null, function(err, choice) {
			if (err) { return next(err); }
			const index = skeletonNames.indexOf(choice);
			return next(null, skeletonsCollection.at(index));
		});

		// Chain
		return this;
	}

	/**
	 * Welcome Callback
	 * @method welcomeCallback
	 * @param {Object} opts
	 * @param {Function} next
	 */
	welcomeCallback(opts,next) {
		// Prepare
		const consoleInterface = this;
		const { commander } = this;
		const { docpad } = this;
		const locale = docpad.getLocale();
		const { userConfig } = docpad;
		const welcomeTasks = new TaskGroup('welcome tasks').done(next);

		// TOS
		welcomeTasks.addTask('tos', function(complete) {
			if ((docpad.config.prompts === false) || (userConfig.tos === true)) { return complete(); }

			// Ask the user if they agree to the TOS
			return consoleInterface.confirm(locale.tosPrompt, {default:true}, function(err, ok) {
				// Check
				if (err) { return complete(err); }

				// Track
				return docpad.track('tos', {ok}, function(err) {
					// Check
					if (ok) {
						userConfig.tos = true;
						console.log(locale.tosAgree);
						docpad.updateUserConfig(complete);
						return;
					} else {
						console.log(locale.tosDisagree);
						process.exit();
						return;
					}
				});
			});
		});

		// Newsletter
		welcomeTasks.addTask(function(complete) {
			if ((docpad.config.prompts === false) || (userConfig.subscribed != null) || ((userConfig.subscribeTryAgain != null) && ((new Date()) > (new Date(userConfig.subscribeTryAgain))))) { return complete(); }

			// Ask the user if they want to subscribe to the newsletter
			return consoleInterface.confirm(locale.subscribePrompt, {default:true}, function(err, ok) {
				// Check
				if (err) { return complete(err); }

				// Track
				return docpad.track('subscribe', {ok}, function(err) {
					// If they don't want to, that's okay
					if (!ok) {
						// Inform the user that we received their preference
						console.log(locale.subscribeIgnore);

						// Save their preference in the user configuration
						userConfig.subscribed = false;
						docpad.updateUserConfig(function(err) {
							if (err) { return complete(err); }
							return setTimeout(complete, 2000);
						});
						return;
					}

					// Scan configuration to speed up the process
					const commands = [
						['config','--get','user.name'],
						['config','--get','user.email'],
						['config','--get','github.user']
					];
					return safeps.spawnCommands('git', commands, function(err,results) {
						// Ignore error as it just means a config value wasn't defined

						// Fetch
						// The or to '' is there because otherwise we will get "undefined" as a string if the value doesn't exist
						userConfig.name = String(__guard__(results != null ? results[0] : undefined, x => x[1]) || '').toString().trim() || null;
						userConfig.email = String(__guard__(results != null ? results[1] : undefined, x1 => x1[1]) || '').toString().trim() || null;
						userConfig.username = String(__guard__(results != null ? results[2] : undefined, x2 => x2[1]) || '').toString().trim() || null;

						// Let the user know we scanned their configuration if we got anything useful
						if (userConfig.name || userConfig.email || userConfig.username) {
							console.log(locale.subscribeConfigNotify);
						}

						// Tasks
						const subscribeTasks = new TaskGroup('subscribe tasks').done(function(err) {
							// Error?
							if (err) {
								// Inform the user
								console.log(locale.subscribeError);

								// Save a time when we should try to subscribe again
								userConfig.subscribeTryAgain = new Date().getTime() + (1000*60*60*24);  // tomorrow

							// Success
							} else {
								// Inform the user
								console.log(locale.subscribeSuccess);

								// Save the updated subscription status, and continue to what is next
								userConfig.subscribed = true;
								userConfig.subscribeTryAgain = null;
							}

							// Save the new user configuration changes, and forward to the next task
							return docpad.updateUserConfig(userConfig, complete);
						});

						// Name Fallback
						subscribeTasks.addTask('name fallback', complete =>
							consoleInterface.prompt(locale.subscribeNamePrompt, {default: userConfig.name}, function(err, result) {
								if (err) { return complete(err); }
								userConfig.name = result;
								return complete();
							})
						);

						// Email Fallback
						subscribeTasks.addTask('email fallback', complete =>
							consoleInterface.prompt(locale.subscribeEmailPrompt, {default: userConfig.email}, function(err, result) {
								if (err) { return complete(err); }
								userConfig.email = result;
								return complete();
							})
						);

						// Username Fallback
						subscribeTasks.addTask('username fallback', complete =>
							consoleInterface.prompt(locale.subscribeUsernamePrompt, {default: userConfig.username}, function(err, result) {
								if (err) { return complete(err); }
								userConfig.username = result;
								return complete();
							})
						);

						// Save the details
						subscribeTasks.addTask('save defaults', complete => docpad.updateUserConfig(complete));

						// Perform the subscribe
						subscribeTasks.addTask('subscribe', function(complete) {
							// Inform the user
							console.log(locale.subscribeProgress);

							// Forward
							return docpad.subscribe(function(err,res) {
								// Check
								if (err) {
									docpad.log('debug', locale.subscribeRequestError, err.message);
									return complete(err);
								}

								// Success
								docpad.log('debug', locale.subscribeRequestData, res.text);
								return complete();
							});
						});

						// Run
						return subscribeTasks.run();
					});
				});
			});
		});

		// Run
		welcomeTasks.run();

		// Chain
		return this;
	}

	/**
	 * Prompt for input
	 * @method prompt
	 * @param {String} message
	 * @param {Object} [opts={}]
	 * @param {Function} next
	 */
	prompt(message, opts, next) {
		// Default
		if (opts == null) { opts = {}; }
		if (opts.default) { message += ` [${opts.default}]`; }

		// Options
		opts = extendr.extend({
			trim: true,
			retry: true,
			silent: false
		}, opts);

		// Log
		promptly.prompt(message, opts, next);

		// Chain
		return this;
	}

	/**
	 * Confirm an option
	 * @method confirm
	 * @param {String} message
	 * @param {Object} [opts={}]
	 * @param {Function} next
	 */
	confirm(message, opts, next) {
		// Default
		if (opts == null) { opts = {}; }
		if (opts.default === true) {
			message += " [Y/n]";
		} else if (opts.default === false) {
			message += " [y/N]";
		}

		// Options
		opts = extendr.extend({
			trim: true,
			retry: true,
			silent: false
		}, opts);

		// Log
		promptly.confirm(message, opts, next);

		// Chain
		return this;
	}

	/**
	 * Choose something
	 * @method choose
	 * @param {String} message
	 * @param {Object} choices
	 * @param {Object} [opts={}]
	 * @param {Function} next
	 */
	choose(message, choices, opts, next) {
		// Default
		let choice;
		if (opts == null) { opts = {}; }
		message += ` [1-${choices.length}]`;
		const indexes = [];
		for (let i = 0; i < choices.length; i++) {
			choice = choices[i];
			const index = i+1;
			indexes.push(index);
			message += `\n  ${index}.\t${choice}`;
		}

		// Options
		opts = extendr.extend({
			trim: true,
			retry: true,
			silent: false
		}, opts);

		// Prompt
		let prompt = '> ';
		if (opts.default) { prompt += ` [${opts.default}]`; }

		// Log
		console.log(message);
		promptly.choose(prompt, indexes, opts, function(err, index) {
			if (err) { return next(err); }
			choice = choices[index-1];
			return next(null, choice);
		});

		// Chain
		return this;
	}


	// =================================
	// Actions

	/**
	 * Do action
	 * @method action
	 * @param {Function} next
	 * @param {Object} opts
	 */
	action(next,opts) {
		const actions = opts.args[0];
		this.docpad.log('info', 'Performing the actions:', actions);
		this.docpad.action(actions, next);
		return this;
	}

	/**
	 * Action initialise
	 * @method init
	 * @param {Function} next
	 */
	init(next) {
		this.docpad.action('init', next);
		return this;
	}

	/**
	 * Generate action
	 * @method generate
	 * @param {Function} next
	 */
	generate(next) {
		this.docpad.action('generate', next);
		return this;
	}

	/**
	 * Help method
	 * @method help
	 * @param {Function} next
	 */
	help(next) {
		const help = this.commander.helpInformation();
		console.log(help);
		next();
		return this;
	}

	/**
	 * Info method
	 * @method info
	 * @param {Function} next
	 */
	info(next) {
		const { docpad } = this;
		const info = docpad.inspector(docpad.config);
		console.log(info);
		next();
		return this;
	}

	/**
	 * Update method
	 * @method update
	 * @param {Function} next
	 * @param {Object} opts
	 */
	update(next,opts) {
		// Act
		this.docpad.action('clean update', next);

		// Chain
		return this;
	}
	/**
	 * Upgrade method
	 * @method upgrade
	 * @param {Function} next
	 * @param {Object} opts
	 */
	upgrade(next,opts) {
		// Act
		this.docpad.action('upgrade', next);

		// Chain
		return this;
	}

	/**
	 * Install method
	 * @method install
	 * @param {Function} next
	 * @param {Object} opts
	 */
	install(next,opts) {
		// Extract
		const plugin = opts.args[0] || null;

		// Act
		this.docpad.action('install', {plugin}, next);

		// Chain
		return this;
	}

	/**
	 * Uninstall method
	 * @method uninstall
	 * @param {Function} next
	 * @param {Object} opts
	 */
	uninstall(next,opts) {
		// Extract
		const plugin = opts.args[0] || null;

		// Act
		this.docpad.action('uninstall', {plugin}, next);

		// Chain
		return this;
	}

	/**
	 * Render method
	 * @method render
	 * @param {Function} next
	 * @param {Object} opts
	 */
	render(next,opts) {
		// Prepare
		const { docpad } = this;
		const { commander } = this;
		const renderOpts = {};

		// Extract
		const filename = opts.args[0] || null;
		const basename = pathUtil.basename(filename);
		renderOpts.filename = filename;
		renderOpts.renderSingleExtensions = 'auto';

		// Prepare text
		let data = '';

		// Render
		let useStdin = true;
		const renderDocument = complete =>
			// Perform the render
			docpad.action('render', renderOpts, function(err,result) {
				if (err) { return complete(err); }

				// Path
				if (commander.out != null) {
					return safefs.writeFile(commander.out, result, complete);

				// Stdout
				} else {
					process.stdout.write(result);
					return complete();
				}
			})
		;

		// Timeout if we don't have stdin
		var timeout = DocpadUtil.wait(1000, function() {
			// Clear timeout
			timeout = null;

			// Skip if we are using stdin
			if (data.replace(/\s+/,'')) { return next(); }

			// Close stdin as we are not using it
			useStdin = false;
			stdin.pause();

			// Render the document
			return renderDocument(next);
		});

		// Read stdin
		var { stdin } = process;
		stdin.resume();
		stdin.setEncoding('utf8');
		stdin.on('data', _data => data += _data.toString());
		process.stdin.on('end', function() {
			if (!useStdin) { return; }
			if (timeout) {
				clearTimeout(timeout);
				timeout = null;
			}
			renderOpts.data = data;
			return renderDocument(next);
		});

		return this;
	}

	/**
	 * Run method
	 * @method run
	 * @param {Function} next
	 */
	run(next) {
		this.docpad.action('run', {
			selectSkeletonCallback: this.selectSkeletonCallback,
			next
		});
		return this;
	}

	/**
	 * Server method
	 * @method server
	 * @param {Function} next
	 */
	server(next) {
		this.docpad.action('server generate', next);
		return this;
	}

	/**
	 * Clean method
	 * @method clean
	 * @param {Function} next
	 */
	clean(next) {
		this.docpad.action('clean', next);
		return this;
	}

	/**
	 * Watch method
	 * @method watch
	 * @param {Function} next
	 */
	watch(next) {
		this.docpad.action('generate watch', next);
		return this;
	}
}


// =====================================
// Export
module.exports = ConsoleInterface;

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}