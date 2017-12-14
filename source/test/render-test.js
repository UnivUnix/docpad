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
const safefs = require('safefs');
const safeps = require('safeps');
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
const outPath    = pathUtil.join(rootPath, 'render-out');
const expectPath = pathUtil.join(rootPath, 'render-expected');
const cliPath    = pathUtil.join(docpadPath, 'bin', 'docpad');
const nodePath   = null;


// -------------------------------------
// Tests

joe.suite('docpad-render', function(suite,test) {

	suite('files', function(suite,test) {
		// Check render physical files
		const items = [
			{
				filename: 'markdown-with-extension.md',
				stdout: '*awesome*'
			},
			{
				filename: 'markdown-with-extensions.html.md',
				stdout: '<p><em>awesome</em></p>'
			}
		];
		return items.forEach(item =>
			test(item.filename, function(done) {
				// IMPORTANT THAT ANY OPTIONS GO AFTER THE RENDER CALL, SERIOUSLY
				// OTHERWISE the sky falls down on scoping, seriously, it is wierd
				const command = ['node', cliPath, '--global', '--silent', 'render', pathUtil.join(renderPath,item.filename)];
				const opts = {cwd:rootPath, output:false};
				return safeps.spawn(command, opts, function(err,stdout,stderr,status,signal) {
					stdout = (stdout || '').toString().trim();
					if (err) { return done(err); }
					equal(
						stdout,
						item.stdout,
						'output'
					);
					return done();
				});
			})
		);
	});

	return suite('stdin', function(suite,test) {
		// Check rendering stdin items
		const items = [
			{
				testname: 'markdown without extension',
				filename: '',
				stdin: '*awesome*',
				stdout: '*awesome*',
				error: 'Error: filename is required'
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
		items.forEach(item =>
			test(item.testname, function(done) {
				const command = ['node', cliPath, '--global', 'render'];
				if (item.filename) { command.push(item.filename); }
				const opts = {stdin:item.stdin, cwd:rootPath, output:false};
				return safeps.spawn(command, opts, function(err,stdout,stderr,status,signal) {
					stdout = (stdout || '').toString().trim();
					if (err) { return done(err); }
					if (item.error && stdout.indexOf(item.error)) { return done(); }
					equal(
						stdout,
						item.stdout,
						'output'
					);
					return done();
				});
			})
		);

		// Works with out path
		return test('outPath', function(done) {
			const item = {
				in: '*awesome*',
				out: '<p><em>awesome</em></p>',
				outPath: pathUtil.join(outPath, 'outpath-render.html')
			};
			const command = ['node', cliPath, '--global', 'render', 'markdown', '-o', item.outPath];
			const opts = {stdin:item.in, cwd:rootPath, output:false};
			return safeps.spawn(command, opts, function(err,stdout,stderr,status,signal) {
				stdout = (stdout || '').toString().trim();
				if (err) { return done(err); }
				equal(
					stdout,
					''
				);
				return safefs.readFile(item.outPath, function(err,data) {
					if (err) { return done(err); }
					const result = data.toString().trim();
					equal(
						result,
						item.out,
						'output'
					);
					return done();
				});
			});
		});
	});
});
