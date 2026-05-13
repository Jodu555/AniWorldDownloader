import { AbstractInterceptor, ExtendedEpisodeDownload } from './types';
import ncp from 'node-clipboardy';

async function writeToClipboard(text: string) {
	return ncp.writeSync(text);
}

async function readFromClipboard(): Promise<string> {
	return ncp.readSync();
}

class ClipboardInterceptor extends AbstractInterceptor {
	interval!: NodeJS.Timer;
	launch(): void {
		writeToClipboard('');
	}
	intercept(url: string, urls?: ExtendedEpisodeDownload[]): Promise<string> {
		return new Promise(async (resolve, reject) => {
			await writeToClipboard(url);
			if (this.interval) clearInterval(this.interval);
			let globalTimeout;
			this.interval = setInterval(async () => {
				try {
					let localTimeout;
					const curRead = await Promise.race([readFromClipboard(), new Promise<string>((res, rej) => {
						localTimeout = setTimeout(() => {
							console.log('readFromClipboard Timeout');
							rej('Timeout');
						}, 1000 * 15)
					})]);
					clearTimeout(localTimeout);
					if (curRead.trim() != url) {
						clearInterval(this.interval);
						clearTimeout(globalTimeout);
						resolve(curRead);
					}
				} catch (error) {
					console.log(error);
				}
			}, 400);

			globalTimeout = setTimeout(() => {
				clearInterval(this.interval);
				clearTimeout(globalTimeout);
				reject('Timeout');
			}, 60 * 1000);
		});
	}
	shutdown(): void {
		clearInterval(this.interval);
		writeToClipboard('');
	}
}

export default ClipboardInterceptor;
