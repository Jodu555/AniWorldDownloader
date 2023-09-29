import { AbstractInterceptor, ExtendedEpisodeDownload } from './types';
import ncp from 'node-clipboardy';

async function writeToClipboard(text) {
	return ncp.writeSync(text);
}

async function readFromClipboard() {
	return ncp.readSync();
}

class ClipboardInterceptor extends AbstractInterceptor {
	preRead: string;
	interval: NodeJS.Timer;
	constructor() {
		super();
		this.preRead = '';
	}
	launch(): void {}
	intercept(m3u8: string, urls?: ExtendedEpisodeDownload[]): Promise<string> {
		return new Promise(async (resolve, reject) => {
			this.interval = setInterval(async () => {
				const curRead = await readFromClipboard();
				if (this.preRead !== curRead && urls.find((v) => v.m3u8 == curRead) !== undefined) {
					this.preRead = curRead;
					resolve(curRead);
				}
			}, 100);
			setTimeout(() => {
				clearInterval(this.interval);
				reject('Timeout');
			}, 60 * 1000);
		});
	}
	shutdown(): void {}
}

export default ClipboardInterceptor;
