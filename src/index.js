// // puppeteer-extra is a drop-in replacement for puppeteer,
// // it augments the installed puppeteer with plugin functionality
// const puppeteer = require('puppeteer-extra')

// // Add adblocker plugin, which will transparently block ads in all pages you
// // create using puppeteer.
// const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
// puppeteer.use(AdblockerPlugin())


const fs = require('fs');
const path = require('path');

const robot = require("kbm-robot");

const puppeteer = require('puppeteer-extra');
const stealth = require("puppeteer-extra-plugin-stealth")();
puppeteer.use(stealth);

const episodes = [12];
const title = 'A Chivalry of a Failed Knight';
const start = 'https://aniworld.to/anime/stream/a-chivalry-of-a-failed-knight/';

const urls = [];


const wait = (ms) => new Promise((resolve, reject) => setTimeout(resolve, ms));

(async () => {
    // const pathToExtension = `C:/Users/Jodu555/AppData/Local/Google/Chrome/User Data/Default/Extensions/cfhdojbkjhnklbpkdaibdccddilifddb/3.12_0`;
    // console.log(a.readdirSync(pathToExtension));

    // return;

    //////////////////
    // Generating
    //////////////////
    if (fs.existsSync(title + '.json')) {
        JSON.parse(fs.readFileSync(title + '.json', 'utf-8')).forEach(e => urls.push(e));
    } else {
        generate();
    }


    //NOTE: here must be the season before to delete the items
    urls.splice(0, episodes[0] + 8)
    console.log(urls);

    //////////////////
    // Collecting
    //////////////////

    // return;

    const output = [];

    let prevm3url = '';

    for (const obj of urls) {
        const url = await getM3u8UrlFromURL(obj.url);
        console.log('Collected: ' + url);
        if (!url.includes('https://') || url == prevm3url)
            process.exit(1);
        prevm3url = url;

        output.push({ ...obj, m3u8: url })
        fs.writeFileSync('output.json', JSON.stringify(output, null, 3), 'utf-8');
        await wait(1000);
    }

    // return;

    //////////////////
    // Downloading
    //////////////////

    // const collectedObjects = JSON.parse(fs.readFileSync('output.json', 'utf-8'));


    // let i = 0;
    // for (const obj of collectedObjects) {
    //     console.log(`Started the download of ${obj.file}`);
    //     console.log(`  Download: ${i + 1} / ${collectedObjects.length}`);
    //     await startDownloading(obj, obj.m3u8)
    //     i++;
    // }

})();

function generate() {
    for (let i = 0; i < episodes.length; i++) {
        const season = i + 1;
        const episode = episodes[i];
        for (let j = 1; j < episode + 1; j++) {
            const obj = {
                folder: `Season ${season}`,
                file: `${title} St.${season} Flg.${j}`,
                url: start + `staffel-${season}/episode-${j}`,
                m3u8: ''
            };
            urls.push(obj);
        }
    }

    fs.writeFileSync(title + '.json', JSON.stringify(urls, null, 3), 'utf-8')
}

async function getM3u8UrlFromURL(url) {

    robot.startJar();

    robot
        .mouseMove(-617, 45)
    click(robot, 1)

    robotTypeAdvanced(robot, url);
    robot.press('ENTER').release('ENTER');

    await robot.go();

    await wait(5800);

    robot
        .mouseMove(-2555, 222)
    click(robot, 1)
    robot.sleep(100)
        .mouseMove(-1954, 251)
    click(robot, 1)
    click(robot, 3)
    robot.mouseMove(-1943, 264)
        .sleep(100);
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


async function startBrowser(obj) {
    // const pathToExtension = 'C:\Users\Jodu555\AppData\Local\Google\Chrome\User Data\Default\Extensions\cfhdojbkjhnklbpkdaibdccddilifddb\3.12_0';
    const pathToExtension = `C:\\Users\\Jodu555\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Extensions\\cfhdojbkjhnklbpkdaibdccddilifddb\\3.12_0`;
    // const pathToExtension = `C:/Users/Jodu555/AppData/Local/Google/Chrome/User Data/Default/Extensions/cfhdojbkjhnklbpkdaibdccddilifddb/3.12_0`;
    const browser = await puppeteer.launch({
        defaultViewport: null,
        headless: false,
        devtools: true,
        executablePath: 'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe', // Windows
        // executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', // Windows
        // args: [
        //     `--disable-extensions-except=${pathToExtension}`,
        //     `--load-extension=${pathToExtension}`,
        // ],
    });
    // await wait(2000);
    // //To Close the initial adblock opener website
    // (await browser.pages()).forEach(p => {
    //     if (p.url().includes('chrome-extension'))
    //         p.close();
    // });
    // await wait(1000);
    const page = await browser.newPage();
    const client = await page.target().createCDPSession();

    // await page.setRequestInterception(true);
    // page.on('request', request => {
    //     if (request.resourceType() == 'image' || request.resourceType() == 'stylesheet' || request.resourceType() == 'font')
    //         return request.continue();

    //     if (request.url().includes('m3u8') || request.url().includes('delivery')) {
    //         console.log(request.resourceType(), request.url());
    //         request.continue()
    //     }

    //     request.continue()

    // });

    // To disable breakpoints use ctrl + f8 then f8 to skip ones


    await client.send('Network.enable');
    await client.send('Network.setRequestInterception', {
        patterns: [{
            urlPattern: '*'
        }]
    });

    await client.on('Network.requestIntercepted', async ({
        interceptionId,
        request,
        responseHeaders,
        resourceType
    }) => {
        console.log(request.url);
        if (request.url.includes('https://delivery-node-handal'))
            console.log('AIAIAIAIAAIAIAI');
        if (request.url.includes('m3u8')) {
            console.log(request.url);
        }

        client.send('Network.continueInterceptedRequest', {
            interceptionId
        });
    });
    await page.goto(obj.url);

    // await wait(15000);

    // console.log('Finished');
}

async function downloadMovie(name, url) {
    const downloadPath = path.join(process.cwd(), 'Downloads', title, 'Movies');
    fs.mkdirSync(downloadPath, { recursive: true });
    console.log('Start');
    await deepM3u8Conversion(url, path.join(downloadPath, name + '.mp4'));
    console.log('Finished');
}

async function startDownloading(obj, m3u8URL) {
    const downloadPath = path.join(process.cwd(), 'Downloads', title, obj.folder.replace(' ', '-'));
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