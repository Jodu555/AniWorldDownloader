// // puppeteer-extra is a drop-in replacement for puppeteer,
// // it augments the installed puppeteer with plugin functionality
// const puppeteer = require('puppeteer-extra')

// // Add adblocker plugin, which will transparently block ads in all pages you
// // create using puppeteer.
// const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
// puppeteer.use(AdblockerPlugin())

const fs = require('fs');
const path = require('path');


const puppeteer = require('puppeteer-extra')
const stealth = require("puppeteer-extra-plugin-stealth")();
puppeteer.use(stealth);

const seasons = 2, episodes = [26, 13];
const title = 'The Irregular at Magic High School';
const start = 'https://aniworld.to/anime/stream/the-irregular-at-magic-high-school/';

const urls = [];

const m3Urls = [
    'https://delivery-node-najjar.voe-network.net/hls/,6oarnceute33cszcryj5bnjo5krlipygltafkpryvlwgqhivybxyaiitmtna,.urlset/master.m3u8',
    'https://delivery-node-wardah.voe-network.net/hls/,6oarnbeute33cszcryj5bnb6wolcebdkyyjcpe3kkcidijgyxr2ixtby7ykq,.urlset/master.m3u8',
    'https://delivery-node-fatima.voe-network.net/hls/,6oarm7mvte33cszcryj5bidw5acpgzgl5kdpdadm6uexbvt7gmp2okaw7t6a,.urlset/master.m3u8',
    'https://delivery-node-walliyullah.voe-network.net/hls/,6oarno2ioy3lcszcryj5bolsxmhe7omqbdsoijylu6mooj2et2zha2jrtqua,.urlset/master.m3u8',
    'https://delivery-node-imad.voe-network.net/hls/,6oarman3xu3lcszcr3657yzmv4pgehujgr2zsnbefuxnnn23tvt2wat372eq,.urlset/master.m3u8',
    'https://delivery-node-waddah.voe-network.net/hls/,6oarmfv3xu3lcszcr3657oza5kbvqdzdoqaxnxx2wwissmiwgt2h6wlv2tpa,.urlset/master.m3u8',
    'https://delivery-node-nida.voe-network.net/hls/,6oarmf53xu3lcszcr3657mrpxtxug7osubkulac5ycajxqhkuyxwksuvvz6q,.urlset/master.m3u8',
    'https://delivery-node-maloof.voe-network.net/hls/,6oarmcf3xu3lcszcr3657pj6vam5pof4pxvprbhrs4ss7xb4xu4t7xqulc5a,.urlset/master.m3u8',
    'https://delivery-node-shifa.voe-network.net/hls/,6oarn4sioy3lcszcr3zn7nrmwtr42giecgvpcna2ecbmratobc6ahplyqw7q,.urlset/master.m3u8',
    'https://delivery-node-tharaa.voe-network.net/hls/,6oarneu7xy3lcszcr3zn723t5n6s5wespvvuym6pgzjx2iyczips3y4vb2qq,.urlset/master.m3u8',
    'https://delivery-node-fatima.voe-network.net/hls/,6oarndu7xy3lcszcr3zn7pro4cr4omyu6zewbi6sft3rgouejxqogof7okxa,.urlset/master.m3u8',
    'https://delivery-node-saleem.voe-network.net/hls/,6oarnbe7xy3lcszcr3zn73zj5lasos6xds44yrpbrssydxp3mrsb3fdhjdqa,.urlset/master.m3u8',
    'https://delivery-node-jarir.voe-network.net/hls/,6oarm4e4xy3lcszcr3zn7lrmvyznh67sqtbu6jv4ufgk7ebkeot5y4ieet3q,.urlset/master.m3u8',
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

    //NOTE: here must be the season before to delete the items
    urls.splice(0, episodes[0])
    // console.log(urls);

    // return;

    let i = 0;
    for (const m3url of m3Urls) {
        console.log(`Started the download of ${urls[i].file}`);
        console.log(`  Download: ${i + 1} / ${m3Urls.length + 1}`);
        await startDownloading(urls[i], m3url)
        i++;
    }

})();

async function startBrowser(obj) {
    // const pathToExtension = 'C:\Users\Jodu555\AppData\Local\Google\Chrome\User Data\Default\Extensions\cfhdojbkjhnklbpkdaibdccddilifddb\3.12_0';
    const pathToExtension = `C:\\Users\\Jodu555\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Extensions\\cfhdojbkjhnklbpkdaibdccddilifddb\\3.12_0`;
    // const pathToExtension = `C:/Users/Jodu555/AppData/Local/Google/Chrome/User Data/Default/Extensions/cfhdojbkjhnklbpkdaibdccddilifddb/3.12_0`;
    const browser = await puppeteer.launch({
        defaultViewport: null,
        headless: false,
        devtools: true,
        executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', // Windows
        args: [
            `--disable-extensions-except=${pathToExtension}`,
            `--load-extension=${pathToExtension}`,
        ],
    });
    await wait(2000);
    //To Close the initial adblock opener website
    (await browser.pages()).forEach(p => {
        if (p.url().includes('chrome-extension'))
            p.close();
    });
    await wait(1000);
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

async function startDownloading(obj, m3u8URL) {
    const downloadPath = path.join(process.cwd(), 'Downloads', title, obj.folder.replace(' ', '-'));
    fs.mkdirSync(downloadPath, { recursive: true });
    deepM3u8Conversion(m3u8URL, path.join(downloadPath, obj.file.replaceAll('.', '#') + '.mp4'))
}

async function deepM3u8Conversion(url, output) {
    const m3u8ToMp4 = require("m3u8-to-mp4");
    const converter = new m3u8ToMp4();
    await converter
        .setInputFile(url)
        .setOutputFile(output)
        .start();
}