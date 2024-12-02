import fs from 'fs';
import path from 'path';
import * as puppeteer from 'puppeteer';
import { wait } from './utils';
import { AbstractInterceptor } from './types';

class NewInterceptor extends AbstractInterceptor {
	startupParameters: object;
	browser: puppeteer.Browser;
	page: puppeteer.Page;
	interval: NodeJS.Timeout;
	constructor() {
		super();

		const pathToM3Extension = this._handleExtensionPath(process.env.PATH_TO_M3U8_EXTENSION);
		const pathToAdGuardExtension = this._handleExtensionPath(process.env.PATH_TO_ADGUARD_EXTENSION);
		// let pathToM3Extension = process.env.PATH_TO_M3U8_EXTENSION;
		// if (!fs.existsSync(path.join(pathToM3Extension, 'manifest.json'))) {
		// 	const dirs = fs.readdirSync(pathToM3Extension);
		// 	console.log('No Version Provided fallback to 1st version', dirs[0]);
		// 	pathToM3Extension = path.join(pathToM3Extension, dirs[0]);
		// }
		this.startupParameters = {
			defaultViewport: null,
			headless: false,
			devtools: false,
			ignoreHTTPSErrors: true,
			executablePath: process.env.PATH_TO_BRAVE_EXE || 'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe', // Windows
			args: [
				`--disable-extensions-except=${pathToM3Extension},${pathToAdGuardExtension}`,
				`--load-extension=${pathToM3Extension},${pathToAdGuardExtension}`,
				'--ignore-certificate-errors',
				'--ignore-certificate-errors-spki-list',
				'--disable-web-security',
				'--disable-features=IsolateOrigins,site-per-process',
			],
		};
	}
	_handleExtensionPath(extPath: string): string {
		if (!fs.existsSync(path.join(extPath, 'manifest.json'))) {
			const dirs = fs.readdirSync(extPath);
			console.log('No Version Provided fallback to 1st version', dirs[0]);
			extPath = path.join(extPath, dirs[0]);
		}
		return extPath;
	}
	async launch() {
		this.browser = await puppeteer.launch(this.startupParameters);
		this.page = await this.browser.newPage();
		await this.page.setCookie({ name: 'aniworld_session', value: process.env.ANIWORLD_SESSION, domain: 'aniworld.to' });
	}
	async intercept(url: string): Promise<string> {
		return new Promise(async (resolve, reject) => {
			await this.page.goto(url);

			wait(1000);

			let currentHoster = 0;

			let ints: NodeJS.Timeout[] = [];

			this.interval = setInterval(async () => {
				let m3u8: 'Vidoza' | 'Streamtape' | 'Doodstream' | string;
				const forceHoster = process.env.FORCE_HOSTER;
				m3u8 = await this.page.evaluate(
					({ FORCE_HOSTER }) => {
						try {
							const availableHosters = [...document.querySelectorAll<HTMLAnchorElement>('a.watchEpisode[itemprop=url]')]
								.filter((e) => e.parentElement.parentElement.style.display !== 'none')
								.map((e) => ({
									name: e.querySelector('h4').textContent,
									redirectID: e.href.split('redirect/')[1],
									button: e.querySelector<HTMLButtonElement>('.hosterSiteVideoButton'),
								}));

							const currentFrame = [...document.querySelectorAll('iframe')].find((f) => f.src.includes('redirect'));
							const currentRedirectID = currentFrame?.src.split('redirect/')[1];

							const currentHoster = availableHosters.find((x) => x.redirectID == currentRedirectID);

							if (currentHoster.name !== FORCE_HOSTER) {
								if (availableHosters.find((x) => x.name == FORCE_HOSTER)) {
									availableHosters.find((x) => x.name == FORCE_HOSTER).button.click();
									return;
								} else {
									console.log('Force Hoster not available');
								}
							}

							console.log('currentHoster', currentHoster);

							const checkForHoster = (hoster: string) =>
								[...document.querySelectorAll('i.' + hoster)].some((e) => e.parentElement.parentElement.parentElement.style.display !== 'none');

							if (checkForHoster('VOE') && currentHoster.name == 'VOE') {
								//VOE Host is Present and active
								document.querySelector<HTMLDivElement>('div.plyr__video-wrapper')?.click();
								console.log('VOE Host is Present and Active');
								console.log('m3u8 element', document.querySelector<HTMLElement>('span#m3u8LinkText'));
								return document.querySelector<HTMLElement>('span#m3u8LinkText')?.innerText || 'VOE';
							} else if (checkForHoster('Vidoza') && currentHoster.name == 'Vidoza') {
								//Vidoza Host is Present and active
								console.log('Vidoza Host is Present and Active');
								return 'Vidoza';
							} else if (checkForHoster('Streamtape') && currentHoster.name == 'Streamtape') {
								//Streamtape Host is Present and active
								console.log('Streamtape Host is Present and Active');
								// console.log('#botlink', document.getElementById('botlink'));
								return 'Streamtape';
							} else if (checkForHoster('Doodstream') && currentHoster.name == 'Doodstream') {
								//Streamtape Host is Present and active
								console.log('Doodstream Host is Present and Active');
								// console.log('#botlink', document.getElementById('botlink'));
								return 'Doodstream';
							}
						} catch (error) {
							return document.querySelector<HTMLElement>('span#m3u8LinkText')?.innerText;
						}
					},
					{ FORCE_HOSTER: forceHoster }
				);

				// console.log('first m3u8 info return', m3u8);

				if (m3u8 == 'VOE') {
					const elementHandle = await this.page.$('div.inSiteWebStream iframe');
					const frame = await elementHandle.contentFrame();
					await frame.evaluate(() => {
						document.querySelector<HTMLButtonElement>('.vds-button.voe-play.play-centered')?.click();
						// document.querySelector<HTMLButtonElement>('div.voe-play.play-centered')?.click();
						return;
					});
				} else if (m3u8 == 'Vidoza' || m3u8 == 'Doodstream') {
					const elementHandle = await this.page.$('div.inSiteWebStream iframe');
					const frame = await elementHandle.contentFrame();
					m3u8 = await frame.evaluate(() => {
						return document.querySelector('video')?.src;
					});
				} else if (m3u8 == 'Streamtape') {
					const elementHandle = await this.page.$('div.inSiteWebStream iframe');
					const frame = await elementHandle.contentFrame();
					m3u8 = await frame.evaluate(() => {
						console.log(document.getElementById('botlink'));
						if (document.getElementById('botlink')) {
							return 'https:' + document.getElementById('botlink')?.innerText + '&stream=1';
						}
					});
				}

				if (m3u8 != undefined && m3u8 != 'Doodstream' && m3u8 != 'VOE') {
					clearInterval(this.interval);
					for (const int of ints) {
						clearInterval(int);
					}
					resolve(m3u8);
				}
			}, 1000);

			const switchHoster = () => {
				console.log('Switching Hoster', currentHoster);
				try {
					this.page.evaluate((currentHoster: string) => {
						const availableHosters = [...document.querySelectorAll<HTMLAnchorElement>('a.watchEpisode[itemprop=url]')]
							.filter((e) => e.parentElement.parentElement.style.display !== 'none')
							.map((e) => ({
								name: e.querySelector('h4').textContent,
								redirectID: e.href.split('redirect/')[1],
								button: e.querySelector<HTMLButtonElement>('.hosterSiteVideoButton'),
							}));
						availableHosters[parseInt(currentHoster) % availableHosters.length].button.click();
					}, String(currentHoster));
				} catch (error) {
					console.error('Error Switching Hoster to', currentHoster);
				}
			};

			ints.push(
				setTimeout(() => {
					currentHoster++;
					switchHoster();
				}, 30 * 1000)
			);

			ints.push(
				setTimeout(() => {
					currentHoster++;
					switchHoster();
				}, 60 * 1000)
			);

			ints.push(
				setTimeout(() => {
					clearInterval(this.interval);
					reject('Timeout');
				}, 90 * 1000)
			);
		});
	}
	async shutdown() {
		clearInterval(this.interval);
		await this.page.close();
		await this.browser.close();
	}
}

export default NewInterceptor;
