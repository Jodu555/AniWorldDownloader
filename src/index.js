// // puppeteer-extra is a drop-in replacement for puppeteer,
// // it augments the installed puppeteer with plugin functionality
// const puppeteer = require('puppeteer-extra')

// // Add adblocker plugin, which will transparently block ads in all pages you
// // create using puppeteer.
// const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
// puppeteer.use(AdblockerPlugin())

const fs = require('fs');


const puppeteer = require('puppeteer')

const seasons = 2, episodes = [26, 13];
const title = 'The Irregular at Magic High School';
const start = 'https://aniworld.to/anime/stream/the-irregular-at-magic-high-school/';

const urls = [];

const wait = (ms) => new Promise((resolve, reject) => setTimeout(resolve, ms));

(async () => {
    // const pathToExtension = `C:/Users/Jodu555/AppData/Local/Google/Chrome/User Data/Default/Extensions/cfhdojbkjhnklbpkdaibdccddilifddb/3.12_0`;
    // console.log(fs.readdirSync(pathToExtension));

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

    // console.log(urls);
    console.log(urls[0]);
    startBrowser(urls[0]);

})();

async function startBrowser(obj) {
    // const pathToExtension = 'C:\Users\Jodu555\AppData\Local\Google\Chrome\User Data\Default\Extensions\cfhdojbkjhnklbpkdaibdccddilifddb\3.12_0';
    const pathToExtension = `C:\\Users\\Jodu555\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Extensions\\cfhdojbkjhnklbpkdaibdccddilifddb\\3.12_0`;
    // const pathToExtension = `C:/Users/Jodu555/AppData/Local/Google/Chrome/User Data/Default/Extensions/cfhdojbkjhnklbpkdaibdccddilifddb/3.12_0`;
    const browser = await puppeteer.launch({
        headless: false,
        devtools: true,
        executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', // Windows
        args: [
            `--disable-extensions-except=${pathToExtension}`,
            `--load-extension=${pathToExtension}`,
        ],
    });
    await wait(4000);
    const page = await browser.newPage();
    const client = await page.target().createCDPSession();




    // await client.send('Network.enable');
    await client.send('Network.setRequestInterception', {
        patterns: [{
            urlPattern: '*'
        }]
    });

    client.on('Network.requestIntercepted', async ({
        interceptionId,
        request,
        responseHeaders,
        resourceType
    }) => {
        console.log(request.url);
        if (request.url.includes('m3u8')) {
            console.log('INFO', request.url);
            //TODO: Start the m3u8 file
        }
        client.send('Network.continueInterceptedRequest', {
            interceptionId
        });
    });
    await wait(900);
    await page.goto(obj.url);

    await page.evaluate(() => {
        // localStorage.setItem('mature', 'true')
        // localStorage.setItem('video-muted', '{"default":false}')
        // localStorage.setItem('volume', '0.5')
        // localStorage.setItem('video-quality', '{"default":"chunked"}')
    });

    // await wait(15000);

    // console.log('Finished');
}

async function startDownloading(obj, m3u8URL) {

}