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
const action = (getArgument('action', null, 'generate')+' '+getArgument('watch', 'watch', '')).trim();


// ---------------------------------
// DocPad Configuration
const docpadConfig = {};
docpadConfig.rootPath = getArgument('rootPath', null, process.cwd());
docpadConfig.outPath = getArgument('outPath', null, docpadConfig.rootPath+'/out');
docpadConfig.srcPath = getArgument('srcPath', null, docpadConfig.rootPath+'/src');

docpadConfig.documentsPaths = (function() {
	let documentsPath = getArgument('documentsPath');
	if (documentsPath != null) {
		if (documentsPath === 'auto') { documentsPath = docpadConfig.srcPath; }
	} else {
		documentsPath = docpadConfig.srcPath+'/documents';
	}
	return [documentsPath];
})();

docpadConfig.port = (function() {
	let port = getArgument('port');
	if (port && (isNaN(port) === false)) { port = parseInt(port,10); }
	return port;
})();

docpadConfig.renderSingleExtensions = (function() {
	let renderSingleExtensions = getArgument('renderSingleExtensions', null, 'auto');
	if (['true','yes'].includes(renderSingleExtensions)) {
		renderSingleExtensions = true;
	} else if (['false','no'].includes(renderSingleExtensions)) {
		renderSingleExtensions = false;
	}
	return renderSingleExtensions;
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
