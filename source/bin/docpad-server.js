/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// ---------------------------------
// Requires

// Local
const DocPad = require('../lib/docpad');
const docpadUtil = require('../lib/util');


// ---------------------------------
// Helpers

// Prepare
const getArgument = function(name,value=null,defaultValue=null) {
	let result = defaultValue;
	const argumentIndex = process.argv.indexOf(`--${name}`);
	if (argumentIndex !== -1) {
		result = value != null ? value : process.argv[argumentIndex+1];
	}
	return result;
};

// DocPad Action
const action = getArgument('action', null, 'server generate');


// ---------------------------------
// DocPad Configuration
const docpadConfig = {};

docpadConfig.port = (function() {
	let port = getArgument('port');
	if (port && (isNaN(port) === false)) { port = parseInt(port,10); }
	return port;
})();


// ---------------------------------
// Create DocPad Instance
new DocPad(docpadConfig, function(err,docpad) {
	// Check
	if (err) { return docpadUtil.writeError(err); }

	// Generate and Serve
	return docpad.action(action, function(err) {
		// Check
		if (err) { return docpadUtil.writeError(err); }

		// Done
		return console.log('OK');
	});
});
