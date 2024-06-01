import { AbstractInterceptor, ExtendedEpisodeDownload } from './types';
import robot from 'robotjs';
import { wait } from './utils';
import ncp from 'node-clipboardy';

export default class RobotInterceptor extends AbstractInterceptor {
	previosClip: string;
	launch(): void {
		this.previosClip = ncp.readSync();
	}
	async intercept(url: string, urls?: ExtendedEpisodeDownload[]): Promise<string> {
		ncp.writeSync(url);
		robot.moveMouse(-1200, 66);
		await wait(100);
		robot.mouseClick();
		await wait(200);
		robot.keyTap('a', 'control');
		await wait(200);
		robot.keyTap('backspace');
		await wait(200);
		robot.keyTap('v', 'control');
		await wait(200);
		robot.keyTap('enter');
		await wait(9000);
		// robot.moveMouse(-1080, 533);
		// await wait(6000);
		// robot.mouseClick();
		// await wait(1000);
		// robot.moveMouse(-106, 117);
		robot.moveMouse(-118, 146);

		const m3u8 = await new Promise<string>((resolve, reject) => {
			let i = 0;
			let str = '';
			let interval = setInterval(() => {
				i++;
				robot.mouseClick();
				str = ncp.readSync();
				console.log('Read:', str);

				if (str.includes('m3u8')) {
					clearInterval(interval);
					resolve(str);
				}
				if (i > 25) {
					clearInterval(interval);
					reject('Timeout Reached');
				}
			}, 500);
		});
		await wait(500);

		return m3u8;
	}
	shutdown(): void {
		ncp.writeSync(this.previosClip);
	}
}
