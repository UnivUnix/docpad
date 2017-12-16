/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// =====================================
// Requires

// External
import * as typeChecker from 'typechecker'

// Local
import ElementsCollection from './elements'


// =====================================
// Classes

/**
 * Styles collection class. A DocPad
 * project's style (css) file paths
 * @class StylesCollection
 * @constructor
 * @extends ElementsCollection
 */
export class StylesCollection extends ElementsCollection {

	/**
	 * Add an element to the collection
	 * Right now we just support strings
	 * @method add
	 * @param {Array} values string array of file paths
	 * @param {Object} opts
	 * @returns {null}
	 */
	add (values, opts) {
		// Prepare
		if (!opts) {
			opts = {}
		}
		if (!opts.attrs) {
			opts.attrs = ''
		}

		// Ensure array
		if (typeChecker.isArray(values)) {
			values = values.slice()
		}
		else if (values) {
			values = [values]
		}
		else {
			values = []
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
<link ${opts.attrs} rel="stylesheet" href="${value}" />\
`
				}
				else {
					// we are inline
					values[key] = `\
<style ${opts.attrs}>${value}</style>\
`
				}
			}
		}

		// Call the super with our values
		return super.add(values, opts)
	}
}
