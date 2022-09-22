const fs = require('fs');
const path = require('path');
const axios = require('axios');
const jsdom = require("jsdom");
require('dotenv').config();
const robot = require("kbm-robot");


// Series Info Loading
const anime = process.env.ANIME;
const episodes = fmt(process.env.EPISODES);
const title = process.env.TITLE;
const start = process.env.URL_START;

const urls = [];


const wait = (ms) => new Promise((resolve, reject) => setTimeout(resolve, ms));

(async () => {
    await parseInformationsFromURL();
    return;
    //////////////////
    // Generating
    //////////////////
    if (fs.existsSync(title + '.json')) {
        const readUrls = JSON.parse(fs.readFileSync(title + '.json', 'utf-8'));

        const entries = episodes.reduce((p, c) => p + c, 0);
        if (entries == readUrls.length) {
            readUrls.forEach(e => { urls.push(e); });
        } else {
            console.log('List isnt fully generated');
            console.log('  Regenerating and comparing list');
            const full = generate();
            const output = [];

            full.forEach(e => {
                const item = readUrls.filter(x => e.url == x.url)[0];
                if (item != null) {
                    output.push(item);
                } else {
                    output.push(e);
                }
            });
            output.forEach(e => { urls.push(e); });
            write();
        }
    } else {
        generate().forEach(e => { urls.push(e); });
        write();
    }


    //NOTE: here must be the season before to delete the items
    // urls.splice(0, episodes[0] + 8)
    console.log(`Loaded ${urls.length} Urls!`);


    //TODO: Add an argument to download Movies
    // downloadMovie('name', 'url')

    if (process.argv.find(v => v.includes('help'))) {
        console.log(`| ------------- AniWorldDownloader - Help -------------`);
        console.log(`|`);
        console.log(`|  => collect : Collects the .m3u8 Urls for the given .env input`);
        console.log(`|  => download [n] : Downloads the before collected .m3u8 files based on the .env inpuit`);
        console.log(`|  => skip [n] : Skips n amount of entries Used for example to skip a season if its already downloaded`);
        console.log(`|`);
        console.log(`| ------------- AniWorldDownloader - Help -------------`);
        return;
    }

    if (process.argv.find(v => v.includes('skip'))) {
        const idx = process.argv.findIndex(v => v.includes('skip'))

        const skipAmt = Number(process.argv[idx + 1]);
        if (skipAmt == undefined || isNaN(skipAmt)) {
            console.log('You need to specify a Number how many entries you want to skip')
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


    process.argv.find(v => v.includes('collect')) && await collect();

    process.argv.find(v => v.includes('download')) && await download();

})();

async function parseInformationsFromURL() {

    // const re = /^(.*)St#(\d+) Flg#(\d+).mp4/igm;

    // const str = 'Akame ga Kill! St#1 Flg#8.mp4';

    // const [
    //     original,
    //     name,
    //     season,
    //     episode,
    // ] = re.exec(str)

    // console.log({
    //     original,
    //     name: name.trim(),
    //     season,
    //     episode,
    // });

    return;
    const response = await axios.get(start);
    const { document } = (new jsdom.JSDOM(response.data)).window;

    const seasonsUl = [...document.querySelectorAll('span')].find(e => e.textContent.includes('Staffeln:')).parentElement.parentElement;
    const seasonsTab = [...seasonsUl.querySelectorAll('li')].map(e => e.querySelector('a')?.title).filter(e => e != undefined);

    const numberOfSeasons = seasonsTab.filter(e => e.includes('Staffel')).length;
    const hasMovies = seasonsTab.find(e => e.includes('Film')) != null;


    const output = { url: start, hasMovies, seasons: new Array(numberOfSeasons) };

    if (hasMovies) {
        const movResponse = await axios.get(`${start}/filme`);
        output.movies = getListInformations(movResponse.data);
    }

    output.seasons[0] = getListInformations(response.data)
    for (let i = 1; i < numberOfSeasons; i++) {
        const seaResponse = await axios.get(`${start}/staffel-${i + 1}`);
        output.seasons[1] = getListInformations(seaResponse.data);
    }

    fs.writeFileSync('test.json', JSON.stringify(output, null, 3), 'utf8')
}

function getListInformations(data) {
    const { document } = (new jsdom.JSDOM(data)).window;
    const episodes = [...document.querySelectorAll('tr[itemprop="episode"]')];
    const out = [];
    episodes.forEach(ep => {
        let langs = [];
        [...ep.querySelectorAll('.editFunctions img')].forEach(lang => {
            langs.push(lang.src)
        })

        langs = langs.map(l => {
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
        })

        const mainName = ep.querySelector('.seasonEpisodeTitle strong').textContent;
        const secondName = ep.querySelector('.seasonEpisodeTitle span').textContent;

        out.push({ mainName, secondName, langs });
    });
    return out;
}

function generate() {
    const items = [];
    for (let i = 0; i < episodes.length; i++) {
        const season = i + 1;
        const episode = episodes[i];
        for (let j = 1; j < episode + 1; j++) {
            const obj = {
                finished: false,
                folder: `Season ${season}`,
                file: `${title} St.${season} Flg.${j}`,
                url: start + `staffel-${season}/episode-${j}`,
                m3u8: '',
            };
            items.push(obj);
        }
    }
    return items;
}

function write() {
    fs.writeFileSync(title + '.json', JSON.stringify(urls, null, 3), 'utf-8');
}

async function collect() {

    for (const obj of urls) {
        if (obj.m3u8 !== '') continue;
        if (obj.finished == true) continue;

        const url = await getM3u8UrlFromURL(obj.url);

        console.log('Collected: ' + url);
        if (!url.includes('https://') || urls.find(v => v.m3u8 == url) !== undefined) {
            console.log('Got suspicious program behaviour: Stopped!', !url.includes('https://'), urls.find(v => v.m3u8 == url) !== undefined);
            process.exit(1);
        }

        obj.m3u8 = url;

        write();
        await wait(1000);
    }
}

async function download() {
    const possibleObjects = JSON.parse(fs.readFileSync(title + '.json', 'utf-8'));
    const collectedObjects = possibleObjects.filter(o => o.m3u8 !== '' && o.finished !== true);
    console.log(`Stripped the whole ${possibleObjects.length} possible Videos down to the ${collectedObjects.length} downloadable Objects`);

    let i = 0;
    for (const obj of possibleObjects) {
        if (obj.m3u8 == '') continue;
        if (obj.finished == true) continue;
        console.log(`Started the download of ${obj.file}`);
        console.log(`  Download: ${i + 1} / ${collectedObjects.length}`);
        await startDownloading(obj, obj.m3u8)
        obj.finished = true;
        fs.writeFileSync(title + '.json', JSON.stringify(possibleObjects, null, 3), 'utf-8');
        i++;
    }
}

function fmt(env_VAR) {
    return env_VAR.split(' ').map(n => Number(n));
}

async function getM3u8UrlFromURL(url) {
    const URL_POS = fmt(process.env.URL_POS);
    const FIRST_NETWORK_REQUEST_POS = fmt(process.env.FIRST_NETWORK_REQUEST_POS);
    const URL_NETWORK_REQUEST_POS = fmt(process.env.URL_NETWORK_REQUEST_POS);
    const URL_COPY_BuTTON = fmt(process.env.URL_COPY_BuTTON);


    robot.startJar();

    robot
        .mouseMove(URL_POS[0], URL_POS[1])
    click(robot, 1)

    robotTypeAdvanced(robot, url);
    robot.press('ENTER').release('ENTER');

    await robot.go();

    await wait(5900);

    robot
        .mouseMove(FIRST_NETWORK_REQUEST_POS[0], FIRST_NETWORK_REQUEST_POS[1])
    click(robot, 1)
    robot.sleep(200)
        .mouseMove(URL_NETWORK_REQUEST_POS[0], URL_NETWORK_REQUEST_POS[1])
    click(robot, 1)
    click(robot, 3)
    robot.mouseMove(URL_COPY_BuTTON[0], URL_COPY_BuTTON[1])
        .sleep(200);
    click(robot, 3)
    await robot.go();

    const m3u8URL = await readFromClipboard();

    robot.stopJar();

    return m3u8URL;
}

function click(robot, btn) {
    robot.mousePress(btn)
        .mouseRelease(btn)
}

function robotTypeAdvanced(robot, string) {
    const typer = serializeForRobot(string);
    typer.forEach(data => {
        if (data.advanced == true) {
            robot.press('SHIFT')
                .type(data.key)
                .sleep(50)
                .release('SHIFT')
        } else {
            robot.typeString(data)
        }
    })
}

function serializeForRobot(string) {
    const mapper = {
        ':': '.',
        '/': '7',
    }

    let typer = [];

    let typeIdx = 0;

    for (const c of string) {
        if (mapper[c] != null) {
            typer.push({ advanced: true, key: mapper[c] })
            typeIdx += 2;
        } else {
            if (typer[typeIdx] == undefined)
                typer[typeIdx] = ''
            typer[typeIdx] += c;
        }
    }
    return typer;
}

async function downloadMovie(name, url) {
    const downloadPath = path.join(process.cwd(), 'Downloads', title, 'Movies');
    fs.mkdirSync(downloadPath, { recursive: true });
    console.log('Start');
    await deepM3u8Conversion(url, path.join(downloadPath, name + '.mp4'));
    console.log('Finished');
}

async function startDownloading(obj, m3u8URL) {
    let downloadPath = process.env.DOWNLOAD_PATH ? process.env.DOWNLOAD_PATH : path.join(process.cwd(), 'Downloads');

    anime ? (downloadPath = path.join(downloadPath, 'Aniworld')) : (downloadPath = path.join(downloadPath, 'STO'));

    downloadPath = path.join(downloadPath, title, obj.folder.replace(' ', '-'))
    fs.mkdirSync(downloadPath, { recursive: true });
    await deepM3u8Conversion(m3u8URL, path.join(downloadPath, obj.file.replaceAll('.', '#') + '.mp4'))
}

async function deepM3u8Conversion(url, output) {
    const m3u8ToMp4 = require("m3u8-to-mp4");
    const converter = new m3u8ToMp4();
    await converter
        .setInputFile(url)
        .setOutputFile(output)
        .start();
}

async function readFromClipboard() {
    return new Promise((resolve, _) => {
        import('clipboardy').then(clipboard => {
            resolve(clipboard.default.readSync());
        });
    })
}