import { writeToClipboard, fmt } from './utils';

function click(robot: any, btn: number) {
	robot.mousePress(btn).mouseRelease(btn);
}

function robotTypeAdvanced(robot: any, string: string) {
	const typer = serializeForRobot(string);
	typer.forEach((data) => {
		if (data.advanced == true) {
			if (data.key == '?') {
				writeToClipboard('?');
				robot.press('CTRL').type('V').sleep(50).release('CTRL');
			} else {
				robot.press('SHIFT').type(data.key).sleep(50).release('SHIFT');
			}
		} else {
			robot.typeString(data);
		}
	});
}

function serializeForRobot(string: string) {
	const mapper = {
		':': '.',
		'/': '7',
		"'": '#',
		'=': '0',
		'?': '?',
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

async function executeManualConsoleCommand(robot: any, command: string) {
	const CONSOLE_FIELD = fmt(process.env.CONSOLE_FIELD);

	robot.mouseMove(CONSOLE_FIELD[0], CONSOLE_FIELD[1]);
	click(robot, 1);
	robot.sleep(20).press('CTRL').type('a').sleep(20).release('CTRL').sleep(20).type('BACKSPACE');
	robot.sleep(1200);
	await writeToClipboard(command);
	robot.press('CTRL').type('v').sleep(50).release('CTRL').sleep(20).release('CTRL').sleep(100).type('\n').sleep(50);

	await robot.go();
}

export { click, robotTypeAdvanced, serializeForRobot, executeManualConsoleCommand };
