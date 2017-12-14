/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS104: Avoid inline assignments
 * DS203: Remove `|| {}` from converted for-own loops
 * DS204: Change includes calls to have a more natural evaluation order
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// =====================================
// Requires

// Standard Library
const util = require('util');
const pathUtil = require('path');

// External
const isTextOrBinary = require('istextorbinary');
const typeChecker = require('typechecker');
const safefs = require('safefs');
const mime = require('mime');
const extendr = require('extendr');
const extractOptsAndCallback = require('extract-opts');

// Optional
let jschardet = null;
let encodingUtil = null;

// Local
const {Model} = require('../base');
const docpadUtil = require('../util');


// =====================================
// Classes

/**
 * The FileModel class is DocPad's representation
 * of a file in the file system.
 * Extends the DocPad Model class
 * https://github.com/docpad/docpad/blob/master/src/lib/base.coffee#L49.
 * FileModel manages the loading
 * of a file and parsing both the content and the metadata (if any).
 * Once loaded, the content, metadata and file stat (file info)
 * properties of the FileModel are populated, as well
 * as a number of DocPad specific attributes and properties.
 * Typically we do not need to create FileModels ourselves as
 * DocPad handles all of that. But it is possible that a plugin
 * may need to manually create FileModels for some reason.
 *
 *	attrs =
 *		fullPath: 'file/path/to/somewhere'
 *	opts = {}
 *	#we only really need the path to the source file to create
 *	#a new file model
 *	model = new FileModel(attrs, opts)
 *
 * The FileModel forms the base class for the DocPad DocumentModel class.
 * @class FileModel
 * @constructor
 * @extends Model
 */
class FileModel extends Model {
	constructor(...args) {
		{
		  // Hack: trick Babel/TypeScript into allowing this before super.
		  if (false) { super(); }
		  let thisFn = (() => { this; }).toString();
		  let thisName = thisFn.slice(thisFn.indexOf('{') + 1, thisFn.indexOf(';')).trim();
		  eval(`${thisName} = this;`);
		}
		this.action = this.action.bind(this);
		super(...args);
	}

	static initClass() {
	
		// ---------------------------------
		// Properties
	
		/**
		 * The file model class. This should
		 * be overridden in any descending classes.
		 * @private
		 * @property {Object} klass
		 */
		this.prototype.klass = FileModel;
	
		/**
		 * String name of the model type.
		 * In this case, 'file'. This should
		 * be overridden in any descending classes.
		 * @private
		 * @property {String} type
		 */
		this.prototype.type = 'file';
	
		/**
		 * Task Group Class
		 * @private
		 * @property {Object} TaskGroup
		 */
		this.prototype.TaskGroup = null;
	
		/**
		 * The out directory path to put the relative path.
		 * @property {String} rootOutDirPath
		 */
		this.prototype.rootOutDirPath = null;
	
		/**
		 * Whether or not we should detect encoding
		 * @property {Boolean} detectEncoding
		 */
		this.prototype.detectEncoding = false;
	
		/**
		 * Node.js file stat object.
		 * https://nodejs.org/api/fs.html#fs_class_fs_stats.
		 * Basically, information about a file, including file
		 * dates and size.
		 * @property {Object} stat
		 */
		this.prototype.stat = null;
	
		/**
		 * File buffer. Node.js Buffer object.
		 * https://nodejs.org/api/buffer.html#buffer_class_buffer.
		 * Provides methods for dealing with binary data directly.
		 * @property {Object} buffer
		 */
		this.prototype.buffer = null;
	
		/**
		 * Buffer time.
		 * @property {Object} bufferTime
		 */
		this.prototype.bufferTime = null;
	
		/**
		 * The parsed file meta data (header).
		 * Is a Model instance.
		 * @private
		 * @property {Object} meta
		 */
		this.prototype.meta = null;
	
		/**
		 * Locale information for the file
		 * @private
		 * @property {Object} locale
		 */
		this.prototype.locale = null;
	
	
		// ---------------------------------
		// Attributes
	
		/**
		 * The default attributes for any file model.
		 * @private
		 * @property {Object}
		 */
		this.prototype.defaults = {
	
			// ---------------------------------
			// Automaticly set variables
	
			// The unique document identifier
			id: null,
	
			// The file's name without the extension
			basename: null,
	
			// The out file's name without the extension
			outBasename: null,
	
			// The file's last extension
			// "hello.md.eco" -> "eco"
			extension: null,
	
			// The extension used for our output file
			outExtension: null,
	
			// The file's extensions as an array
			// "hello.md.eco" -> ["md","eco"]
			extensions: null,  // Array
	
			// The file's name with the extension
			filename: null,
	
			// The full path of our source file, only necessary if called by @load
			fullPath: null,
	
			// The full directory path of our source file
			fullDirPath: null,
	
			// The output path of our file
			outPath: null,
	
			// The output path of our file's directory
			outDirPath: null,
	
			// The file's name with the rendered extension
			outFilename: null,
	
			// The relative path of our source file (with extensions)
			relativePath: null,
	
			// The relative output path of our file
			relativeOutPath: null,
	
			// The relative directory path of our source file
			relativeDirPath: null,
	
			// The relative output path of our file's directory
			relativeOutDirPath: null,
	
			// The relative base of our source file (no extension)
			relativeBase: null,
	
			// The relative base of our out file (no extension)
			relativeOutBase: null,
	
			// The MIME content-type for the source file
			contentType: null,
	
			// The MIME content-type for the out file
			outContentType: null,
	
			// The date object for when this document was created
			ctime: null,
	
			// The date object for when this document was last modified
			mtime: null,
	
			// The date object for when this document was last rendered
			rtime: null,
	
			// The date object for when this document was last written
			wtime: null,
	
			// Does the file actually exist on the file system
			exists: null,
	
	
			// ---------------------------------
			// Content variables
	
			// The encoding of the file
			encoding: null,
	
			// The raw contents of the file, stored as a String
			source: null,
	
			// The contents of the file, stored as a String
			content: null,
	
	
			// ---------------------------------
			// User set variables
	
			// The tags for this document
			tags: null,  // CSV/Array
	
			// Whether or not we should render this file
			render: false,
	
			// Whether or not we should write this file to the output directory
			write: true,
	
			// Whether or not we should write this file to the source directory
			writeSource: false,
	
			// Whether or not this file should be re-rendered on each request
			dynamic: false,
	
			// The title for this document
			// Useful for page headings
			title: null,
	
			// The name for this document, defaults to the outFilename
			// Useful for navigation listings
			name: null,
	
			// The date object for this document, defaults to mtime
			date: null,
	
			// The generated slug (url safe seo title) for this document
			slug: null,
	
			// The url for this document
			url: null,
	
			// Alternative urls for this document
			urls: null,  // Array
	
			// Whether or not we ignore this file
			ignored: false,
	
			// Whether or not we should treat this file as standalone (that nothing depends on it)
			standalone: false
		};
	
	
		// ---------------------------------
		// Actions
	
		/**
		 * The action runner instance bound to DocPad
		 * @private
		 * @property {Object} actionRunnerInstance
		 */
		this.prototype.actionRunnerInstance = null;
	}
	/**
	 * Get the file's locale information
	 * @method getLocale
	 * @return {Object} the locale
	 */
	getLocale() { return this.locale; }

	/**
	 * Get Options. Returns an object containing
	 * the properties detectEncoding, rootOutDirPath
	 * locale, stat, buffer, meta and TaskGroup.
	 * @private
	 * @method getOptions
	 * @return {Object}
	 */
	// @TODO: why does this not use the isOption way?
	getOptions() {
		return {detectEncoding: this.detectEncoding, rootOutDirPath: this.rootOutDirPath, locale: this.locale, stat: this.stat, buffer: this.buffer, meta: this.meta, TaskGroup: this.TaskGroup};
	}

	/**
	 * Checks whether the passed key is one
	 * of the options.
	 * @private
	 * @method isOption
	 * @param {String} key
	 * @return {Boolean}
	 */
	isOption(key) {
		const names = ['detectEncoding', 'rootOutDirPath', 'locale', 'stat', 'data', 'buffer', 'meta', 'TaskGroup'];
		const result = Array.from(names).includes(key);
		return result;
	}

	/**
	 * Extract Options.
	 * @private
	 * @method extractOptions
	 * @param {Object} attrs
	 * @return {Object} the options object
	 */
	extractOptions(attrs) {
		// Prepare
		const result = {};

		// Extract
		for (let key of Object.keys(attrs || {})) {
			const value = attrs[key];
			if (this.isOption(key)) {
				result[key] = value;
				delete attrs[key];
			}
		}

		// Return
		return result;
	}

	/**
	 * Set the options for the file model.
	 * Valid properties for the attrs parameter:
	 * TaskGroup, detectEncoding, rootOutDirPath,
	 * locale, stat, data, buffer, meta.
	 * @method setOptions
	 * @param {Object} [attrs={}]
	 */
	setOptions(attrs) {
		// TaskGroup
		if (attrs == null) { attrs = {}; }
		if (attrs.TaskGroup != null) {
			this.TaskGroup = attrs.TaskGroup;
			delete this.attributes.TaskGroup;
		}

		// Root Out Path
		if (attrs.detectEncoding != null) {
			this.rootOutDirPath = attrs.detectEncoding;
			delete this.attributes.detectEncoding;
		}

		// Root Out Path
		if (attrs.rootOutDirPath != null) {
			this.rootOutDirPath = attrs.rootOutDirPath;
			delete this.attributes.rootOutDirPath;
		}

		// Locale
		if (attrs.locale != null) {
			this.locale = attrs.locale;
			delete this.attributes.locale;
		}

		// Stat
		if (attrs.stat != null) {
			this.setStat(attrs.stat);
			delete this.attributes.stat;
		}

		// Data
		if (attrs.data != null) {
			this.setBuffer(attrs.data);
			delete this.attributes.data;
		}

		// Buffer
		if (attrs.buffer != null) {
			this.setBuffer(attrs.buffer);
			delete this.attributes.buffer;
		}

		// Meta
		if (attrs.meta != null) {
			this.setMeta(attrs.meta);
			delete this.attributes.meta;
		}

		// Chain
		return this;
	}

	/**
	 * Clone the model and return the newly cloned model.
	 * @method clone
	 * @return {Object} cloned file model
	 */
	clone() {
		// Fetch
		const attrs = this.getAttributes();
		const opts = this.getOptions();

		// Clean up
		delete attrs.id;
		delete attrs.meta.id;
		delete opts.meta.id;
		delete opts.meta.attributes.id;

		// Clone
		const clonedModel = new this.klass(attrs, opts);

		// Emit clone event so parent can re-attach listeners
		this.emit('clone', clonedModel);

		// Return
		return clonedModel;
	}



	// ---------------------------------
	// Helpers

	/**
	 * File encoding helper
	 * opts = {path, to, from, content}
	 * @private
	 * @method encode
	 * @param {Object} opts
	 * @return {Object} encoded result
	 */
	encode(opts) {
		// Prepare
		const locale = this.getLocale();
		let result = opts.content;
		if (opts.to == null) { opts.to = 'utf8'; }
		if (opts.from == null) { opts.from = 'utf8'; }

		// Import optional dependencies
		try { if (encodingUtil == null) { encodingUtil = require('encoding'); } } catch (error) {}

		// Convert
		if (encodingUtil != null) {
			this.log('info', util.format(locale.fileEncode, opts.to, opts.from, opts.path));
			try {
				result = encodingUtil.convert(opts.content, opts.to, opts.from);
			} catch (err) {
				this.log('warn', util.format(locale.fileEncodeConvertError, opts.to, opts.from, opts.path));
			}
		} else {
			this.log('warn', util.format(locale.fileEncodeConvertError, opts.to, opts.from, opts.path));
		}

		// Return
		return result;
	}

	/**
	 * Set the file model's buffer.
	 * Creates a new node.js buffer
	 * object if a buffer object is
	 * is not passed as the parameter
	 * @method setBuffer
	 * @param {Object} [buffer]
	 */
	setBuffer(buffer) {
		if (!Buffer.isBuffer(buffer)) { buffer = new Buffer(buffer); }
		this.bufferTime = this.get('mtime') || new Date();
		this.buffer = buffer;
		return this;
	}

	/**
	 * Get the file model's buffer object.
	 * Returns a node.js buffer object.
	 * @method getBuffer
	 * @return {Object} node.js buffer object
	 */
	getBuffer() {
		return this.buffer;
	}

	/**
	 * Is Buffer Outdated
	 * True if there is no buffer OR the buffer time is outdated
	 * @method isBufferOutdated
	 * @return {Boolean}
	 */
	isBufferOutdated() {
		return ((this.buffer != null) === false) || (this.bufferTime < (this.get('mtime') || new Date()));
	}

	/**
	 * Set the node.js file stat.
	 * @method setStat
	 * @param {Object} stat
	 */
	setStat(stat) {
		this.stat = stat;
		this.set({
			ctime: new Date(stat.ctime),
			mtime: new Date(stat.mtime)
		});
		return this;
	}

	/**
	 * Get the node.js file stat.
	 * @method getStat
	 * @return {Object} the file stat
	 */
	getStat() {
		return this.stat;
	}

	/**
	 * Get the file model attributes.
	 * By default the attributes will be
	 * dereferenced from the file model.
	 * To maintain a reference, pass false
	 * as the parameter. The returned object
	 * will NOT contain the file model's ID attribute.
	 * @method getAttributes
	 * @param {Object} [dereference=true]
	 * @return {Object}
	 */
	//NOTE: will the file model's ID be deleted if
	//dereference=false is passed??
	getAttributes(dereference) {
		if (dereference == null) { dereference = true; }
		const attrs = this.toJSON(dereference);
		delete attrs.id;
		return attrs;
	}

	/**
	 * Get the file model attributes.
	 * By default the attributes will
	 * maintain a reference to the file model.
	 * To return a dereferenced object, pass true
	 * as the parameter. The returned object
	 * will contain the file model's ID attribute.
	 * @method toJSON
	 * @param {Object} [dereference=false]
	 * @return {Object}
	 */
	toJSON(dereference) {
		if (dereference == null) { dereference = false; }
		let data = super.toJSON(dereference);
		data.meta = this.getMeta().toJSON();
		if (dereference === true) { data = extendr.dereferenceJSON(data); }
		return data;
	}

	/**
	 * Get the file model metadata object.
	 * Optionally pass a list of metadata property
	 * names corresponding to those properties that
	 * you want returned.
	 * @method getMeta
	 * @param {Object} [args...]
	 * @return {Object}
	 */
	getMeta(...args) {
		if (this.meta === null) { this.meta = new Model(); }
		if (args.length) {
			return this.meta.get(...Array.from(args || []));
		} else {
			return this.meta;
		}
	}

	/**
	 * Assign attributes and options to the file model.
	 * @method set
	 * @param {Array} attrs the attributes to be applied
	 * @param {Object} opts the options to be applied
	 */
	set(attrs,opts) {
		// Check
		let left;
		if (typeChecker.isString(attrs)) {
			const newAttrs = {};
			newAttrs[attrs] = opts;
			return this.set(newAttrs, opts);
		}

		// Prepare
		attrs = (left = (typeof attrs.toJSON === 'function' ? attrs.toJSON() : undefined)) != null ? left : attrs;

		// Extract options
		const options = this.extractOptions(attrs);

		// Perform the set
		super.set(attrs, opts);

		// Apply the options
		this.setOptions(options, opts);

		// Chain
		return this;
	}

	/**
	 * Set defaults. Apply default attributes
	 * and options to the file model
	 * @method setDefaults
	 * @param {Object} attrs the attributes to be applied
	 * @param {Object} opts the options to be applied
	 */
	setDefaults(attrs,opts) {
		// Prepare
		let left;
		attrs = (left = (typeof attrs.toJSON === 'function' ? attrs.toJSON() : undefined)) != null ? left : attrs;

		// Extract options
		const options = this.extractOptions(attrs);

		// Apply
		super.setDefaults(attrs, opts);

		// Apply the options
		this.setOptions(options, opts);

		// Chain
		return this;
	}

	/**
	 * Set the file model meta data,
	 * attributes and options in one go.
	 * @method setMeta
	 * @param {Object} attrs the attributes to be applied
	 * @param {Object} opts the options to be applied
	 */
	setMeta(attrs,opts) {
		// Prepare
		let left;
		attrs = (left = (typeof attrs.toJSON === 'function' ? attrs.toJSON() : undefined)) != null ? left : attrs;

		// Extract options
		const options = this.extractOptions(attrs);

		// Apply
		this.getMeta().set(attrs, opts);
		this.set(attrs, opts);

		// Apply the options
		this.setOptions(options, opts);

		// Chain
		return this;
	}


	/**
	 * Set the file model meta data defaults
	 * @method setMetaDefaults
	 * @param {Object} attrs the attributes to be applied
	 * @param {Object} opts the options to be applied
	 */
	setMetaDefaults(attrs,opts) {
		// Prepare
		let left;
		attrs = (left = (typeof attrs.toJSON === 'function' ? attrs.toJSON() : undefined)) != null ? left : attrs;

		// Extract options
		const options = this.extractOptions(attrs);

		// Apply
		this.getMeta().setDefaults(attrs, opts);
		this.setDefaults(attrs, opts);

		// Apply the options
		this.setOptions(options, opts);

		// Chain
		return this;
	}

	/**
	 * Get the file name. Depending on the
	 * parameters passed this will either be
	 * the file model's filename property or,
	 * the filename determined from the fullPath
	 * or relativePath property. Valid values for
	 * the opts parameter are: fullPath, relativePath
	 * or filename. Format: {filename}
	 * @method getFilename
	 * @param {Object} [opts={}]
	 * @return {String}
	 */
	getFilename(opts) {
		// Prepare
		if (opts == null) { opts = {}; }
		const {fullPath,relativePath,filename} = opts;

		// Determine
		let result = (filename != null ? filename : this.get('filename'));
		if (!result) {
			result = (fullPath != null ? fullPath : this.get('fullPath')) || (relativePath != null ? relativePath : this.get('relativePath'));
			if (result) { result = pathUtil.basename(result); }
		}
		if (!result) { result = null; }

		// REturn
		return result;
	}

	/**
	 * Get the file path. Depending on the
	 * parameters passed this will either be
	 * the file model's fullPath property, the
	 * relativePath property or the filename property.
	 * Valid values for the opts parameter are:
	 * fullPath, relativePath
	 * or filename. Format: {fullPath}
	 * @method getFilePath
	 * @param {Object} [opts={}]
	 * @return {String}
	 */
	getFilePath(opts) {
		// Prepare
		if (opts == null) { opts = {}; }
		const {fullPath,relativePath,filename} = opts;

		// Determine
		const result = (fullPath != null ? fullPath : this.get('fullPath')) || (relativePath != null ? relativePath : this.get('relativePath')) || (filename != null ? filename : this.get('filename')) || null;

		// Return
		return result;
	}

	/**
	 * Get file extensions. Depending on the
	 * parameters passed this will either be
	 * the file model's extensions property or
	 * the extensions extracted from the file model's
	 * filename property. The opts parameter is passed
	 * in the format: {extensions,filename}.
	 * @method getExtensions
	 * @param {Object} opts
	 * @return {Array} array of extension names
	 */
	getExtensions({extensions,filename}) {
		if (!extensions) { extensions = this.get('extensions') || null; }
		if ((extensions || []).length === 0) {
			filename = this.getFilename({filename});
			if (filename) {
				extensions = docpadUtil.getExtensions(filename);
			}
		}
		return extensions || null;
	}

	/**
	 * Get the file content. This will be
	 * the text content if loaded or the file buffer object.
	 * @method getContent
	 * @return {String or Object}
	 */
	getContent() {
		return this.get('content') || this.getBuffer();
	}

	/**
	 * Get the file content for output.
	 * @method getOutContent
	 * @return {String or Object}
	 */
	getOutContent() {
		return this.getContent();
	}

	/**
	 * Is this a text file? ie - not
	 * a binary file.
	 * @method isText
	 * @return {Boolean}
	 */
	isText() {
		return this.get('encoding') !== 'binary';
	}

	/**
	 * Is this a binary file?
	 * @method isBinary
	 * @return {Boolean}
	 */
	isBinary() {
		return this.get('encoding') === 'binary';
	}

	/**
	 * Set the url for the file
	 * @method setUrl
	 * @param {String} url
	 */
	setUrl(url) {
		this.addUrl(url);
		this.set({url});
		return this;
	}

	/**
	 * A file can have multiple urls.
	 * This method adds either a single url
	 * or an array of urls to the file model.
	 * @method addUrl
	 * @param {String or Array} url
	 */
	addUrl(url) {
		// Multiple Urls
		if (url instanceof Array) {
			for (let newUrl of Array.from(url)) {
				this.addUrl(newUrl);
			}

		// Single Url
		} else if (url) {
			let found = false;
			const urls = this.get('urls');
			for (let existingUrl of Array.from(urls)) {
				if (existingUrl === url) {
					found = true;
					break;
				}
			}
			if (!found) { urls.push(url); }
			this.trigger('change:urls', this, urls, {});
			this.trigger('change', this, {});
		}

		// Chain
		return this;
	}

	/**
	 * Removes a url from the file
	 * model (files can have more than one url).
	 * @method removeUrl
	 * @param {Object} userUrl the url to be removed
	 */
	removeUrl(userUrl) {
		const urls = this.get('urls');
		for (let index = 0; index < urls.length; index++) {
			const url = urls[index];
			if (url === userUrl) {
				urls.splice(index,1);
				break;
			}
		}
		return this;
	}

	/**
	 * Get a file path.
	 * If the relativePath parameter starts with `.` then we get the
	 * path in relation to the document that is calling it.
	 * Otherwise we just return it as normal
	 * @method getPath
	 * @param {String} relativePath
	 * @param {String} parentPath
	 * @return {String}
	 */
	getPath(relativePath, parentPath) {
		let path;
		if (/^\./.test(relativePath)) {
			const relativeDirPath = this.get('relativeDirPath');
			path = pathUtil.join(relativeDirPath, relativePath);
		} else {
			if (parentPath) {
				path = pathUtil.join(parentPath, relativePath);
			} else {
				path = relativePath;
			}
		}
		return path;
	}
	/**
	 * Get the action runner instance bound to DocPad
	 * @method getActionRunner
	 * @return {Object}
	 */
	getActionRunner() { return this.actionRunnerInstance; }
	/**
	 * Apply an action with the supplied arguments.
	 * @method action
	 * @param {Object} args...
	 */
	action(...args) { return docpadUtil.action.apply(this, args); }

	/**
	 * Initialize the file model with the passed
	 * attributes and options. Emits the init event.
	 * @method initialize
	 * @param {Object} attrs the file model attributes
	 * @param {Object} [opts={}] the file model options
	 */
	initialize(attrs,opts) {
		// Defaults
		if (opts == null) { opts = {}; }
		const file = this;
		if (this.attributes == null) { this.attributes = {}; }
		if (this.attributes.extensions == null) { this.attributes.extensions = []; }
		if (this.attributes.urls == null) { this.attributes.urls = []; }
		const now = new Date();
		if (this.attributes.ctime == null) { this.attributes.ctime = now; }
		if (this.attributes.mtime == null) { this.attributes.mtime = now; }

		// Id
		if (this.id == null) { this.id = this.attributes.id != null ? this.attributes.id : (this.attributes.id = this.cid); }

		// Options
		this.setOptions(opts);

		// Error
		if (((this.rootOutDirPath != null) === false) || ((this.locale != null) === false)) {
			throw new Error("Use docpad.createModel to create the file or document model");
		}

		// Create our action runner
		this.actionRunnerInstance = this.TaskGroup("file action runner", {abortOnError: false, destroyOnceDone: false}).whenDone(function(err) {
			if (err) { return file.emit('error', err); }
		});

		// Apply
		this.emit('init');

		// Chain
		return this;
	}

	/**
	 * Load the file from the file system.
	 * If the fullPath exists, load the file.
	 * If it doesn't, then parse and normalize the file.
	 * Optionally pass file options as a parameter.
	 * @method load
	 * @param {Object} [opts={}]
	 * @param {Function} next callback
	 */
	load(opts,next) {
		// Prepare
		if (opts == null) { opts = {}; }
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));
		const file = this;
		if (opts.exists == null) { opts.exists = null; }

		// Fetch
		const fullPath = this.get('fullPath');
		const filePath = this.getFilePath({fullPath});

		// Apply options
		if (opts.exists != null) { file.set({exists: opts.exists}); }
		if (opts.stat != null) { file.setStat(opts.stat); }
		if (opts.buffer != null) { file.setBuffer(opts.buffer); }

		// Tasks
		const tasks = this.TaskGroup(`load tasks for file: ${filePath}`, {next})
			.on('item.run', item => file.log("debug", `${item.getConfig().name}: ${file.type}: ${filePath}`));

		// Detect the file
		tasks.addTask("Detect the file", function(complete) {
			if (fullPath && (opts.exists === null)) {
				return safefs.exists(fullPath, function(exists) {
					opts.exists = exists;
					file.set({exists: opts.exists});
					return complete();
				});
			} else {
				return complete();
			}
		});

		tasks.addTask("Stat the file and cache the result", function(complete) {
			// Otherwise fetch new stat
			if (fullPath && opts.exists && ((opts.stat != null) === false)) {
				return safefs.stat(fullPath, function(err,fileStat) {
					if (err) { return complete(err); }
					file.setStat(fileStat);
					return complete();
				});
			} else {
				return complete();
			}
		});

		// Process the file
		tasks.addTask("Read the file and cache the result", function(complete) {
			// Otherwise fetch new buffer
			if (fullPath && opts.exists && ((opts.buffer != null) === false) && file.isBufferOutdated()) {
				return safefs.readFile(fullPath, function(err,buffer) {
					if (err) { return complete(err); }
					file.setBuffer(buffer);
					return complete();
				});
			} else {
				return complete();
			}
		});

		tasks.addTask("Load -> Parse", complete => file.parse(complete));

		tasks.addTask("Parse -> Normalize", complete => file.normalize(complete));

		tasks.addTask("Normalize -> Contextualize", complete => file.contextualize(complete));

		// Run the tasks
		tasks.run();

		// Chain
		return this;
	}

	/**
	 * Parse our buffer and extract meaningful data from it.
	 * next(err).
	 * @method parse
	 * @param {Object} [opts={}]
	 * @param {Object} next callback
	 */
	parse(opts,next) {
		// Prepare
		let content, source;
		if (opts == null) { opts = {}; }
		[opts,next] = Array.from(extractOptsAndCallback(opts, next));
		let buffer = this.getBuffer();
		const relativePath = this.get('relativePath');
		let encoding = opts.encoding || this.get('encoding') || null;
		const changes = {};

		// Detect Encoding
		if ((buffer && ((encoding != null) === false)) || (opts.reencode === true)) {
			const isText = isTextOrBinary.isTextSync(relativePath, buffer);

			// Text
			if (isText === true) {
				// Detect source encoding if not manually specified
				if (this.detectEncoding) {
					if (jschardet == null) { jschardet = require('jschardet'); }
					if (encoding == null) { encoding = __guard__(jschardet.detect(buffer), x => x.encoding); }
				}

				// Default the encoding
				if (!encoding) { encoding = 'utf8'; }

				// Convert into utf8
				if (docpadUtil.isStandardEncoding(encoding) === false) {
					buffer = this.encode({
						path: relativePath,
						to: 'utf8',
						from: encoding,
						content: buffer
					});
				}

				// Apply
				changes.encoding = encoding;

			// Binary
			} else {
				// Set
				encoding = (changes.encoding = 'binary');
			}
		}

		// Binary
		if (encoding === 'binary') {
			// Set
			content = (source = '');

			// Apply
			changes.content = content;
			changes.source = source;

		// Text
		} else {
			// Default
			if ((encoding != null) === false) { encoding = (changes.encoding = 'utf8'); }

			// Set
			source = (buffer != null ? buffer.toString('utf8') : undefined) || '';
			content = source;

			// Apply
			changes.content = content;
			changes.source = source;
		}

		// Apply
		this.set(changes);

		// Next
		next();
		return this;
	}

	/**
	 * Normalize any parsing we have done, because if a value has
	 * updates it may have consequences on another value.
	 * This will ensure everything is okay.
	 * next(err)
	 * @method normalize
	 * @param {Object} [opts={}]
	 * @param {Object} next callback
	 */
	normalize(opts,next) {
		// Prepare
		if (opts == null) { opts = {}; }
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));
		const changes = {};
		const meta = this.getMeta();
		const locale = this.getLocale();

		// App specified
		let filename = opts.filename || this.get('filename') || null;
		let relativePath = opts.relativePath || this.get('relativePath') || null;
		const fullPath = opts.fullPath || this.get('fullPath') || null;
		let mtime = opts.mtime || this.get('mtime') || null;

		// User specified
		let tags = opts.tags || meta.get('tags') || null;
		let date = opts.date || meta.get('date') || null;
		let name = opts.name || meta.get('name') || null;
		let slug = opts.slug || meta.get('slug') || null;
		const url = opts.url || meta.get('url') || null;
		let contentType = opts.contentType || meta.get('contentType') || null;
		let outContentType = opts.outContentType || meta.get('outContentType') || null;
		let outFilename = opts.outFilename || meta.get('outFilename') || null;
		let outExtension = opts.outExtension || meta.get('outExtension') || null;
		let outPath = opts.outPath || meta.get('outPath') || null;

		// Force specifeid
		let extensions = null;
		let extension = null;
		let basename = null;
		let outBasename = null;
		let relativeOutPath = null;
		let relativeDirPath = null;
		let relativeOutDirPath = null;
		let relativeBase = null;
		let relativeOutBase = null;
		let outDirPath = null;
		let fullDirPath = null;

		// filename
		changes.filename = (filename = this.getFilename({filename, relativePath, fullPath}));

		// check
		if (!filename) {
			const err = new Error(locale.filenameMissingError);
			return next(err);
		}

		// relativePath
		if (!relativePath && filename) {
			changes.relativePath = (relativePath = filename);
		}

		// force basename
		changes.basename = (basename = docpadUtil.getBasename(filename));

		// force extensions
		changes.extensions = (extensions = this.getExtensions({filename}));

		// force extension
		changes.extension = (extension = docpadUtil.getExtension(extensions));

		// force fullDirPath
		if (fullPath) {
			changes.fullDirPath = (fullDirPath = docpadUtil.getDirPath(fullPath));
		}

		// force relativeDirPath
		changes.relativeDirPath = (relativeDirPath = docpadUtil.getDirPath(relativePath));

		// force relativeBase
		changes.relativeBase = (relativeBase =
			relativeDirPath ?
				pathUtil.join(relativeDirPath, basename)
			:
				basename);

		// force contentType
		if (!contentType) {
			changes.contentType = (contentType = mime.lookup(fullPath || relativePath));
		}

		// adjust tags
		if (tags && (typeChecker.isArray(tags) === false)) {
			changes.tags = (tags = String(tags).split(/[\s,]+/));
		}

		// force date
		if (!date) {
			changes.date = (date = mtime || this.get('date') || new Date());
		}

		// force outFilename
		if (!outFilename && !outPath) {
			changes.outFilename = (outFilename = docpadUtil.getOutFilename(basename, outExtension || extensions.join('.')));
		}

		// force outPath
		if (!outPath) {
			changes.outPath = (outPath =
				this.rootOutDirPath ?
					pathUtil.resolve(this.rootOutDirPath, relativeDirPath, outFilename)
				:
					null);
		}
			// ^ we still do this set as outPath is a meta, and it may still be set as an attribute

		// refresh outFilename
		if (outPath) {
			changes.outFilename = (outFilename = docpadUtil.getFilename(outPath));
		}

		// force outDirPath
		changes.outDirPath = (outDirPath =
			outPath ?
				docpadUtil.getDirPath(outPath)
			:
				null);

		// force outBasename
		changes.outBasename = (outBasename = docpadUtil.getBasename(outFilename));

		// force outExtension
		changes.outExtension = (outExtension = docpadUtil.getExtension(outFilename));

		// force relativeOutPath
		changes.relativeOutPath = (relativeOutPath =
			outPath ?
				outPath.replace(this.rootOutDirPath, '').replace(/^[\/\\]/, '')
			:
				pathUtil.join(relativeDirPath, outFilename));

		// force relativeOutDirPath
		changes.relativeOutDirPath = (relativeOutDirPath = docpadUtil.getDirPath(relativeOutPath));

		// force relativeOutBase
		changes.relativeOutBase = (relativeOutBase = pathUtil.join(relativeOutDirPath, outBasename));

		// force name
		if (!name) {
			changes.name = (name = outFilename);
		}

		// force url
		const _defaultUrl = docpadUtil.getUrl(relativeOutPath);
		if (url) {
			this.setUrl(url);
			this.addUrl(_defaultUrl);
		} else {
			this.setUrl(_defaultUrl);
		}

		// force outContentType
		if (!outContentType && contentType) {
			changes.outContentType = (outContentType = mime.lookup(outPath || relativeOutPath) || contentType);
		}

		// force slug
		if (!slug) {
			changes.slug = (slug = docpadUtil.getSlug(relativeOutBase));
		}

		// Force date objects
		if (typeof wtime === 'string') { var wtime;
		changes.wtime = (wtime = new Date(wtime)); }
		if (typeof rtime === 'string') { var rtime;
		changes.rtime = (rtime = new Date(rtime)); }
		if (typeof ctime === 'string') { var ctime;
		changes.ctime = (ctime = new Date(ctime)); }
		if (typeof mtime === 'string') { changes.mtime = (mtime = new Date(mtime)); }
		if (typeof date === 'string') { changes.date  = (date  = new Date(date)); }

		// Apply
		this.set(changes);

		// Next
		next();
		return this;
	}

	/**
	 * Contextualize the data. In other words,
	 * put our data into the perspective of the bigger picture of the data.
	 * For instance, generate the url for it's rendered equivalant.
	 * next(err)
	 * @method contextualize
	 * @param {Object} [opts={}]
	 * @param {Object} next callback
	 */
	contextualize(opts,next) {
		// Prepare
		if (opts == null) { opts = {}; }
		[opts,next] = Array.from(extractOptsAndCallback(opts,next));

		// Forward
		next();
		return this;
	}

	/**
	 * Render this file. The file model output content is
	 * returned to the passed callback in the
	 * result (2nd) parameter. The file model itself is returned
	 * in the callback's document (3rd) parameter.
	 * next(err,result,document)
	 * @method render
	 * @param {Object} [opts={}]
	 * @param {Object} next callback
	 */
	render(opts,next) {
		// Prepare
		if (opts == null) { opts = {}; }
		[opts,next] = Array.from(extractOptsAndCallback(opts, next));
		const file = this;

		// Apply
		file.attributes.rtime = new Date();

		// Forward
		next(null, file.getOutContent(), file);
		return this;
	}


	// ---------------------------------
	// CRUD

	/**
	 * Write the out file. The out file
	 * may be different from the input file.
	 * Often the input file is transformed in some way
	 * and saved as another file format. A common example
	 * is transforming a markdown input file to a HTML
	 * output file.
	 * next(err)
	 * @method write
	 * @param {Object} opts
	 * @param {Function} next callback
	 */
	write(opts,next) {
		// Prepare
		let needle;
		[opts,next] = Array.from(extractOptsAndCallback(opts, next));
		const file = this;
		const locale = this.getLocale();

		// Fetch
		if (!opts.path) { opts.path = file.get('outPath'); }
		if (!opts.encoding) { opts.encoding = file.get('encoding') || 'utf8'; }
		if (!opts.content) { opts.content = file.getOutContent(); }
		if (!opts.type) { opts.type = 'out file'; }

		// Check
		// Sometimes the out path could not be set if we are early on in the process
		if (!opts.path) {
			next();
			return this;
		}

		// Convert utf8 to original encoding
		if ((needle = opts.encoding.toLowerCase(), !['ascii','utf8','utf-8','binary'].includes(needle))) {
			opts.content = this.encode({
				path: opts.path,
				to: opts.encoding,
				from: 'utf8',
				content: opts.content
			});
		}

		// Log
		file.log('debug', util.format(locale.fileWrite, opts.type, opts.path, opts.encoding));

		// Write data
		safefs.writeFile(opts.path, opts.content, function(err) {
			// Check
			if (err) { return next(err); }

			// Update the wtime
			if (opts.type === 'out file') {
				file.attributes.wtime = new Date();
			}

			// Log
			file.log('debug',  util.format(locale.fileWrote, opts.type, opts.path, opts.encoding));

			// Next
			return next();
		});

		// Chain
		return this;
	}

	/**
	 * Write the source file. Optionally pass
	 * the opts parameter to modify or set the file's
	 * path, content or type.
	 * next(err)
	 * @method writeSource
	 * @param {Object} [opts]
	 * @param {Object} next callback
	 */
	writeSource(opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts, next));
		const file = this;

		// Fetch
		if (!opts.path) { opts.path = file.get('fullPath'); }
		if (!opts.content) { opts.content = (file.getContent() || '').toString(''); }
		if (!opts.type) { opts.type = 'source file'; }

		// Write data
		this.write(opts, next);

		// Chain
		return this;
	}

	/**
	 * Delete the out file, perhaps ahead of regeneration.
	 * Optionally pass the opts parameter to set the file path or type.
	 * next(err)
	 * @method delete
	 * @param {Object} [opts]
	 * @param {Object} next callback
	 */
	'delete'(opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts, next));
		const file = this;
		const locale = this.getLocale();

		// Fetch
		if (!opts.path) { opts.path = file.get('outPath'); }
		if (!opts.type) { opts.type = 'out file'; }

		// Check
		// Sometimes the out path could not be set if we are early on in the process
		if (!opts.path) {
			next();
			return this;
		}

		// Log
		file.log('debug',  util.format(locale.fileDelete, opts.type, opts.path));

		// Check existance
		safefs.exists(opts.path, function(exists) {
			// Exit if it doesn't exist
			if (!exists) { return next(); }

			// If it does exist delete it
			return safefs.unlink(opts.path, function(err) {
				// Check
				if (err) { return next(err); }

				// Log
				file.log('debug', util.format(locale.fileDeleted, opts.type, opts.path));

				// Next
				return next();
			});
		});

		// Chain
		return this;
	}

	/**
	 * Delete the source file.
	 * Optionally pass the opts parameter to set the file path or type.
	 * next(err)
	 * @method deleteSource
	 * @param {Object} [opts]
	 * @param {Object} next callback
	 */
	deleteSource(opts,next) {
		// Prepare
		[opts,next] = Array.from(extractOptsAndCallback(opts, next));
		const file = this;

		// Fetch
		if (!opts.path) { opts.path = file.get('fullPath'); }
		if (!opts.type) { opts.type = 'source file'; }

		// Write data
		this.delete(opts, next);

		// Chain
		return this;
	}
}
FileModel.initClass();


// ---------------------------------
// Export
module.exports = FileModel;

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}