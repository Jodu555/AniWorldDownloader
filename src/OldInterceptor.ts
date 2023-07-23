import { ExtendedEpisodeDownload } from './types';
import { fmt, readFromClipboard, wait } from './utils';

const robot = require('kbm-robot');
// import robot from 'kbm-robot'
import { click, robotTypeAdvanced, executeManualConsoleCommand } from './robot_utils';

class OldM3u8Interceptor {
	async getM3u8UrlFromURL(urls: ExtendedEpisodeDownload[], obj: ExtendedEpisodeDownload) {
		const { url, file } = obj;
		const language = file.split('_')[1];
		const URL_POS = fmt(process.env.URL_POS);
		const FIRST_NETWORK_REQUEST_POS = fmt(process.env.FIRST_NETWORK_REQUEST_POS);
		const URL_NETWORK_REQUEST_POS = fmt(process.env.URL_NETWORK_REQUEST_POS);
		const URL_COPY_BUTTON = fmt(process.env.URL_COPY_BuTTON);

		// const NETWORK_REQUEST_CLEAR_BUTTON = fmt(process.env.NETWORK_REQUEST_CLEAR_BUTTON);

		robot.startJar();

		robot.mouseMove(URL_POS[0], URL_POS[1]);
		click(robot, 1);

		robotTypeAdvanced(robot, url);
		robot.press('ENTER').release('ENTER');

		let networkTries = 0;

		await robot.go();
		// Make this expression more valid by checking the actual lang an entity is in
		// This only should be true if the desired language to download needs video change
		// TODO: Figure this expression out, it just is not capable when the item has GerSub, EngSub or EngDub
		let m3u8URL = '';
		for (let i = 0; i < 10; i++) {
			//False if no zooro / new dl way
			//True if no lang switch
			if (true) {
				robot.sleep(5900);

				//This Code is Duplicate with the one below
				robot.mouseMove(FIRST_NETWORK_REQUEST_POS[0], FIRST_NETWORK_REQUEST_POS[1]);
				click(robot, 1);
				robot.sleep(200).mouseMove(URL_NETWORK_REQUEST_POS[0], URL_NETWORK_REQUEST_POS[1]);
				click(robot, 1);
				click(robot, 3);
				robot.mouseMove(URL_COPY_BUTTON[0], URL_COPY_BUTTON[1]).sleep(200);
				click(robot, 3);
				await robot.go();
			} else {
				networkTries++; // Because the normal language got loaded and the change to lang also
				console.log('Detected other language initiate switch!');

				robot.sleep(2000);
				// robot.mouseMove(NETWORK_REQUEST_CLEAR_BUTTON[0], NETWORK_REQUEST_CLEAR_BUTTON[1]);
				// click(robot, 1);

				const clickGerSubCode = `[...document.querySelectorAll('img')].find(e => e.alt.includes('Ger-Sub')).click();`;
				await executeManualConsoleCommand(robot, clickGerSubCode);

				robot.sleep(5900);

				robot.mouseMove(FIRST_NETWORK_REQUEST_POS[0], FIRST_NETWORK_REQUEST_POS[1] + networkTries * 20);
				click(robot, 1);
				robot.sleep(200).mouseMove(URL_NETWORK_REQUEST_POS[0], URL_NETWORK_REQUEST_POS[1]);
				click(robot, 1);
				click(robot, 3);
				robot.mouseMove(URL_COPY_BUTTON[0], URL_COPY_BUTTON[1]).sleep(200);
				click(robot, 3);
				await robot.go();
			}
			// await wait(5000);

			m3u8URL = await readFromClipboard();

			if (!m3u8URL.includes('https://') || urls.find((v) => v.m3u8 == m3u8URL) !== undefined) {
				console.log('Got suspicious program behaviour: Stopped!', !m3u8URL.includes('https://'), urls.find((v) => v.m3u8 == url) !== undefined);
				console.log('Started Retrie', i, 'out of', 10);
			} else {
				break;
			}
		}

		robot.stopJar();

		return m3u8URL;
	}
}

export default OldM3u8Interceptor;
