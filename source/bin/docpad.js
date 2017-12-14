// ---------------------------------
// Required modules for this.
import * as docpadUtil from "../lib/util";
import * as DocPad from "../lib/docpad";
import * as ConsoleInterface from "../lib/interfaces/console";

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
		`0.${process.versions.node.split('.')[1]-1}`,
		"http://docpad.org/unstable-node"
	));
}

// ---------------------------------
// Check for Local DocPad Installation

const checkDocPad = () => {
	// Skip if we explcitly want to use the global installation
	if (process.argv.includes('--global') || process.argv.includes('--g')) {
		return startDocPad();
	}

	// Skip if we are already the local installation
	if (docpadUtil.isLocalDocPadExecutable()) {
		return startDocPad();
	}

	// Skip if the local installation doesn't exist
	if (docpadUtil.getLocalDocPadExecutableExistance() === false) {
		return startDocPad();
	}

	// Forward to the local installation
	return docpadUtil.startLocalDocPadExecutable();
};

// ---------------------------------
// Start our DocPad Installation

var startDocPad = function() {
	// Fetch action
	const action =
		// we should eventually do a load always
		// but as it is a big change of functionality, lets only do it inclusively for now
		process.argv.slice(1).join(' ').indexOf('deploy') !== -1 ?  // if we are the deploy command
			'load'
		:  // if we are not the deploy command
			false;

	// Create DocPad Instance
	new DocPad({action}, function(err,docpad) {
		// Check
		if (err) { return docpadUtil.writeError(err); }

		// Create Console Interface
		new ConsoleInterface({docpad}, function(err,consoleInterface) {
			// Check
			if (err) { return docpadUtil.writeError(err); }

			// Start
			consoleInterface.start();
		});
	});
};

// ---------------------------------
// Fire
checkDocPad();
