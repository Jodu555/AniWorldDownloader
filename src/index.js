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

const puppeteer = require('puppeteer-extra')
const stealth = require("puppeteer-extra-plugin-stealth")();
puppeteer.use(stealth);

const seasons = 2, episodes = [26, 13];
const title = 'The Irregular at Magic High School';
const start = 'https://aniworld.to/anime/stream/the-irregular-at-magic-high-school/';

const urls = [];

const m3Urls = [
]

const wait = (ms) => new Promise((resolve, reject) => setTimeout(resolve, ms));

(async () => {
    // const pathToExtension = `C:/Users/Jodu555/AppData/Local/Google/Chrome/User Data/Default/Extensions/cfhdojbkjhnklbpkdaibdccddilifddb/3.12_0`;
    // console.log(a.readdirSync(pathToExtension));

    // return;

    for (let i = 0; i < seasons; i++) {
        const season = i + 1;
        const episode = episodes[i];
        for (let j = 1; j < episode + 1; j++) {
            const obj = {
                folder: `Season ${season}`,
                file: `${title} St.${season} Flg.${j}`,
                url: start + `staffel-${season}/episode-${j}`
            };
            urls.push(obj);
        }
    }

    roboterControl(urls[0]);

    return;

    //NOTE: here must be the season before to delete the items
    urls.splice(0, episodes[0])
    // console.log(urls);


    let i = 0;
    for (const m3url of m3Urls) {
        console.log(`Started the download of ${urls[i].file}`);
        console.log(`  Download: ${i + 1} / ${m3Urls.length + 1}`);
        await startDownloading(urls[i], m3url)
        i++;
    }

})();

async function roboterControl(obj) {

    console.log(obj);


    robot.startJar();



    await robot
        .mouseMove(-617, 45)
        .mousePress(1)
        .mouseRelease(1)
        .go();
    robotTypeAdvanced(robot, obj.url);
    robot.press('ENTER').release('ENTER');
    await robot.go();
    robot.stopJar();
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