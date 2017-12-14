// =====================================
// Requires

// External
import * as extendr from "extendr";
import * as queryEngine from "query-engine";

// =====================================
// Helpers

// Log a message
const log = (...args) => {
	args.unshift('log');
	this.emit.apply(this, args);
	return this;
};
const emit = (...args) => {
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
export class Events extends queryEngine.Backbone.Events {
	constructor() {
		super();
		this.log = log;
		this.emit = emit;
	}
}

/**
 * Base class for the DocPad file and document model
 * Extends the backbone.js model
 * http://backbonejs.org/#Model
 * @class Model
 * @constructor
 * @extends queryEngine.Backbone.Model
 */
export class Model extends queryEngine.Backbone.Model {
	constructor() {
		super();
		this.log = log;
		this.emit = emit;
	}

	// Set Defaults
	setDefaults(attrs={},opts) {
		// Extract
		const set = {};
		for (let key of Object.keys(attrs)) {
			const value = attrs[key];
			if (this.get(key) === (this.defaults != null ? this.defaults[key] : undefined)) { set[key] = value; }
		}

		// Forward
		return this.set(set, opts);
	}
}

/**
 * Base class for the DocPad collection object
 * Extends the backbone.js collection object
 * http://backbonejs.org/#Collection
 * @class Collection
 * @constructor
 * @extends queryEngine.Backbone.Collection
 */
export class Collection extends queryEngine.Backbone.Collection {
	constructor(...args) {
		super(...args);
		this.log = log;
		this.emit = emit;
		this.model = Model;
		this.collection = Collection;
		this.destroy = this.destroy.bind(this);
	}

	destroy() {
		this.emit('destroy');
		this.off().stopListening();
		return this;
	}
}

/**
 * Base class for the DocPad query collection object
 * Extends the bevry QueryEngine object
 * http://github.com/bevry/query-engine
 * @class QueryCollection
 * @constructor
 * @extends queryEngine.QueryCollection
 */
export class QueryCollection extends queryEngine.QueryCollection {
	constructor(...args) {
		super(...args);
		this.log = log;
		this.emit = emit;
		this.model = Model;
		this.collection = QueryCollection;
		this.destroy = this.destroy.bind(this);
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