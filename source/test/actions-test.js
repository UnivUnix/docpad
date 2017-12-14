/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS203: Remove `|| {}` from converted for-own loops
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// =====================================
// Requires

// Standard Library
const util = require('util');
const pathUtil = require('path');

// External
const {difference} = require('underscore');
const superAgent = require('superagent');
const scandir = require('scandirectory');
const safefs = require('safefs');
const {equal, deepEqual} = require('assert-helpers');
const joe = require('joe');

// Local
const DocPad = require('../lib/docpad');
const docpadUtil = require('../lib/util');


// -------------------------------------
// Configuration

// Paths
const docpadPath = pathUtil.join(__dirname, '..', '..');
const rootPath   = pathUtil.join(docpadPath, 'test');
const srcPath    = pathUtil.join(rootPath, 'src');
const outPath    = pathUtil.join(rootPath, 'out');
const expectPath = pathUtil.join(rootPath, 'out-expected');
const cliPath    = pathUtil.join(docpadPath, 'bin', 'docpad');

// Params
const port = 9770;
const hostname = "0.0.0.0";
const baseUrl = `http://${hostname}:${port}`;
const testWait = 1000*60*5;  // five minutes

// Configure DocPad
const docpadConfig = {
	port,
	hostname,
	rootPath,
	logLevel: docpadUtil.getDefaultLogLevel(),
	skipUnsupportedPlugins: false,
	catchExceptions: false,
	b: 'instanceConfig',  // overwrite
	c: 'instanceConfig',  // insert
	templateData: {
		b: 'instanceConfig templateData',    // overwrite
		c: 'instanceConfig templateData'
	},    // insert
	environments: {
		development: {
			b: 'instanceConfig development',  // overwrite
			c: 'instanceConfig development',  // insert
			templateData: {
				b: 'instanceConfig templateData development',    // overwrite
				c: 'instanceConfig templateData development'
			}
		}
	}    // insert
};

// Fail on an uncaught error
process.on('uncaughtException', function(err) {
	throw err;
});

// Local globals
let docpad = null;


// -------------------------------------
// Tests

joe.suite('docpad-actions', function(suite,test) {

	test('create', done =>
		docpad = DocPad.createInstance(docpadConfig, err => done(err))
	);

	test('config', function() {
		const expected = {a:'websiteConfig development', b:'instanceConfig development', c:'instanceConfig development'};
		const config = docpad.getConfig();
		const {a,b,c} = config;
		return deepEqual(
			{a,b,c},
			expected,
			"config matched"
		);
	});

	test('config templateData', function() {
		const expected = {a:'websiteConfig templateData development', b:'instanceConfig templateData development', c:'instanceConfig templateData development'};
		const templateData = docpad.getTemplateData();
		const {a,b,c} = templateData;
		return deepEqual(
			{a,b,c},
			expected,
			"template data matched"
		);
	});

	test('clean', done =>
		docpad.action('clean', err => done(err))
	);

	test('install', done =>
		docpad.action('install', err => done(err))
	);

	suite('generate', function(suite,test) {
		test('action', done =>
			docpad.action('generate', err => done(err))
		);

		test('writeSource', function(done) {
			const file = docpad.getFileAtPath('writesource.txt.eco');
			return file.writeSource(done);
		});

		suite('results', function(suite,test) {
			const testMarkup = (key,actual,expected) =>
				test(key, function() {
					// trim whitespace, to avoid util conflicts between node versions and other oddities
					// also address the slash backslash issue with windows and unix
					const actualString = actual.trim().replace(/\s+/g,'').replace(/([abc])[\\]+/g, '$1/');
					const expectedString = expected.trim().replace(/\s+/g,'').replace(/([abc])[\\]+/g, '$1/');

					// check equality
					return equal(
						actualString,
						expectedString
					);
				})
			;

			return test('same files', done =>
				scandir({
					path: outPath,
					readFiles: true,
					ignoreHiddenFiles: false,
					next(err,outList) {
						return scandir({
							path: expectPath,
							readFiles: true,
							ignoreHiddenFiles: false,
							next(err,expectList) {
								// check we have the same files
								deepEqual(
									difference(
										Object.keys(outList),
										Object.keys(expectList)
									),
									[],
									'difference to be empty'
								);

								// check the contents of those files match
								for (let key of Object.keys(outList || {})) {
									const actual = outList[key];
									const expected = expectList[key];
									testMarkup(key, actual, expected);
								}

								// done with same file check
								// start the markup tests
								return done();
							}
						});
					}
				})
			);
		});

		test('ignored "ignored" documents"', done =>
			safefs.exists(`${outPath}/ignored.html`, function(exists) {
				equal(exists, false);
				return done();
			})
		);

		return test('ignored common patterns documents"', done =>
			safefs.exists(`${outPath}/.svn`, function(exists) {
				equal(exists, false);
				return done();
			})
		);
	});

	suite('server', function(suite,test) {

		test('server action', done =>
			docpad.action('server', err => done(err))
		);

		test('served generated documents', done =>
			superAgent.get(`${baseUrl}/html.html`, function(err,res) {
				if (err) { return done(err); }
				const actual = res.text;
				return safefs.readFile(`${expectPath}/html.html`, function(err,expected) {
					if (err) { return done(err); }
					equal(
						actual.toString().trim(),
						expected.toString().trim()
					);
					return done();
				});
			})
		);

		test('served custom urls', done =>
			superAgent.get(`${baseUrl}/my-custom-url`, function(err,res) {
				if (err) { return done(err); }
				const actual = res.text;
				return safefs.readFile(`${expectPath}/custom-url.html`, function(err,expected) {
					if (err) { return done(err); }
					equal(
						actual.toString().trim(),
						expected.toString().trim()
					);
					return done();
				});
			})
		);

		test('supports secondary urls - part 1/2', done =>
			superAgent.get(`${baseUrl}/my-secondary-urls1`, function(err,res) {
				if (err) { return done(err); }

				deepEqual(
					res.redirects,
					['http://0.0.0.0:9770/secondary-urls.html'],
					'redirects to be as expected'
				);

				const actual = res.text;
				return safefs.readFile(`${expectPath}/secondary-urls.html`, function(err,expected) {
					if (err) { return done(err); }
					equal(
						actual.toString().trim(),
						expected.toString().trim()
					);
					return done();
				});
			})
		);

		test('supports secondary urls - part 2/2', done =>
			superAgent.get(`${baseUrl}/my-secondary-urls2`, function(err,res) {
				if (err) { return done(err); }

				deepEqual(
					res.redirects,
					['http://0.0.0.0:9770/secondary-urls.html'],
					'redirects to be as expected'
				);

				const actual = res.text;
				return safefs.readFile(`${expectPath}/secondary-urls.html`, function(err,expected) {
					if (err) { return done(err); }
					equal(
						actual.toString().trim(),
						expected.toString().trim()
					);
					return done();
				});
			})
		);

		test('served dynamic documents - part 1/2', done =>
			superAgent.get(`${baseUrl}/dynamic.html?name=ben`, function(err,res) {
				if (err) { return done(err); }
				const actual = res.text;
				const expected = 'hi ben';
				equal(
					actual.toString().trim(),
					expected
				);
				return done();
			})
		);

		return test('served dynamic documents - part 2/2', done =>
			superAgent.get(`${baseUrl}/dynamic.html?name=joe`, function(err,res) {
				if (err) { return done(err); }
				const actual = res.text;
				const expected = 'hi joe';
				equal(
					actual.toString().trim(),
					expected
				);
				return done();
			})
		);
	});

	return test('close the close', () => docpad.getServer(true).serverHttp.close());
});
