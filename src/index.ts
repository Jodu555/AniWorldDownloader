import NewM3u8Interceptor from './NewInterceptor';
import OldM3u8Interceptor from './OldInterceptor';
import { AniWorldSeriesInformations, ExtendedEpisodeDownload } from './types';

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const axios = require('axios');
const jsdom = require('jsdom');
require('dotenv').config();
const { fmt, readFromClipboard, parseToBoolean } = require('./utils');

// Series Info Loading
const anime = parseToBoolean(process.env.ANIME);
const upperfolder = parseToBoolean(process.env.UPPERFOLDER);
const NEW_COLLECTOR = parseToBoolean(process.env.NEW_COLLECTOR);
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

const wait = (ms) => new Promise((resolve, reject) => setTimeout(resolve, ms));

const listDlFile = process.env.LIST_NAME || title + '_dl.json';

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

	console.log('No Arguments Provided, Graceful Exit!');
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

		const mainName = ep.querySelector('.seasonEpisodeTitle strong').textContent;
		const secondName = ep.querySelector('.seasonEpisodeTitle span').textContent;

		out.push({ mainName, secondName, langs });
	});
	return out;
}

function write() {
	fs.writeFileSync(listDlFile, JSON.stringify(urls, null, 3), 'utf-8');
}

async function collect() {
	const oldInterceptor = new OldM3u8Interceptor();
	const newInterceptor = new NewM3u8Interceptor();
	if (NEW_COLLECTOR) {
		await newInterceptor.launch();
	}
	for (const obj of urls) {
		if (obj.m3u8 !== '') continue;
		if (obj.finished == true) continue;

		let url: string;
		if (NEW_COLLECTOR) {
			try {
				url = await newInterceptor.intercept(obj.url);
			} catch (error) {
				console.log('NewInterceptor Timeout!');
				process.exit(1);
			}
		} else {
			url = await oldInterceptor.getM3u8UrlFromURL(urls, obj);
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
}

async function download() {
	const possibleObjects = JSON.parse(fs.readFileSync(listDlFile, 'utf-8'));
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

async function startDownloading(obj, m3u8URL) {
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

async function deepM3u8Conversion(url, output) {
	const m3u8ToMp4 = require('m3u8-to-mp4');
	const converter = new m3u8ToMp4();
	await converter.setInputFile(url).setOutputFile(output).start();
}
