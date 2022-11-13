function click(robot, btn) {
	robot.mousePress(btn).mouseRelease(btn);
}

function robotTypeAdvanced(robot, string) {
	const typer = serializeForRobot(string);
	typer.forEach((data) => {
		if (data.advanced == true) {
			robot.press('SHIFT').type(data.key).sleep(50).release('SHIFT');
		} else {
			robot.typeString(data);
		}
	});
}

function serializeForRobot(string) {
	const mapper = {
		':': '.',
		'/': '7',
		"'": '#',
		'=': '0',
	};

	let typer = [];

	let typeIdx = 0;

	for (const c of string) {
		if (mapper[c] != null) {
			typer.push({ advanced: true, key: mapper[c] });
			typeIdx += 2;
		} else {
			if (typer[typeIdx] == undefined) typer[typeIdx] = '';
			typer[typeIdx] += c;
		}
	}
	return typer;
}

module.exports = {
	click,
	robotTypeAdvanced,
	serializeForRobot,
};
