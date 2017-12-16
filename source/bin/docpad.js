// ---------------------------------
// Required modules for this.
import {DocpadUtil} from '../lib/util'
import {DocPad} from '../lib/docpad'
import {ConsoleInterface} from '../lib/interfaces/console'

// ---------------------------------
// Check node version right away

if ((process.versions.node.indexOf('0') === 0) && ((process.versions.node.split('.')[1] % 2) !== 0)) {
	console.log(require('util').format(
		`\
== WARNING ==
   DocPad is running against an unstable version of Node.js (v%s to be precise).
   Unstable versions of Node.js WILL break things! Do not use them with DocPad!
   Run DocPad with a stable version of Node.js (e.g. v%s) for a stable experience.
   For more information, visit: %s
== WARNING ===\
`,
		process.versions.node,
		`0.${process.versions.node.split('.')[1] - 1}`,
		'http://docpad.org/unstable-node'
	))
}

// ---------------------------------
// Start our DocPad Installation

function startDocPad () {
	// Fetch action
	const action =
		// we should eventually do a load always
		// but as it is a big change of functionality, lets only do it inclusively for now
		process.argv.slice(1).join(' ').indexOf('deploy') !== -1 ?  // if we are the deploy command
		'load'
			:  // if we are not the deploy command
			false

	// Create DocPad Instance
	const docpad = new DocPad({action}, function (err, docpad) {
		// Check
		if (err) {
			return DocpadUtil.writeError(err)
		}

		// Create Console Interface
		const consoleInterface = new ConsoleInterface({docpad}, function (err, consoleInterface) {
			// Check
			if (err) {
				return DocpadUtil.writeError(err)
			}

			// Start
			consoleInterface.start()
		})
	})
}

// ---------------------------------
// Check for Local DocPad Installation

function checkDocPad () {
	// Skip if we explcitly want to use the global installation
	if (process.argv.includes('--global') || process.argv.includes('--g')) {
		return startDocPad()
	}

	// Skip if we are already the local installation
	if (DocpadUtil.isLocalDocPadExecutable()) {
		return startDocPad()
	}

	// Skip if the local installation doesn't exist
	if (DocpadUtil.getLocalDocPadExecutableExistance() === false) {
		return startDocPad()
	}

	// Forward to the local installation
	return DocpadUtil.startLocalDocPadExecutable()
}

// ---------------------------------
// Fire
checkDocPad()
