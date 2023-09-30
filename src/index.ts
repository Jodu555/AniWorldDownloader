import NewInterceptor from './NewInterceptor';
import OldInterceptor from './OldInterceptor';
import ClipboardInterceptor from './ClipboardInterceptor';
import { AbstractInterceptor, AniWorldSeriesInformations, ExtendedEpisodeDownload } from './types';
import { fmt, readFromClipboard, parseToBoolean, wait } from './utils';

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import jsdom from 'jsdom';
import express from 'express';
const { exec } = require('child_process');
require('dotenv').config();

// Series Info Loading
const anime = parseToBoolean(process.env.ANIME);
const upperfolder = parseToBoolean(process.env.UPPERFOLDER);
const COLLECTOR_TYPE = process.env.INTERCEPTOR_TYPE || 'Clipboard';
const preferLangs = [process.env.PREFER_LANGS];
const fallbackLang = process.env.FALLBACK_LANG;
const title = process.env.TITLE;
const start = process.env.URL_START;

const urls: ExtendedEpisodeDownload[] = [];

process.on('unhandledRejection', (error) => {
	console.log('unhandledRejection');
	throw error;
});

process.on('uncaughtException', (error) => {
	console.log('uncaughtException');
	throw error;
});

let listDlFile = process.env.LIST_NAME || title + '_dl.json';

const app = express();

app.use(express.json());

app.use((req, res, next) => {
	if (req.headers?.token) {
		if (req.headers.token == process.env.API_TOKEN) {
			next();
			return;
		}
	}
	res.status(401).json({ error: 'Invalid Token Provided' });
});

if (process.argv.find((v) => v.includes('enable-http'))) {
	app.post('/upload', (req, res) => {
		const data: ExtendedEpisodeDownload[] = req.body.data;

		if (Array.isArray(data)) {
			const ID = Math.ceil(Math.random() * 100000);
			console.log(`Recieved Upload on ${ID}`);

			fs.writeFileSync(`${ID}.json`, JSON.stringify(data, null, 3));
			res.json({ ID });
		} else {
			res.status(500).json({ error: 'Malformed Data' });
		}
	});

	app.get('/collect/:ID', async (req, res) => {
		const ID = req.params.ID;
		console.log(`Recieved Collect on ${ID}`);
		if (fs.existsSync(`${ID}.json`)) {
			listDlFile = `${ID}.json`;
			const content: ExtendedEpisodeDownload[] = JSON.parse(fs.readFileSync(`${ID}.json`, 'utf-8'));
			urls.length = 0;
			content.forEach((e) => urls.push(e));
			await collect();
			res.json({ success: true });
		} else {
			res.status(500).json({ error: 'Invalid ID' });
		}
	});

	app.get('/download/:ID', async (req, res) => {
		const ID = req.params.ID;
		console.log(`Recieved Download on ${ID}`);
		if (fs.existsSync(`${ID}.json`)) {
			listDlFile = `${ID}.json`;
			const content: ExtendedEpisodeDownload[] = JSON.parse(fs.readFileSync(`${ID}.json`, 'utf-8'));
			urls.length = 0;
			content.forEach((e) => urls.push(e));
			await download();
			res.json({ success: true });
		} else {
			res.status(500).json({ error: 'Invalid ID' });
		}
	});

	app.get('/finish/:ID', async (req, res) => {
		const ID = req.params.ID;
		console.log(`Recieved Finish on ${ID}`);
		if (fs.existsSync(`${ID}.json`)) {
			fs.rmSync(`${ID}.json`);
			res.json({ success: true });
		} else {
			res.status(500).json({ error: 'Invalid ID' });
		}
	});

	const PORT = process.env.PORT || 1779;
	app.listen(PORT, () => {
		console.log(`API Listening on ${PORT}`);
	});
}

(async () => {
	if (process.argv.find((v) => v.includes('help'))) {
		console.log(`| ------------- AniWorldDownloader - Help -------------`);
		console.log(`|`);
		console.log(`|  => collect : Collects the .m3u8 Urls for the given .env input`);
		console.log(`|  => download [n] : Downloads the before collected .m3u8 files based on the .env inpuit`);
		console.log(`|  => skip [n] : Skips n amount of entries Used for example to skip a season if its already downloaded`);
		console.log(`|`);
		console.log(`| ------------- AniWorldDownloader - Help -------------`);
		return;
	}

	if (process.argv.find((v) => v.includes('parse'))) {
		const output: AniWorldSeriesInformations = await parseInformationsFromURL();

		const downloadObjects: ExtendedEpisodeDownload[] = [];

		output.seasons.forEach((season, se) => {
			season.forEach((ent, ep) => {
				const add = (lng) => {
					downloadObjects.push({
						finished: false,
						folder: `Season ${se + 1}`,
						file: `${title} St.${se + 1} Flg.${ep + 1}_${lng}`,
						url: start + `staffel-${se + 1}/episode-${ep + 1}`,
						m3u8: '',
					});
				};

				const languages = ent.langs.filter((e) => preferLangs.find((x) => x.includes(e)));
				if (languages.length == 0) {
					// The preferLangs dont match
					if (ent.langs.filter((e) => e.includes(fallbackLang))) {
						add(fallbackLang);
					}
				}
				languages.forEach((language) => {
					add(language);
				});
			});
		});

		if (output.hasMovies)
			output.movies.forEach((ent, movie) => {
				const languages = ent.langs.filter((e) => preferLangs.find((x) => x.includes(e)));
				languages.forEach((language) => {
					downloadObjects.push({
						finished: false,
						folder: `Movies`,
						file: `${ent.mainName}_${language}`,
						url: start + `filme/film-${movie + 1}`,
						m3u8: '',
					});
				});
			});

		fs.writeFileSync(title + '.json', JSON.stringify(output, null, 3), 'utf8');
		fs.writeFileSync(listDlFile, JSON.stringify(downloadObjects, null, 3), 'utf8');
	}

	if (!fs.existsSync(listDlFile)) {
		console.log(title, 'Got not parsed yet please choose parse as the first option to use');
	} else {
		JSON.parse(fs.readFileSync(listDlFile, 'utf8')).forEach((e) => urls.push(e));
	}

	if (process.argv.find((v) => v.includes('skip'))) {
		const idx = process.argv.findIndex((v) => v.includes('skip'));

		const skipAmt = Number(process.argv[idx + 1]);
		if (skipAmt == undefined || isNaN(skipAmt)) {
			console.log('You need to specify a Number how many entries you want to skip');
			return;
		}

		let skipptr = skipAmt;
		for (let i = 0; i < urls.length; i++) {
			const element = urls[i];
			if (element.finished == false && skipptr > 0) {
				element.finished = true;
				skipptr--;
			}
		}
		console.log(`Skipped ${skipAmt} entries!`);
		write();
	}

	process.argv.find((v) => v.includes('collect')) && (await collect());

	process.argv.find((v) => v.includes('download')) && (await download());

	console.log('No Arguments Provided!');
})();

async function parseInformationsFromURL(): Promise<AniWorldSeriesInformations> {
	const response = await axios.get(start);
	const { document } = new jsdom.JSDOM(response.data).window;

	const seasonsUl = [...document.querySelectorAll('span')].find((e) => e.textContent.includes('Staffeln:')).parentElement.parentElement;
	const seasonsTab = [...seasonsUl.querySelectorAll('li')].map((e) => e.querySelector('a')?.title).filter((e) => e != undefined);

	const numberOfSeasons = seasonsTab.filter((e) => e.includes('Staffel')).length;
	const hasMovies = seasonsTab.find((e) => e.includes('Film')) != null;

	const output: AniWorldSeriesInformations = { url: start, hasMovies, seasons: new Array(numberOfSeasons) };

	console.log('Parsed: ');
	console.log(' ' + start);
	console.log(`   => Seasons: ${numberOfSeasons} - Movies: ${hasMovies}`);

	if (hasMovies) {
		const movResponse = await axios.get(`${start}/filme`);
		output.movies = getListInformations(movResponse.data);
		console.log(`    => Got ${output.movies.length} Movies`);
	}

	output.seasons[0] = getListInformations(response.data);
	console.log(`    => Got Season ${0} with ${output.seasons[0].length} Episodes`);
	for (let i = 1; i < numberOfSeasons; i++) {
		const seaResponse = await axios.get(`${start}/staffel-${i + 1}`);
		output.seasons[i] = getListInformations(seaResponse.data);
		console.log(`    => Got Season ${i} with ${output.seasons[i].length} Episodes`);
	}
	return output;
}

function getListInformations(data) {
	const { document } = new jsdom.JSDOM(data).window;
	const episodes = [...document.querySelectorAll('tr[itemprop="episode"]')];
	const out = [];
	episodes.forEach((ep) => {
		let langs = [];
		[...ep.querySelectorAll('.editFunctions img')].forEach((lang) => {
			langs.push(lang.src);
		});

		langs = langs.map((l) => {
			switch (l) {
				case '/public/img/german.svg':
					return 'GerDub';
				case '/public/img/japanese-german.svg':
					return 'GerSub';
				case '/public/img/japanese-english.svg':
					return 'EngSub';
				default:
					break;
			}
			if (l.includes('german.svg')) {
				return 'GerDub';
			}
			if (l.includes('english.svg')) {
				return 'EngDub';
			}
		});

		const mainName = ep.querySelector('.seasonEpisodeTitle strong')?.textContent;
		const secondName = ep.querySelector('.seasonEpisodeTitle span')?.textContent;

		out.push({ mainName, secondName, langs });
	});
	return out;
}

function write() {
	fs.writeFileSync(listDlFile, JSON.stringify(urls, null, 3), 'utf-8');
}

async function collect() {
	let interceptor: AbstractInterceptor = null;
	type CollectorTypes = 'Old' | 'New' | 'Clipboard';
	const collectorType: CollectorTypes = COLLECTOR_TYPE as CollectorTypes;

	console.log('Using Collector:', collectorType);

	switch (collectorType) {
		case 'Old':
			interceptor = new OldInterceptor();
			break;
		case 'New':
			interceptor = new NewInterceptor();
			break;
		case 'Clipboard':
			interceptor = new ClipboardInterceptor();
			break;
	}

	await interceptor.launch();

	for (const obj of urls) {
		if (obj.m3u8 !== '') continue;
		if (obj.finished == true) continue;

		console.log('Got Interception:', obj.url);

		let url: string;
		try {
			url = await interceptor.intercept(obj.url, urls);
		} catch (error) {
			console.log('Interceptor Timeout!');
			url = await interceptor.intercept(obj.url, urls);
		}

		console.log('Collected: ' + url);
		if (!url.includes('https://') || urls.find((v) => v.m3u8 == url) !== undefined) {
			console.log('Got suspicious program behaviour: Stopped!', !url.includes('https://'), urls.find((v) => v.m3u8 == url) !== undefined);
			process.exit(1);
		}

		obj.m3u8 = url;

		write();
		await wait(1000);
	}

	await interceptor.shutdown();

	// const oldInterceptor = new OldM3u8Interceptor();
	// const newInterceptor = new NewM3u8Interceptor();
	// if (NEW_COLLECTOR) {
	// 	await newInterceptor.launch();
	// }
	// for (const obj of urls) {
	// 	if (obj.m3u8 !== '') continue;
	// 	if (obj.finished == true) continue;

	// 	let url: string;
	// 	if (NEW_COLLECTOR) {
	// 		try {
	// 			url = await newInterceptor.intercept(obj.url);
	// 		} catch (error) {
	// 			console.log('NewInterceptor Timeout!');
	// 			url = await newInterceptor.intercept(obj.url);
	// 			// newInterceptor.shutdown();
	// 			// process.exit(1);
	// 		}
	// 	} else {
	// 		url = await oldInterceptor.getM3u8UrlFromURL(urls, obj);
	// 	}

	// 	console.log('Collected: ' + url);
	// 	if (!url.includes('https://') || urls.find((v) => v.m3u8 == url) !== undefined) {
	// 		console.log('Got suspicious program behaviour: Stopped!', !url.includes('https://'), urls.find((v) => v.m3u8 == url) !== undefined);
	// 		process.exit(1);
	// 	}

	// 	obj.m3u8 = url;

	// 	write();
	// 	await wait(1000);
	// }

	// newInterceptor.shutdown();
}

async function download() {
	const possibleObjects = JSON.parse(fs.readFileSync(listDlFile, 'utf-8')) as ExtendedEpisodeDownload[];
	const collectedObjects = possibleObjects.filter((o) => o.m3u8 !== '' && o.finished !== true);
	console.log(`Stripped the whole ${possibleObjects.length} possible Videos down to the ${collectedObjects.length} downloadable Objects`);

	let i = 0;
	for (const obj of possibleObjects) {
		if (obj.m3u8 == '') continue;
		if (obj.finished == true) continue;
		console.log(`Started the download of ${obj.file}`);
		console.log(`  Download: ${i + 1} / ${collectedObjects.length}`);
		await startDownloading(obj, obj.m3u8);
		obj.finished = true;
		fs.writeFileSync(listDlFile, JSON.stringify(possibleObjects, null, 3), 'utf-8');
		i++;
	}
}

async function startDownloading(obj: ExtendedEpisodeDownload, m3u8URL: string) {
	let downloadPath = process.env.DOWNLOAD_PATH ? process.env.DOWNLOAD_PATH : path.join(process.cwd(), 'Downloads');

	// console.log('DEBUG startDownloading() ', {
	// 	downloadPath,
	// 	upperfolder,
	// 	anime,
	// 	env: { ANIME: process.env.ANIME, UPPERFOLDER: process.env.UPPERFOLDER },
	// });

	if (upperfolder) {
		anime ? (downloadPath = path.join(downloadPath, 'Aniworld')) : (downloadPath = path.join(downloadPath, 'STO'));
	}

	if (obj._animeFolder || obj._seriesFolder) {
		downloadPath = path.join(downloadPath, obj._animeFolder || obj._seriesFolder, obj.folder.replace(' ', '-'));
	} else {
		downloadPath = path.join(downloadPath, title, obj.folder.replace(' ', '-'));
	}
	fs.mkdirSync(downloadPath, { recursive: true });
	await deepM3u8Conversion(m3u8URL, path.join(downloadPath, obj.file.replaceAll('.', '#') + '.mp4'));
}

async function deepM3u8Conversion(url: string, output: string) {
	const m3u8ToMp4 = require('m3u8-to-mp4');
	const converter = new m3u8ToMp4();
	await converter.setInputFile(url).setOutputFile(output).start();
}
