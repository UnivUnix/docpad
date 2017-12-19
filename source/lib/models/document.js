/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS203: Remove `|| {}` from converted for-own loops
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// =====================================
// Requires

// Standard Library
import * as util from 'util'
import * as pathUtil from 'path'
import {DocpadUtil} from '../util'

// External
import * as CSON from 'cson'
import * as YAML from 'yamljs'
import * as extendr from 'extendr'
import * as eachr from 'eachr'
import * as extractOptsAndCallback from 'extract-opts'

// Local
import {FileModel} from './file'

// =====================================
// Classes

/**
 * The DocumentModel class is DocPad's representation
 * of a website or project's content files. This can be
 * individual web pages or blog posts etc. Generally, this
 * is not other website files such as css files, images, or scripts -
 * unless there is a requirement to have DocPad do transformation on
 * these files.
 * Extends the DocPad FileModel class
 * https://github.com/docpad/docpad/blob/master/src/lib/models/file.coffee
 * DocumentModel primarily handles the rendering and parsing of document files.
 * This includes merging the document with layouts and managing the rendering
 * from one file extension to another. The class inherits many of the file
 * specific operations and DocPad specific attributes from the FileModel class.
 * However, it also overrides some parsing and file output operations contained
 * in the FileModel class.
 *
 * Typically we do not need to create DocumentModels ourselves as DocPad handles
 * all of that. Most of the time when we encounter DocumentModels is when
 * querying DocPad's document collections either in the docpad.coffee file or
 * from within a template.
 *
 * 	indexDoc = @getCollection('documents').findOne({relativeOutPath: 'index.html'})
 *
 * A plugin, however, may need to create a DocumentModel depending on its requirements.
 * In such a case it is wise to use the built in DocPad methods to do so, in particular
 * docpad.createModel
 *
 * 	#check to see if the document alread exists ie its an update
 * 	docModel = @docpad.getCollection('posts').findOne({slug: 'some-slug'})
 *
 * 	#if so, load the existing document ready for regeneration
 * 	if docModel
 * 		docModel.load()
 * 	else
 * 		#if document doesn't already exist, create it and add to database
 * 		docModel = @docpad.createModel({fullPath:'file/path/to/somewhere'})
 * 		docModel.load()
 * 		@docpad.getDatabase().add(docModel)
 *
 * @class DocumentModel
 * @constructor
 * @extends FileModel
 */
export class DocumentModel extends FileModel {
	constructor () {
		super()

		// ---------------------------------
		// Properties

		/**
		 * The document model class.
		 * @private
		 * @property {Object} klass
		 */
		this.klass = DocumentModel

		/**
		 * String name of the model type.
		 * In this case, 'document'.
		 * @private
		 * @property {String} type
		 */
		this.type = 'document'


		// ---------------------------------
		// Attributes

		/**
		 * The default attributes for any document model.
		 * @private
		 * @property {Object}
		 */
		this.defaults = extendr.extend({}, FileModel.prototype.defaults, {

			// ---------------------------------
			// Special variables

			// outExtension
			// The final extension used for our file
			// Takes into accounts layouts
			// "layout.html", "post.md.eco" -> "html"
			// already defined in file.coffee

			// Whether or not we reference other doucments
			referencesOthers: false,


			// ---------------------------------
			// Content variables

			// The file meta data (header) in string format before it has been parsed
			header: null,

			// The parser to use for the file's meta data (header)
			parser: null,

			// The file content (body) before rendering, excludes the meta data (header)
			body: null,

			// Have we been rendered yet?
			rendered: false,

			// The rendered content (after it has been wrapped in the layouts)
			contentRendered: null,

			// The rendered content (before being passed through the layouts)
			contentRenderedWithoutLayouts: null,


			// ---------------------------------
			// User set variables

			// Whether or not we should render this file
			render: true,

			// Whether or not we want to render single extensions
			renderSingleExtensions: false
		})
	}


	// ---------------------------------
	// Helpers

	/**
	 * Get the file content for output. This
	 * will be the text content AFTER it has
	 * been through the rendering process. If
	 * this has been called before the rendering
	 * process, then the raw text content will be returned,
	 * or, if early enough in the process, the file buffer object.
	 * @method getOutContent
	 * @return {String or Object}
	 */
	getOutContent () {
		const content = this.get('contentRendered') || this.getContent()
		return content
	}

	/**
	 * Set flag to indicate if the document
	 * contains references to other documents.
	 * Used in the rendering process to decide
	 * on whether to render this document when
	 * another document is updated.
	 * @method referencesOthers
	 * @param {Boolean} [flag=true]
	 */
	referencesOthers (flag = true) {
		this.set({referencesOthers: flag})
		return this
	}


	// ---------------------------------
	// Actions

	/**
	 * Parse our buffer and extract meaningful data from it.
	 * next(err).
	 * @method parse
	 * @param {Object} [opts={}]
	 * @param {Object} next callback
	 */
	parse (opts = {}, next) {
		// Prepare
		[opts, next] = Array.from(extractOptsAndCallback(opts, next))
		const buffer = this.getBuffer()
		const locale = this.getLocale()
		const filePath = this.getFilePath()

		// Reparse the data and extract the content
		// With the content, fetch the new meta data, header, and body
		super.parse(opts, () => {
			// Prepare
			let body, content, header
			const meta = this.getMeta()
			const metaDataChanges = {}
			let parser = (header = (body = (content = null)))

			// Content
			content = this.get('content').replace(/\r\n?/gm, '\n')  // normalise line endings for the web, just for convience, if it causes problems we can remove

			// Header
			const regex = new RegExp(`\
\
^\\s*\
\
\
[^\\n]*?\
\
\
(\
([^\\s\\d\\w])\
\\2{2,}\
)\
\
\
(?:\
\\x20*\
(\
[a-z]+\
)\
)?\
\
\
(\
[\\s\\S]*?\
)\
\
\
[^\\n]*?\
\
\
\\1\
\
\
[^\\n]*\
`)

			// Extract Meta Data
			const match = regex.exec(content)
			if (match) {
				// TODO: Wipe the old meta data

				// Prepare
				let err, metaParseResult
				const seperator = match[1]
				parser = match[3] || 'yaml'
				header = match[4].trim()
				body = content.substring(match[0].length).trim()

				// Parse
				try {
					switch (parser) {
						case 'cson': case 'json': case 'coffee': case 'coffeescript': case 'coffee-script': case 'js': case 'javascript':
							switch (parser) {
								case 'coffee': case 'coffeescript': case 'coffee-script':
									parser = 'coffeescript'
									break
								case 'js': case 'javascript':
									parser = 'javascript'
									break
								default :
									break
							}

							const csonOptions = {
								format: parser,
								json: true,
								cson: true,
								coffeescript: true,
								javascript: true
							}

							metaParseResult = CSON.parseString(header, csonOptions)
							if (metaParseResult instanceof Error) {
								metaParseResult.context = `Failed to parse ${parser} meta header for the file: ${filePath}`
								return next(metaParseResult)
							}

							extendr.extend(metaDataChanges, metaParseResult)
							break

						case 'yaml':
							metaParseResult = YAML.parse(
								header.replace(/\t/g, '    ')  // YAML doesn't support tabs that well
							)
							extendr.extend(metaDataChanges, metaParseResult)
							break

						default:
							err = new Error(util.format(locale.documentMissingParserError, parser, filePath))
							return next(err)
					}
				}
				catch (error) {
					err = error
					err.context = util.format(locale.documentParserError, parser, filePath)
					return next(err)
				}
			}
			else {
				body = content
			}

			// Incorrect encoding detection?
			// If so, re-parse with the correct encoding conversion
			if (metaDataChanges.encoding && (metaDataChanges.encoding !== this.get('encoding'))) {
				this.set({
					encoding: metaDataChanges.encoding
				})
				opts.reencode = true
				return this.parse(opts, next)
			}

			// Update meta data
			body = body.replace(/^\n+/, '')
			this.set({
				source: content,
				content: body,
				header,
				body,
				parser,
				name: this.get('name') || this.get('title') || this.get('basename')
			})

			// Correct data format
			if (metaDataChanges.date) {
				metaDataChanges.date = new Date(metaDataChanges.date)
			}

			// Correct ignore
			for (const key of ['ignore', 'skip', 'draft']) {
				if (metaDataChanges[key] != null) {
					metaDataChanges.ignored = (metaDataChanges[key] != null ? metaDataChanges[key] : false)
					delete metaDataChanges[key]
				}
			}
			for (const key of ['published']) {
				if (metaDataChanges[key] != null) {
					metaDataChanges.ignored = !(metaDataChanges[key] != null ? metaDataChanges[key] : false)
					delete metaDataChanges[key]
				}
			}

			// Handle urls
			if (metaDataChanges.urls) {
				this.addUrl(metaDataChanges.urls)
			}
			if (metaDataChanges.url) {
				this.setUrl(metaDataChanges.url)
			}

			// Check if the id was being over-written
			if (metaDataChanges.id != null) {
				this.log('warn', util.format(locale.documentIdChangeError, filePath))
				delete metaDataChanges.id
			}

			// Apply meta data
			this.setMeta(metaDataChanges)

			// Next
			return next()
		})

		// Chain
		return this
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
	normalize (opts = {}, next) {
		// Prepare
		[opts, next] = extractOptsAndCallback(opts, next)
		const changes = {}
		const meta = this.getMeta()

		// Extract
		let outExtension = opts.outExtension || meta.get('outExtension') || null
		const filename = opts.filename || this.get('filename') || null
		const extensions = this.getExtensions({filename}) || null

		// Extension Rendered
		if (!outExtension) {
			changes.outExtension = (outExtension = extensions[0] || null)
		}

		// Forward
		super.normalize(extendr.extend(opts, changes), next)

		// Chain
		return this
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
	contextualize (opts = {}, next) {
		// Prepare
		[opts, next] = extractOptsAndCallback(opts, next)
		console.log("Document.contextualize: -> opts:")
		console.log(opts)
		console.log(`Document.contextualize: -> next:${next}`)

		// Get our highest ancestor
		this.getEve((err, eve) => {
			// Prepare
			if (err) {
				return next(err)
			}
			const changes = {}
			const meta = this.getMeta()

			// User specified
			const outFilename = opts.outFilename || meta.get('outFilename') || null
			const outPath = opts.outPath || meta.get('outPath') || null
			let outExtension = opts.outExtension || meta.get('outExtension') || null
			const extensions = this.getExtensions({filename: outFilename}) || null

			// outExtension
			if (!outExtension) {
				if (!outFilename && !outPath) {
					if (eve != null) {
						changes.outExtension = (outExtension = eve.get('outExtension') || extensions[0] || null)
					}
					else {
						changes.outExtension = extensions[0] || null
					}
				}
			}

			// Forward onto normalize to adjust for the outExtension change
			return this.normalize(extendr.extend(opts, changes), next)
		})

		// Chain
		return this
	}


	// ---------------------------------
	// Layouts

	/**
	 * Checks if the file has a layout.
	 * @method hasLayout
	 * @return {Boolean}
	 */
	hasLayout () {
		return (this.get('layout') != null)
	}

	// Get Layout

	/**
	 * Get the layout object that this file references (if any).
	 * We update the layoutRelativePath as it is
	 * used for finding what documents are used by a
	 * layout for when a layout changes.
	 * next(err, layout)
	 * @method getLayout
	 * @param {Function} next callback
	 */
	getLayout (next) {
		// Prepare
		const file = this
		const layoutSelector = this.get('layout')

		// Check
		if (!layoutSelector) {
			return next(null, null)
		}

		// Find parent
		this.emit('getLayout', {selector: layoutSelector}, (err, opts) => {
			// Prepare
			const {layout} = opts

			// Error
			if (err) {
				file.set({layoutRelativePath: null})
				return next(err)

			// Not Found
			}
			else if (!layout) {
				file.set({layoutRelativePath: null})
				return next()

			// Found
			}
			else {
				file.set({layoutRelativePath: layout.get('relativePath')})
				return next(null, layout)
			}
		})

		// Chain
		return this
	}

	/**
	 * Get the most ancestoral (root) layout we
	 * have - ie, the very top one. Often this
	 * will be the base or default layout for
	 * a project. The layout where the head and other
	 * html on all pages is defined. In some projects,
	 * however, there may be more than one root layout
	 * so we can't assume there will always only be one.
	 * This is used by the contextualize method to determine
	 * the output extension of the document. In other words
	 * the document's final output extension is determined by
	 * the root layout.
	 * next(err,layout)
	 * @method getEve
	 * @param {Function} next
	 */
	getEve (next) {
		if (this.hasLayout()) {
			this.getLayout((err, layout) => {
				if (err) {
					return next(err, null)
				}
				else if (layout) {
					return layout.getEve(next)
				}
				else {
					return next(null, null)
				}
			})
		}
		else {
			next(null, this)
		}
		return this
	}


	// ---------------------------------
	// Rendering

	/**
	 * Renders one extension to another depending
	 * on the document model's extensions property.
	 * Triggers the render event for each extension conversion.
	 * This is the point where the various templating systems listen
	 * for their extension and perform their conversions.
	 * Common extension conversion is from md to html.
	 * So the document source file maybe index.md.html.
	 * This will be a markdown file to be converted to HTML.
	 * However, documents can be rendered through more than
	 * one conversion. Index.html.md.eco will be rendered from
	 * eco to md and then from md to html. Two conversions.
	 * next(err,result)
	 * @private
	 * @method renderExtensions
	 * @param {Object} opts
	 * @param {Function} next callback
	 */
	renderExtensions (opts, next) {
		// Prepare
		[opts, next] = extractOptsAndCallback(opts, next)
		const file = this
		const locale = this.getLocale()
		let {content, templateData, renderSingleExtensions} = opts
		const extensions = this.get('extensions')
		const filename = this.get('filename')
		const filePath = this.getFilePath()
		if (content == null) {
			content = this.get('body')
		}
		if (templateData == null) {
			templateData = {}
		}
		if (renderSingleExtensions == null) {
			renderSingleExtensions = this.get('renderSingleExtensions')
		}

		// Prepare result
		let result = content

		// Prepare extensions
		const extensionsReversed = []
		if ((extensions.length === 0) && filename) {
			extensionsReversed.push(filename)
		}
		for (const extension of Array.from(extensions)) {
			extensionsReversed.unshift(extension)
		}

		// If we want to allow rendering of single extensions, then add null to the extension list
		if (renderSingleExtensions && (extensionsReversed.length === 1)) {
			if ((renderSingleExtensions !== 'auto') || (filename.replace(/^\./, '') === extensionsReversed[0])) {
				extensionsReversed.push(null)
			}
		}

		// If we only have one extension, then skip ahead to rendering layouts
		if (extensionsReversed.length <= 1) {
			return next(null, result)
		}

		// Prepare the tasks
		const tasks = this.TaskGroup(`renderExtensions: ${filePath}`, {
			next (err) {
				// Forward with result
				return next(err, result)
			}
		})

		// Cycle through all the extension groups and render them
		eachr(extensionsReversed.slice(1), (extension, index) =>
			// Task
			tasks.addTask(`renderExtension: ${filePath} [${extensionsReversed[index]} => ${extension}]`, (complete) => {
				// Prepare
				// eventData must be defined in the task
				// definining it in the above loop will cause eventData to persist between the tasks... very strange, but it happens
				// will cause the jade tests to fail
				const eventData = {
					inExtension: extensionsReversed[index],
					outExtension: extension,
					templateData,
					file,
					content: result
				}

				// Render
				return file.trigger('render', eventData, (err) => {
					// Check
					if (err) {
						return complete(err)
					}

					// Check if the render did anything
					// and only check if we actually have content to render!
					// if this check fails, error with a suggestion
					if (result && (result === eventData.content)) {
						file.log('warn', util.format(locale.documentRenderExtensionNoChange, eventData.inExtension, eventData.outExtension, filePath))
						return complete()
					}

					// The render did something, so apply and continue
					result = eventData.content
					return complete()
				})
			})
		)

		// Run tasks synchronously
		tasks.run()

		// Chain
		return this
	}

	/**
	 * Triggers the renderDocument event after
	 * all extensions have been rendered. Listeners
	 * can use this event to perform transformations
	 * on the already rendered content.
	 * @private
	 * @method renderDocument
	 * @param {Object} opts
	 * @param {Function} next callback
	 */
	renderDocument (opts, next) {
		// Prepare
		[opts, next] = extractOptsAndCallback(opts, next)
		const file = this
		let {content, templateData} = opts
		const extension = this.get('extensions')[0]
		if (content == null) {
			content = this.get('body')
		}
		if (templateData == null) {
			templateData = {}
		}

		// Prepare event data
		const eventData = {extension, templateData, file, content}

		// Render via plugins
		file.trigger('renderDocument', eventData, (err) =>
			// Forward
			next(err, eventData.content)
		)

		// Chain
		return this
	}


	/**
	 * Render and merge layout content. Merge
	 * layout metadata with document metadata.
	 * Return the resulting merged content to
	 * the callback result parameter.
	 * next(err,result)
	 * @private
	 * @method renderLayouts
	 * @param {Object} opts
	 * @param {Function} next callback
	 */
	renderLayouts (opts, next) {
		// Prepare
		[opts, next] = Array.from(extractOptsAndCallback(opts, next))
		const file = this
		const locale = this.getLocale()
		const filePath = this.getFilePath()
		let {content, templateData} = opts
		if (content == null) {
			content = this.get('body')
		}
		if (templateData == null) {
			templateData = {}
		}

		// Grab the layout
		return file.getLayout((err, layout) => {
			// Check
			if (err) {
				return next(err, content)
			}

			// We have a layout to render
			if (layout) {
				// Assign the current rendering to the templateData.content
				templateData.content = content

				// Merge in the layout meta data into the document JSON
				// and make the result available via documentMerged
				// templateData.document.metaMerged = extendr.extend({}, layout.getMeta().toJSON(), file.getMeta().toJSON())

				// Render the layout with the templateData
				return layout.clone().action('render', {templateData}, (err, result) => next(err, result))

			// We had a layout, but it is missing
			}
			else if (file.hasLayout()) {
				const layoutSelector = file.get('layout')
				err = new Error(util.format(locale.documentMissingLayoutError, layoutSelector, filePath))
				return next(err, content)

			// We never had a layout
			}
			else {
				return next(null, content)
			}
		})
	}

	/**
	 * Triggers the render process for this document.
	 * Calls the renderExtensions, renderDocument and
	 * renderLayouts methods in sequence. This is the
	 * method you want to call if you want to trigger
	 * the rendering of a document manually.
	 *
	 * The rendered content is returned as the result
	 * parameter to the passed callback and the DocumentModel
	 * instance is returned in the document parameter.
	 * next(err,result,document)
	 * @method render
	 * @param {Object} [opts={}]
	 * @param {Function} next callback
	 */
	render (opts = {}, next) {
		// Prepare
		[opts, next] = extractOptsAndCallback(opts, next)
		const file = this
		const locale = this.getLocale()

		// Prepare variables
		let contentRenderedWithoutLayouts = null
		const filePath = this.getFilePath()
		const relativePath = file.get('relativePath')

		// Options
		opts = extendr.clone(opts)
		if (opts.actions == null) {
			opts.actions = ['renderExtensions', 'renderDocument', 'renderLayouts']
		}
		if (opts.apply != null) {
			const err = new Error(locale.documentApplyError)
			return next(err)
		}

		// Prepare content
		if (opts.content == null) {
			opts.content = file.get('body')
		}

		// Prepare templateData
		opts.templateData = extendr.clone(opts.templateData || {})  // deepClone may be more suitable
		if (opts.templateData.document == null) {
			opts.templateData.document = file.toJSON()
		}
		if (opts.templateData.documentModel == null) {
			opts.templateData.documentModel = file
		}

		// Ensure template helpers are bound correctly
		for (const key of Object.keys(opts.templateData || {})) {
			const value = opts.templateData[key]
			if ((value != null ? value.bind : null) === Function.prototype.bind) {  // we do this style of check, as underscore is a function that has it's own bind
				opts.templateData[key] = value.bind(opts.templateData)
			}
		}

		// Prepare result
		// file.set({contentRendered:null, contentRenderedWithoutLayouts:null, rendered:false})

		// Log
		file.log('debug', util.format(locale.documentRender, filePath))

		// Prepare the tasks
		const tasks = this.TaskGroup({
			name: 'render tasks for: #{relativePath}',
			next (err) {
				// Error?
				if (err) {
					err.context = util.format(locale.documentRenderError, filePath)
					return next(err, opts.content, file)
				}

				// Attributes
				const contentRendered = opts.content
				if (contentRenderedWithoutLayouts == null) {
					contentRenderedWithoutLayouts = contentRendered
				}
				const rendered = true
				file.set({contentRendered, contentRenderedWithoutLayouts, rendered})

				// Log
				file.log('debug', util.format(locale.documentRendered, filePath))

				// Apply
				file.attributes.rtime = new Date()

				// Success
				return next(null, opts.content, file)
			}
			// ^ do not use super here, even with =>
			// as it causes layout rendering to fail
			// the reasoning for this is that super uses the document's contentRendered
			// where, with layouts, opts.apply is false
			// so that isn't set
		})

		// Render Extensions Task
		if (opts.actions.includes('renderExtensions')) {
			tasks.addTask(`renderExtensions: ${relativePath}`, (complete) =>
				file.renderExtensions(opts, (err, result) => {
					// Check
					if (err) {
						return complete(err)
					}

					// Apply the result
					opts.content = result

					// Done
					return complete()
				})
			)
		}

		// Render Document Task
		if (opts.actions.includes('renderDocument')) {
			tasks.addTask(`renderDocument: ${relativePath}`, (complete) =>
				file.renderDocument(opts, (err, result) => {
					// Check
					if (err) {
						return complete(err)
					}

					// Apply the result
					opts.content = result
					contentRenderedWithoutLayouts = result

					// Done
					return complete()
				})
			)
		}

		// Render Layouts Task
		if (opts.actions.includes('renderLayouts')) {
			tasks.addTask(`renderLayouts: ${relativePath}`, (complete) =>
				file.renderLayouts(opts, (err, result) => {
					// Check
					if (err) {
						return complete(err)
					}

					// Apply the result
					opts.content = result

					// Done
					return complete()
				})
			)
		}

		// Fire the tasks
		tasks.run()

		// Chain
		return this
	}


	// ---------------------------------
	// CRUD

	/**
	 * Write the source file. Optionally pass
	 * the opts parameter to modify or set the file's
	 * path, content or type.
	 * next(err)
	 * @method writeSource
	 * @param {Object} [opts]
	 * @param {Object} next callback
	 */
	writeSource (opts, next) {
		// Prepare
		[opts, next] = extractOptsAndCallback(opts, next)
		let body, source
		const file = this
		const filePath = this.getFilePath()

		// Fetch
		if (opts.content == null) {
			opts.content = (this.getContent() || '').toString('')
		}

		// Adjust
		const metaData  = this.getMeta().toJSON(true)
		delete metaData.writeSource
		const content   = (body = opts.content.replace(/^\s+/, ''))
		const header    = CSON.stringify(metaData)

		if (header instanceof Error) {
			header.context = `Failed to write CSON meta header for the file: ${filePath}`
			return next(header)
		}

		if (!header || (header === '{}')) {
			// No meta data
			source    = body
		}
		else {
			// Has meta data
			const parser    = 'cson'
			const seperator = '###'
			source    = `${seperator} ${parser}\n${header}\n${seperator}\n\n${body}`
		}

		// Apply
		// @set({parser,header,body,content,source})
		// ^ commented out as we probably don't need to do this, it could be handled on the next load
		opts.content = source

		// Write data
		super.writeSource(opts, next)

		// Chain
		return this
	}
}
DocumentModel.initClass();
