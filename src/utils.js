function fmt(env_VAR) {
	return env_VAR.split(' ').map((n) => Number(n));
}

async function writeToClipboard(text) {
	return new Promise((resolve, _) => {
		import('clipboardy').then((clipboard) => {
			resolve(clipboard.default.writeSync(text));
		});
	});
}

async function readFromClipboard() {
	return new Promise((resolve, _) => {
		import('clipboardy').then((clipboard) => {
			resolve(clipboard.default.readSync());
		});
	});
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

module.exports = {
	fmt,
	writeToClipboard,
	readFromClipboard,
	parseToBoolean,
};
