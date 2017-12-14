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

// Configure DocPad
const docpadConfig = {
	action: false,
	port: 9780,
	rootPath,
	logLevel: docpadUtil.getDefaultLogLevel(),
	skipUnsupportedPlugins: false,
	catchExceptions: false,
	environments: {
		development: {
			a: 'instanceConfig',
			b: 'instanceConfig',
			templateData: {
				a: 'instanceConfig',
				b: 'instanceConfig'
			}
		}
	}
};

// Fail on an uncaught error
process.on('uncaughtException', function(err) {
	throw err;
});

// Local globals
let docpad = null;


// -------------------------------------
// Tests

joe.suite('docpad-api', function(suite,test) {

	// Create a DocPad Instance
	suite('create', function(suite,test) {
		test('output configuration', () => console.log(`Creating DocPad with the configuration:\n${require('../lib/util').inspect(docpadConfig)}`));

		test('create DocPad instance without an action', done => docpad = require('../lib/docpad').create(docpadConfig, done));

		test('load action', done => docpad.action('load', done));

		return test('ready action', done => docpad.action('ready', done));
	});

	// Instantiate Files
	suite('models', (suite,test) =>
		// Document
		suite('document', function(suite,tet) {
			// Prepare
			let document = null;
			const documentAttributes = {
				meta: {
					relativePath: "some/relative/path.txt"
				}
			};

			// Test
			test('create', function() {
				// Create
				document = docpad.createDocument(documentAttributes);

				// Add logging
				document.on('log', console.log.bind(console));

				// Checks
				equal(
					document.getMeta('relativePath'),
					documentAttributes.meta.relativePath,
					'meta relativePath'
				);
				return equal(
					document.get('relativePath'),
					documentAttributes.meta.relativePath,
					'attr relativePath'
				);
			});

			// Load
			return test('load', complete =>
				document.load(function(err) {
					// Check
					if (err) { return complete(err); }

					// Check
					equal(
						document.getMeta('relativePath'),
						documentAttributes.meta.relativePath,
						'relativePath'
					);

					// Complete
					return complete();
				})
			);
		})
	);

	// Render some input
	return suite('render', function(suite,test) {
		// Check rendering stdin inputs
		const inputs = [
			{
				testname: 'markdown without extension',
				filename: 'file',
				stdin: '*awesome*',
				stdout: '*awesome*'
			},
			{
				testname: 'markdown with extension as filename',
				filename: 'markdown',
				stdin: '*awesome*',
				stdout: '<p><em>awesome</em></p>'
			},
			{
				testname: 'markdown with extension',
				filename: 'example.md',
				stdin: '*awesome*',
				stdout: '*awesome*'
			},
			{
				testname: 'markdown with extensions',
				filename: '.html.md',
				stdin: '*awesome*',
				stdout: '<p><em>awesome</em></p>'
			},
			{
				testname: 'markdown with filename',
				filename: 'example.html.md',
				stdin: '*awesome*',
				stdout: '<p><em>awesome</em></p>'
			}
		];
		return inputs.forEach(input =>
			test(input.testname, function(done) {
				const opts = {
					data: input.stdin,
					filename: input.filename,
					renderSingleExtensions: 'auto'
				};
				return docpad.action('render', opts, function(err,result) {
					if (err) { return done(err); }
					equal(
						result.trim(),
						input.stdout,
						'output'
					);
					return done();
				});
			})
		);
	});
});
