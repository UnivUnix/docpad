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
import * as pathUtil from 'path'

// Local
import {QueryCollection, Model} from '../base'
import FileModel from '../models/file'


// =====================================
// Classes

/**
 * The DocPad files and documents query collection class
 * Extends the DocPad QueryCollection class
 * https://github.com/docpad/docpad/blob/master/src/lib/base.coffee#L91
 * Used as the query collection class for DocPad files and documents.
 * This differs from standard collections in that it provides backbone.js,
 * noSQL style methods for querying the file system. In DocPad this
 * is the various files that make up a web project. Typically this is the documents,
 * css, script and image files.
 *
 * Most often a developer will use this class to find (and possibly sort) documents,
 * such as blog posts, by some criteria.
 * 	posts: ->
 * 		@getCollection('documents').findAllLive({relativeOutDirPath: 'posts'},[{date:-1}])
 * @class FilesCollection
 * @constructor
 * @extends QueryCollection
 */
export class FilesCollection extends QueryCollection {
	static initClass () {

		/**
		 * Base Model for all items in this collection
		 * @private
		 * @property {Object} model
		 */
		this.prototype.model = FileModel

		/**
		 * Base Collection for all child collections
		 * @private
		 * @property {Object} collection
		 */
		this.prototype.collection = FilesCollection
	}

	/**
	 * Initialize the collection
	 * @private
	 * @method initialize
	 * @param {Object} attrs
	 * @param {Object} [opts={}]
	 * @returns {null}
	 */
	initialize (attrs, opts) {
		if (opts == null) {
			opts = {}
		}
		if (this.options == null) {
			this.options = {}
		}
		if (this.options.name == null) {
			this.options.name = opts.name || null
		}
		return super.initialize(attrs, opts)
	}

	/**
	 * Fuzzy find one
	 * Useful for layout searching
	 * @method fuzzyFindOne
	 * @param {Object} data
	 * @param {Object} sorting
	 * @param {Object} paging
	 * @return {Object} the file, if found
	 */
	fuzzyFindOne (data, sorting, paging) {
		// Prepare
		const escapedData = data != null ? data.replace(/[/]/g, pathUtil.sep) : null
		const queries = [
			{relativePath: escapedData},
			{relativeBase: escapedData},
			{url: data},
			{relativePath: {$startsWith: escapedData}},
			{fullPath: {$startsWith: escapedData}},
			{url: {$startsWith: data}}
		]

		// Try the queries
		for (const query of Array.from(queries)) {
			const file = this.findOne(query, sorting, paging)
			if (file) {
				return file
			}
		}

		// Didn't find a file
		return null
	}
}
FilesCollection.initClass()
