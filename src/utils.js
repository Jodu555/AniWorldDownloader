const ncp = require('node-clipboardy');

function fmt(env_VAR) {
	return env_VAR.split(' ').map((n) => Number(n));
}

async function writeToClipboard(text) {
	return ncp.writeSync(text);
	// return new Promise((resolve, _) => {
	// 	import('clipboardy').then((clipboard) => {
	// 		resolve(clipboard.default.writeSync(text));
	// 	});
	// });
}

async function readFromClipboard() {
	return ncp.readSync();
	// return new Promise((resolve, _) => {
	// 	import('clipboardy').then((clipboard) => {
	// 		resolve(clipboard.default.readSync());
	// 	});
	// });
}

function parseToBoolean(stringValue) {
	switch (stringValue?.toLowerCase()?.trim()) {
		case 'true':
		case 'yes':
		case '1':
			return true;

		case 'false':
		case 'no':
		case '0':
		case null:
		case undefined:
			return false;

		default:
			return JSON.parse(stringValue);
	}
}

const wait = (ms) => new Promise((resolve, reject) => setTimeout(resolve, ms));

module.exports = {
	fmt,
	writeToClipboard,
	readFromClipboard,
	parseToBoolean,
	wait,
};
