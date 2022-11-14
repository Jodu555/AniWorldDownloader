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

module.exports = {
	fmt,
	writeToClipboard,
	readFromClipboard,
};
