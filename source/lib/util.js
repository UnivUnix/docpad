/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// =====================================
// Requires

// Standard Library
import * as pathUtil from "path";
import * as util from "util";

// External
import {uniq, compact} from "underscore";
import * as extractOptsAndCallback from "extract-opts";

// =====================================
// Export
/**
 * The DocPad Util Class.
 * Collection of DocPad utility methods
 * @class docpadUtil
 * @constructor
 * @static
 */
export class docpadUtil {
	/**
	 * Write to stderr
	 * @private
	 * @method writeStderr
	 * @param {String} data
	 */
	writeStderr(data) {
		try {
			process.stderr.write(data);
		} catch (err) {
			process.stdout.write(data);
		}
	}

	/**
	 * Write an error
	 * @private
	 * @method writeError
	 * @param {Object} err
	 */
	writeError(err) {
		try {
			this.writeStderr(err.stack.toString());
		} catch (e) {
			this.writeStderr(err.message || err);
		}
	}

	/**
	 * Wait. Wrapper for setTimeout
	 * @private
	 * @method wait
	 * @param {Number} time
	 * @param {function} fn
	 */
	wait(time, fn) {
		return setTimeout(fn, time);
	}

	/**
	 * Get Default Log Level
	 * @private
	 * @method getDefaultLogLevel
	 * @return {Number} default log level
	 */
	get defaultLogLevel() {
		if (docpadUtil.flagTravis || (process.argv.includes('-d'))) {
			return 7;
		} else {
			return 5;
		}
	}

	/**
	 * Are we executing on Travis
	 * @private
	 * @method flagTravis
	 * @return {Boolean}
	 */
	get flagTravis() {
		return (process.env.TRAVIS_NODE_VERSION != null);
	}

	/**
	 * Is this TTY
	 * @private
	 * @method flagTTY
	 * @return {Boolean}
	 */
	get flagTTY() {
		return ((process.stdout != null ? process.stdout.isTTY : undefined) === true) && ((process.stderr != null ? process.stderr.isTTY : undefined) === true);
	}

	/**
	 * Is Standadlone
	 * @private
	 * @method flagStandalone
	 * @return {Object}
	 */
	get flagStandalone() {
		return /docpad$/.test(process.argv[1] || '');
	}

	/**
	 * Is user
	 * @private
	 * @method flagUser
	 * @return {Boolean}
	 */
	get flagUser() {
		return this.flagStandalone && this.flagTTY && (this.flagTravis === false);
	}

	/**
	 * Wrapper for the node.js method util.inspect
	 * @method inspect
	 * @param {Object} obj
	 * @param {Object} opts
	 * @return {String}
	 */
	inspect(obj, opts={}) {
		// If the terminal supports colours, and the user hasn't set anything, then default to a sensible default
		if(docpadUtil.flagTTY) {
			if(!process.argv.includes('--no-colors')) {
				opts.colors = true;
			} else {
				opts.colors = false;
			}
		// If the terminal doesn't support colours, then over-write whatever the user set
		} else {
			opts.colors = false;
		}

		// Inspect and return
		return util.inspect(obj, opts);
	}

	/**
	 * Are we using standard encoding?
	 * @private
	 * @method getFlagStandardEncoding
	 * @param {String} encoding
	 * @return {Boolean}
	 */
	getFlagStandardEncoding(encoding) {
		return (['ascii', 'utf8', 'utf-8'].includes(encoding.toLowerCase()));
	}


	/**
	 * Get Local DocPad Installation Executable - ie
	 * not the global installation
	 * @private
	 * @method localDocPadExecutable
	 * @return {String} the path to the local DocPad executable
	 */
	get localDocPadExecutable() {
		return pathUtil.join(process.cwd(), 'node_modules', 'docpad', 'bin', 'docpad');
	}

	/**
	 * Is Local DocPad Installation
	 * @private
	 * @method flagLocalDocPadExecutable
	 * @return {Boolean}
	 */
	get flagLocalDocPadExecutable() {
		return (process.argv.includes(docpadUtil.localDocPadExecutable));
	}

	/**
	 * Does the local DocPad Installation Exist?
	 * @private
	 * @method getLocalDocPadExecutableExistance
	 * @return {Boolean}
	 */
	getLocalDocPadExecutableExistance() {
		return require('safefs').existsSync(docpadUtil.getLocalDocPadExecutable()) === true;
	},

	/**
	 * Spawn Local DocPad Executable
	 * @private
	 * @method startLocalDocPadExecutable
	 * @param {Function} next
	 * @return {Object} don't know what
	 */
	startLocalDocPadExecutable(next) {
		const args = process.argv.slice(2);
		const command = ['node', docpadUtil.getLocalDocPadExecutable()].concat(args);
		return require('safeps').spawn(command, {stdio:'inherit'}, function(err) {
			if (err) {
				if (next) {
					return next(err);
				} else {
					const message = `An error occured within the child DocPad instance: ${err.message}\n`;
					return docpadUtil.writeStderr(message);
				}
			} else {
				return (typeof next === 'function' ? next() : undefined);
			}
		});
	},


	/**
	 * get a filename without the extension
	 * @method getBasename
	 * @param {String} filename
	 * @return {String} base name
	 */
	getBasename(filename) {
		let basename;
		if (filename[0] === '.') {
			basename = filename.replace(/^(\.[^\.]+)\..*$/, '$1');
		} else {
			basename = filename.replace(/\..*$/, '');
		}
		return basename;
	},


	/**
	 * Get the extensions of a filename
	 * @method getExtensions
	 * @param {String} filename
	 * @return {Array} array of string
	 */
	getExtensions(filename) {
		const extensions = filename.split(/\./g).slice(1);
		return extensions;
	},


	/**
	 * Get the extension from a bunch of extensions
	 * @method getExtension
	 * @param {Array} extensions
	 * @return {String} the extension
	 */
	getExtension(extensions) {
		let extension;
		if (!require('typechecker').isArray(extensions)) {
			extensions = docpadUtil.getExtensions(extensions);
		}

		if (extensions.length !== 0) {
			extension = extensions.slice(-1)[0] || null;
		} else {
			extension = null;
		}

		return extension;
	},

	/**
	 * Get the directory path.
	 * Wrapper around the node.js path.dirname method
	 * @method getDirPath
	 * @param {String} path
	 * @return {String}
	 */
	getDirPath(path) {
		return pathUtil.dirname(path) || '';
	},

	/**
	 * Get the file name.
	 * Wrapper around the node.js path.basename method
	 * @method getFilename
	 * @param {String} path
	 * @return {String}
	 */
	getFilename(path) {
		return pathUtil.basename(path);
	},

	/**
	 * Get the DocPad out file name
	 * @method getOutFilename
	 * @param {String} basename
	 * @param {String} extension
	 * @return {String}
	 */
	getOutFilename(basename, extension) {
		if (basename === (`.${extension}`)) {  // prevent: .htaccess.htaccess
			return basename;
		} else {
			return basename+(extension ? `.${extension}` : '');
		}
	},

	/**
	 * Get the URL
	 * @method getUrl
	 * @param {String} relativePath
	 * @return {String}
	 */
	getUrl(relativePath) {
		return `/${relativePath.replace(/[\\]/g, '/')}`;
	},

	/**
	 * Get the post slug from the URL
	 * @method getSlug
	 * @param {String} relativeBase
	 * @return {String} the slug
	 */
	getSlug(relativeBase) {
		return require('bal-util').generateSlugSync(relativeBase);
	},

	/**
	 * Perform an action
	 * next(err,...), ... = any special arguments from the action
	 * this should be it's own npm module
	 * as we also use the concept of actions in a few other packages.
	 * Important concept in DocPad.
	 * @method action
	 * @param {Object} action
	 * @param {Object} opts
	 * @param {Function} next
	 */
	action(action,opts,next) {
		// Prepare
		let actionMethod, actions, actionTaskOrGroup, err;
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));
		const me = this;
		const locale = me.getLocale();
		const run = opts.run != null ? opts.run : true;
		const runner = opts.runner != null ? opts.runner : me.getActionRunner();
		console.log(`Util.action: -> action:${action}`);
		console.log("Util.action: -> opts:");
		console.log(opts);
		console.log(`Util.action: -> next:${next}`);

		// Array?
		if (Array.isArray(action)) {
			actions = action;
		} else {
			actions = action.split(/[,\s]+/g);
		}

		// Clean actions
		actions = uniq(compact(actions));

		// Exit if we have no actions
		if (actions.length === 0) {
			err = new Error(locale.actionEmpty);
			return next(err); me;
		}

		// We have multiple actions
		if (actions.length > 1) {
			actionTaskOrGroup = runner.createTaskGroup(`actions bundle: ${actions.join(' ')}`);

			for (action of Array.from(actions)) {
				// Fetch
				actionMethod = me[action].bind(me);

				// Check
				if (!actionMethod) {
					err = new Error(util.format(locale.actionNonexistant, action));
					return next(err); me;
				}

				// Task
				const task = actionTaskOrGroup.createTask(action, actionMethod, {args: [opts]});
				actionTaskOrGroup.addTask(task);
			}

		// We have single actions
		} else {
			// Fetch the action
			action = actions[0];

			// Fetch
			actionMethod = me[action].bind(me);

			// Check
			if (!actionMethod) {
				err = new Error(util.format(locale.actionNonexistant, action));
				return next(err); me;
			}

			// Task
			actionTaskOrGroup = runner.createTask(action, actionMethod, {args: [opts]});
		}

		// Create our runner task
		const runnerTask = runner.createTask(`runner task for action: ${action}`, function(continueWithRunner) {
			// Add our listener for our action
			actionTaskOrGroup.done(function(...args) {
				// If we have a completion callback, let it handle the error
				if (next) {
					next(...Array.from(args || []));
					args[0] = null;
				}

				// Continue with our runner
				return continueWithRunner(...Array.from(args || []));
			});

			// Run our action
			return actionTaskOrGroup.run();
		});

		// Add it and run it
		runner.addTask(runnerTask);
		if (run === true) { runner.run(); }

		// Chain
		return me;
	}
});