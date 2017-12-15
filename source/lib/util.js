// =====================================
// Requires

// Standard Library
import * as pathUtil from 'path'
import * as util from 'util'

// External
import {uniq, compact} from 'underscore'
import * as extractOptsAndCallback from 'extract-opts'
import * as safeps from 'safeps'
import * as safefs from 'safefs'
import * as typeChecker from 'typechecker'
import * as balUtil from 'bal-util'

// =====================================
// Export
/**
 * The DocPad Util Class.
 * Collection of DocPad utility methods
 * @class docpadUtil
 * @constructor
 * @static
 */
export class DocpadUtil {
	/**
	 * Write to stderr
	 * @private
	 * @method writeStderr
	 * @param {String} data
	 * @returns {null}
	 */
	static writeStderr (data) {
		try {
			process.stderr.write(data)
		}
		catch (err) {
			process.stdout.write(data)
		}
	}

	/**
	 * Write an error
	 * @private
	 * @method writeError
	 * @param {Object} err
	 * @returns {null}
	 */
	static writeError (err) {
		try {
			DocpadUtil.writeStderr(err.stack.toString())
		}
		catch (e) {
			DocpadUtil.writeStderr(err.message || err)
		}
	}

	/**
	 * Wait. Wrapper for setTimeout
	 * @private
	 * @method wait
	 * @param {Number} time
	 * @param {function} fn
	 * @returns {null}
	 */
	static wait (time, fn) {
		setTimeout(fn, time)
	}

	/**
	 * Get Default Log Level
	 * @private
	 * @method getDefaultLogLevel
	 * @return {Number} default log level
	 */
	static getDefaultLogLevel () {
		if (DocpadUtil.getFlagTravis() || (process.argv.includes('-d'))) {
			return 7
		}
		else {
			return 5
		}
	}

	/**
	 * Are we executing on Travis
	 * @private
	 * @method flagTravis
	 * @return {Boolean}
	 */
	static getFlagTravis () {
		return (process.env.TRAVIS_NODE_VERSION != null)
	}

	/**
	 * Is this TTY
	 * @private
	 * @method flagTTY
	 * @return {Boolean}
	 */
	static getFlagTTY () {
		return ((process.stdout != null ? process.stdout.isTTY : null) === true) && ((process.stderr != null ? process.stderr.isTTY : null) === true)
	}

	/**
	 * Is Standadlone
	 * @private
	 * @method flagStandalone
	 * @return {Object}
	 */
	static getFlagStandalone () {
		return (/docpad$/).test(process.argv[1] || '')
	}

	/**
	 * Is user
	 * @private
	 * @method flagUser
	 * @return {Boolean}
	 */
	static getFlagUser () {
		return DocpadUtil.getFlagStandalone() && this.flagTTY && (DocpadUtil.getFlagTravis() === false)
	}

	/**
	 * Wrapper for the node.js method util.inspect
	 * @method inspect
	 * @param {Object} obj
	 * @param {Object} opts
	 * @return {String}
	 */
	static inspect (obj, opts = {}) {
		// If the terminal supports colours, and the user hasn't set anything, then default to a sensible default
		if (DocpadUtil.getFlagTTY()) {
			if (!process.argv.includes('--no-colors')) {
				opts.colors = true
			}
			else {
				opts.colors = false
			}
		// If the terminal doesn't support colours, then over-write whatever the user set
		}
		else {
			opts.colors = false
		}

		// Inspect and return
		return util.inspect(obj, opts)
	}

	/**
	 * Are we using standard encoding?
	 * @private
	 * @method getFlagStandardEncoding
	 * @param {String} encoding
	 * @return {Boolean}
	 */
	static getFlagStandardEncoding (encoding) {
		return (['ascii', 'utf8', 'utf-8'].includes(encoding.toLowerCase()))
	}


	/**
	 * Get Local DocPad Installation Executable - ie
	 * not the global installation
	 * @private
	 * @method getLocalDocPadExecutable
	 * @return {String} the path to the local DocPad executable
	 */
	static getLocalDocPadExecutable () {
		return pathUtil.join(process.cwd(), 'node_modules', 'docpad', 'bin', 'docpad')
	}

	/**
	 * Is Local DocPad Installation
	 * @private
	 * @method getFlagLocalDocPadExecutable
	 * @return {Boolean}
	 */
	static getFlagLocalDocPadExecutable () {
		return (process.argv.includes(DocpadUtil.getLocalDocPadExecutable()))
	}

	/**
	 * Does the local DocPad Installation Exist?
	 * @private
	 * @method getLocalDocPadExecutableExistance
	 * @return {Boolean}
	 */
	static getLocalDocPadExecutableExistance () {
		return safefs.existsSync(DocpadUtil.getLocalDocPadExecutable()) === true
	}

	/**
	 * Spawn Local DocPad Executable
	 * @private
	 * @method startLocalDocPadExecutable
	 * @param {Function} next
	 * @return {Object} don't know what
	 */
	static startLocalDocPadExecutable (next) {
		const args = process.argv.slice(2)
		const command = ['node', DocpadUtil.getLocalDocPadExecutable()].concat(args)
		return safeps.spawn(command, {stdio: 'inherit'}, (err) => {
			if (err) {
				if (next) {
					next(err)
				}
				else {
					const message = `An error occured within the child DocPad instance: ${err.message}\n`
					DocpadUtil.writeStderr(message)
				}
			}
			else if (typeof next === 'function') {
				next()
			}
		})
	}


	/**
	 * get a filename without the extension
	 * @method getBasename
	 * @param {String} filename
	 * @return {String} base name
	 */
	static getBasename (filename) {
		let basename
		if (filename[0] === '.') {
			basename = filename.replace(/^(\.[^.]+)\..*$/, '$1')
		}
		else {
			basename = filename.replace(/\..*$/, '')
		}
		return basename
	}


	/**
	 * Get the extensions of a filename
	 * @method getExtensions
	 * @param {String} filename
	 * @return {Array} array of string
	 */
	static getExtensions (filename) {
		const extensions = filename.split(/\./g).slice(1)
		return extensions
	}


	/**
	 * Get the extension from a bunch of extensions
	 * @method getExtension
	 * @param {Array} extensions
	 * @return {String} the extension
	 */
	static getExtension (extensions) {
		let extension
		if (!typeChecker.isArray(extensions)) {
			extensions = DocpadUtil.getExtensions(extensions)
		}

		if (extensions.length !== 0) {
			extension = extensions.slice(-1)[0] || null
		}
		else {
			extension = null
		}

		return extension
	}

	/**
	 * Get the directory path.
	 * Wrapper around the node.js path.dirname method
	 * @method getDirPath
	 * @param {String} path
	 * @return {String}
	 */
	static getDirPath (path) {
		return pathUtil.dirname(path) || ''
	}

	/**
	 * Get the file name.
	 * Wrapper around the node.js path.basename method
	 * @method getFilename
	 * @param {String} path
	 * @return {String}
	 */
	static getFilename (path) {
		return pathUtil.basename(path)
	}

	/**
	 * Get the DocPad out file name
	 * @method getOutFilename
	 * @param {String} basename
	 * @param {String} extension
	 * @return {String}
	 */
	static getOutFilename (basename, extension) {
		if (basename === (`.${extension}`)) {  // prevent: .htaccess.htaccess
			return basename
		}
		else {
			return basename + (extension ? `.${extension}` : '')
		}
	}

	/**
	 * Get the URL
	 * @method getUrl
	 * @param {String} relativePath
	 * @return {String}
	 */
	static getUrl (relativePath) {
		return `/${relativePath.replace(/[\\]/g, '/')}`
	}

	/**
	 * Get the post slug from the URL
	 * @method getSlug
	 * @param {String} relativeBase
	 * @return {String} the slug
	 */
	static getSlug (relativeBase) {
		return balUtil.generateSlugSync(relativeBase)
	}

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
	 * @returns {Object} The class instance itself
	 */
	static action (action, opts, next) {
		// Prepare
		let actionMethod, actions, actionTaskOrGroup, err;
		[opts, next] = extractOptsAndCallback(opts, next)
		const locale = DocpadUtil.getLocale()
		const run = opts.run != null ? opts.run : true
		const runner = opts.runner != null ? opts.runner : DocpadUtil.getActionRunner()

		/* console.log(`Util.action: -> action:${action}`);
		console.log("Util.action: -> opts:");
		console.log(opts);
		console.log(`Util.action: -> next:${next}`);*/

		// Array?
		if (Array.isArray(action)) {
			actions = action
		}
		else {
			actions = action.split(/[,\s]+/g)
		}

		// Clean actions
		actions = uniq(compact(actions))

		// Exit if we have no actions
		if (actions.length === 0) {
			err = new Error(locale.actionEmpty)
			return next(err)
		}

		// We have multiple actions
		if (actions.length > 1) {
			actionTaskOrGroup = runner.createTaskGroup(`actions bundle: ${actions.join(' ')}`)

			for (action of actions) {
				// Fetch
				actionMethod = DocpadUtil[action].bind(DocpadUtil)

				// Check
				if (!actionMethod) {
					err = new Error(util.format(locale.actionNonexistant, action))
					return next(err)
				}

				// Task
				const task = actionTaskOrGroup.createTask(action, actionMethod, {args: [opts]})
				actionTaskOrGroup.addTask(task)
			}

		// We have single actions
		}
		else {
			// Fetch the action
			action = actions[0]

			// Fetch
			actionMethod = DocpadUtil[action].bind(DocpadUtil)

			// Check
			if (!actionMethod) {
				err = new Error(util.format(locale.actionNonexistant, action))
				return next(err)
			}

			// Task
			actionTaskOrGroup = runner.createTask(action, actionMethod, {args: [opts]})
		}

		// Create our runner task
		const runnerTask = runner.createTask(`runner task for action: ${action}`, (continueWithRunner) => {
			// Add our listener for our action
			actionTaskOrGroup.done((...args) => {
				// If we have a completion callback, let it handle the error
				if (next) {
					next(...args)
					args[0] = null
				}

				// Continue with our runner
				continueWithRunner(...args)
			})

			// Run our action
			actionTaskOrGroup.run()
		})

		// Add it and run it
		runner.addTask(runnerTask)
		if (run === true) {
			runner.run()
		}

		// Chain
		return DocpadUtil
	}
}
