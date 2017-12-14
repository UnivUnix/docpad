/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// =====================================
// Requires

// Standard Library
const pathUtil = require('path');

// External
const {equal} = require('assert-helpers');
const joe = require('joe');
const superagent = require('superagent');

// Local
const docpadUtil = require('../lib/util');


// =====================================
// Configuration

// Paths
const docpadPath = pathUtil.join(__dirname, '..', '..');
const rootPath   = pathUtil.join(docpadPath, 'test');
const renderPath = pathUtil.join(rootPath, 'render');
const expectPath = pathUtil.join(rootPath, 'render-expected');
const cliPath    = pathUtil.join(docpadPath, 'bin', 'docpad');

// Fail on an uncaught error
process.on('uncaughtException', function(err) {
	throw err;
});


// -------------------------------------
// Tests

joe.suite('docpad-custom-server', function(suite,test) {
	// Local Globals
	let docpadConfig = null;
	let docpad = null;
	let serverExpress = null;
	let serverHttp = null;
	let port = null;

	// Create a DocPad Instance
	test('createInstance', function(done) {
		docpadConfig = {
			port: (port = 9780),
			rootPath,
			logLevel: docpadUtil.getDefaultLogLevel(),
			skipUnsupportedPlugins: false,
			catchExceptions: false,
			serverExpress: (serverExpress = require('express')()),
			serverHttp: (serverHttp = require('http').createServer(serverExpress).listen(port))
		};
		serverExpress.get('/hello', (req,res) => res.send(200, 'hello world'));
		return docpad = require('../lib/docpad').createInstance(docpadConfig, done);
	});

	// Run Server Action
	test('server action', done => docpad.action('server', done));

	// Test Server Binding
	test('server bound', function(done) {
		equal(
			docpad.serverExpress,
			serverExpress,
			"serverExpress was bound"
		);
		equal(
			docpad.serverHttp,
			serverHttp,
			"serverHttp was bound"
		);
		return superagent.get(`http://127.0.0.1:${port}/hello`)
			.timeout(5*1000)
			.end(function(err, res) {
				equal(err, null, "no error");
				equal(
					res.text,
					'hello world',
					"server was extended correctly"
				);
				return done();
		});
	});

	// Destroy
	return test('destroy instance', done => docpad.destroy(done));
});
