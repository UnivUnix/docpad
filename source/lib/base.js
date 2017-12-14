/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS102: Remove unnecessary code created because of implicit returns
 * DS203: Remove `|| {}` from converted for-own loops
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// =====================================
// Requires

// External
const extendr = require('extendr');
const queryEngine = require('query-engine');


// =====================================
// Helpers

// Log a message
const log = function(...args) {
	args.unshift('log');
	this.emit.apply(this, args);
	return this;
};
const emit = function(...args) {
	return this.trigger.apply(this, args);
};


// =====================================
// Classes


// -------------------------------------
// Backbone

/**
 * Base class for the DocPad Events object
 * Extends the backbone.js events object
 * http://backbonejs.org/#Events
 * @class Events
 * @constructor
 * @extends queryEngine.Backbone.Events
 */
class Events {
	static initClass() {
		this.prototype.log = log;
		this.prototype.emit = emit;
	}
}
Events.initClass();
extendr.extend(Events.prototype, queryEngine.Backbone.Events);

/**
 * Base class for the DocPad file and document model
 * Extends the backbone.js model
 * http://backbonejs.org/#Model
 * @class Model
 * @constructor
 * @extends queryEngine.Backbone.Model
 */
class Model extends queryEngine.Backbone.Model {
	static initClass() {
		this.prototype.log = log;
		this.prototype.emit = emit;
	}

	// Set Defaults
	setDefaults(attrs,opts) {
		// Extract
		if (attrs == null) { attrs = {}; }
		const set = {};
		for (let key of Object.keys(attrs || {})) {
			const value = attrs[key];
			if (this.get(key) === (this.defaults != null ? this.defaults[key] : undefined)) { set[key] = value; }
		}

		// Forward
		return this.set(set, opts);
	}
}
Model.initClass();


/**
 * Base class for the DocPad collection object
 * Extends the backbone.js collection object
 * http://backbonejs.org/#Collection
 * @class Collection
 * @constructor
 * @extends queryEngine.Backbone.Collection
 */
class Collection extends queryEngine.Backbone.Collection {
	constructor(...args) {
		{
		  // Hack: trick Babel/TypeScript into allowing this before super.
		  if (false) { super(); }
		  let thisFn = (() => { this; }).toString();
		  let thisName = thisFn.slice(thisFn.indexOf('{') + 1, thisFn.indexOf(';')).trim();
		  eval(`${thisName} = this;`);
		}
		this.destroy = this.destroy.bind(this);
		super(...args);
	}

	static initClass() {
		this.prototype.log = log;
		this.prototype.emit = emit;
	}
	destroy() {
		this.emit('destroy');
		this.off().stopListening();
		return this;
	}
}
Collection.initClass();
Collection.prototype.model = Model;
Collection.prototype.collection = Collection;


/**
 * Base class for the DocPad query collection object
 * Extends the bevry QueryEngine object
 * http://github.com/bevry/query-engine
 * @class QueryCollection
 * @constructor
 * @extends queryEngine.QueryCollection
 */
class QueryCollection extends queryEngine.QueryCollection {
	constructor(...args) {
		{
		  // Hack: trick Babel/TypeScript into allowing this before super.
		  if (false) { super(); }
		  let thisFn = (() => { this; }).toString();
		  let thisName = thisFn.slice(thisFn.indexOf('{') + 1, thisFn.indexOf(';')).trim();
		  eval(`${thisName} = this;`);
		}
		this.destroy = this.destroy.bind(this);
		super(...args);
	}

	static initClass() {
		this.prototype.log = log;
		this.prototype.emit = emit;
	}

	setParentCollection() {
		super.setParentCollection();
		const parentCollection = this.getParentCollection();
		parentCollection.on('destroy', this.destroy);
		return this;
	}

	destroy() {
		this.emit('destroy');
		this.off().stopListening();
		return this;
	}
}
QueryCollection.initClass();
QueryCollection.prototype.model = Model;
QueryCollection.prototype.collection = QueryCollection;


// =====================================
// Export our base models
module.exports = {Events, Model, Collection, QueryCollection};
