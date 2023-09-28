import fs from 'fs';
import * as puppeteer from 'puppeteer';
import { wait } from './utils';
import { AbstractInterceptor } from './types';

class NewM3u8Interceptor extends AbstractInterceptor {
	startupParameters: object;
	browser: puppeteer.Browser;
	page: puppeteer.Page;
	interval: NodeJS.Timer;
	constructor() {
		super();
		const pathToM3Extension = process.env.PATH_TO_M3U8_EXTENSION;
		this.startupParameters = {
			defaultViewport: null,
			headless: false,
			devtools: true,
			ignoreHTTPSErrors: true,
			executablePath: 'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe', // Windows
			args: [
				`--disable-extensions-except=${pathToM3Extension}`,
				`--load-extension=${pathToM3Extension}`,
				'--ignore-certificate-errors',
				'--ignore-certificate-errors-spki-list',
				'--disable-web-security',
				'--disable-features=IsolateOrigins,site-per-process',
			],
		};
	}
	async launch() {
		this.browser = await puppeteer.launch(this.startupParameters);
		this.page = await this.browser.newPage();
		await this.page.setCookie({ name: 'aniworld_session', value: process.env.ANIWORLD_SESSION, domain: 'aniworld.to' });
	}
	async intercept(url: string): Promise<string> {
		console.log('Got Interception:', url);

		return new Promise(async (resolve, reject) => {
			await this.page.goto(url);

			wait(1000);

			this.interval = setInterval(async () => {
				let m3u8: string | false;
				m3u8 = await this.page.evaluate(() => {
					const availableHosters = [...document.querySelectorAll<HTMLAnchorElement>('a.watchEpisode[itemprop=url]')]
						.filter((e) => e.parentElement.parentElement.style.display !== 'none')
						.map((e) => ({ name: e.querySelector('h4').textContent, redirectID: e.href.split('redirect/')[1] }));

					const currentFrame = [...document.querySelectorAll('iframe')].find((f) => f.src.includes('redirect'));
					const currentRedirectID = currentFrame.src.split('redirect/')[1];

					const currentHoster = availableHosters.find((x) => x.redirectID == currentRedirectID);

					console.log('currentHoster', currentHoster);

					const checkForHoster = (hoster: string) =>
						document.querySelector('i.' + hoster).parentElement.parentElement.parentElement.style.display !== 'none';

					if (checkForHoster('VOE') && currentHoster.name == 'VOE') {
						//VOE Host is Present and active
						console.log('VOE Host is Present and Active');
						return document.querySelector<HTMLElement>('span#myM3u8DivId')?.innerText;
					} else if (checkForHoster('Vidoza') && currentHoster.name == 'Vidoza') {
						//Vidoza Host is Present and active
						console.log('Vidoza Host is Present and Active');
						return false;
					} else if (checkForHoster('Streamtape') && currentHoster.name == 'Streamtape') {
						//Streamtape Host is Present and active
						console.log('Streamtape Host is Present and Active');
						return 'https:' + document.getElementById('botlink').innerText + '&stream=1';
					}
				});

				if (m3u8 == false) {
					const elementHandle = await this.page.$('div.inSiteWebStream iframe');
					const frame = await elementHandle.contentFrame();
					m3u8 = await frame.evaluate(() => {
						return document.querySelector('video')?.src;
					});
				}

				if (m3u8 != undefined) {
					clearInterval(this.interval);
					resolve(m3u8);
				}
			}, 1000);

			setTimeout(() => {
				clearInterval(this.interval);
				reject('Timeout');
			}, 60 * 1000);
		});
	}
	async shutdown() {
		clearInterval(this.interval);
		await this.page.close();
		await this.browser.close();
	}
}

export default NewM3u8Interceptor;
