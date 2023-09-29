import { AbstractInterceptor, ExtendedEpisodeDownload } from './types';
import ncp from 'node-clipboardy';

async function writeToClipboard(text: string) {
	return ncp.writeSync(text);
}

async function readFromClipboard(): Promise<string> {
	return ncp.readSync();
}

class ClipboardInterceptor extends AbstractInterceptor {
	interval: NodeJS.Timer;
	launch(): void {
		writeToClipboard('');
	}
	intercept(url: string, urls?: ExtendedEpisodeDownload[]): Promise<string> {
		writeToClipboard(url);
		return new Promise(async (resolve, reject) => {
			this.interval = setInterval(async () => {
				const curRead = await readFromClipboard();
				if (curRead.trim() != url) {
					resolve(curRead);
				}
			}, 400);
			setTimeout(() => {
				clearInterval(this.interval);
				reject('Timeout');
			}, 60 * 1000);
		});
	}
	shutdown(): void {
		writeToClipboard('');
	}
}

export default ClipboardInterceptor;
