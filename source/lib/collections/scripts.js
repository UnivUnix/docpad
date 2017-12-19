/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// =====================================
// Requires

// External
import * as typeChecker from 'typechecker'

// Local
import {ElementsCollection} from './elements'


// =====================================
// Classes

/**
 * Scripts collection class. A DocPad
 * project's script file paths
 * @class ScriptCollection
 * @constructor
 * @extends ElementsCollection
 */
export class ScriptsCollection extends ElementsCollection {

	/**
	 * Add an element to the collection
	 * Right now we just support strings
	 * @method add
	 * @param {Array} values string array of file paths
	 * @param {Object} opts
	 * @returns {null}
	 */
	add (values, opts = {}) {
		// Prepare
		if (opts.defer == null) {
			opts.defer = true
		}
		if (opts.async == null) {
			opts.async = false
		}
		if (!opts.attrs) {
			opts.attrs = ''
		}
		if (typeChecker.isArray(values)) {
			values = values.slice()
		}
		else if (values) {
			values = [values]
		}
		else {
			values = []
		}

		// Build attrs
		if (opts.defer) {
			opts.attrs += 'defer="defer" '
		}
		if (opts.async) {
			opts.attrs += 'async="async" '
		}

		// Convert urls into script element html
		for (let key = 0; key < values.length; key++) {
			const value = values[key]
			if (typeChecker.isString(value)) {
				if (value[0] === '<') {
					continue  // we are an element already, don't bother doing anything
				}
				else if (value.indexOf(' ') === -1) {
					// we are a url
					values[key] = `\
<script ${opts.attrs} src="${value}"></script>\
`
				}
				else {
					// we are inline
					values[key] = `\
<script ${opts.attrs}>${value}</script>\
`
				}
			}
		}

		// Call the super with our values
		return super.add(values, opts)
	}
}
