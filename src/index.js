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
    'https://delivery-node-kassab.voe-network.net/hls/,6oarmxfuum33cszcr365fkr7wyxqk4lwisu3jl7tny7ucyk2wq5vqszqvvxa,.urlset/master.m3u8',
    'https://delivery-node-handal.voe-network.net/hls/,6oarnztao43lcszcrycmlpbaw3anaic6f7663enx52wugtt7sumwrelbyfcq,.urlset/master.m3u8',
    'https://delivery-node-rayyaa.voe-network.net/hls/,6oarmx5uum33cszcr365fmrlxj3xmgjluzxmzohdr6jyrsrna76ypmtmumwq,.urlset/master.m3u8',
    'https://delivery-node-ishaq.voe-network.net/hls/,6oarmwnuum33cszcr365fl3sxx3bicgcab2wh6p5wozja5iuofn5tnlqi6na,.urlset/master.m3u8',
    'https://delivery-node-shamoon.voe-network.net/hls/,6oarmxvuum33cszcr365fmtt5o6r6eg2dprvfxu7u6nqvcymfvsjedvkcsda,.urlset/master.m3u8',
    'https://delivery-node-malak.voe-network.net/hls/,6oarmu5uum33cszcr365fm3twsjwlw525y5foqgrugn34lvzbqg6apkmaxaq,.urlset/master.m3u8',
    'https://delivery-node-aladdin.voe-network.net/hls/,6oarmw5uum33cszcr365f3txv22ek5dwehwjrexxde5wfbjorvjmpg6aksza,.urlset/master.m3u8',
    'https://delivery-node-jabalah.voe-network.net/hls/,6oarmvfuum33cszcr365f3z6xkm53w7l6wwruit2pmsxukc62che4e7z5ova,.urlset/master.m3u8',
    'https://delivery-node-safar.voe-network.net/hls/,6oarmsfuum33cszcr365fljrxnni3ux6sh52lftt2n4to5o5lvgjgvnmj2mq,.urlset/master.m3u8',
    'https://delivery-node-fawziyyah.voe-network.net/hls/,6oarn3cioy3lcszcr365fnjbwsh2liabwltdpmzbipzb7brwhc42mey5gkjq,.urlset/master.m3u8',
    'https://delivery-node-layth.voe-network.net/hls/,6oarmufuum33cszcr365f2bm5exhmjkc3xqpozz2yfzsc7gl4ebljq5av3bq,.urlset/master.m3u8',
    'https://delivery-node-dhakwan.voe-network.net/hls/,6oarmmfuum33cszcr365fnrf5vtxb4q4vfs67y5wajnvgfe2n3yisbpdvqsa,.urlset/master.m3u8',
    'https://delivery-node-fiqar.voe-network.net/hls/,6oarmsnuum33cszcr365fpjv5l4wczsj267x6fqq6nxhuuh6dzq7ghd2alrq,.urlset/master.m3u8',
    'https://delivery-node-thanaa.voe-network.net/hls/,6oarmlvuum33cszcr365fkjwvbfi7bo6j67yusu2atgfjr2w3n2p3n42u6sa,.urlset/master.m3u8',
    'https://delivery-node-waqqas.voe-network.net/hls/,6oarmrfuum33cszcr365f3zxwroerbdqfwd2xwujglcwwt42uzrtaqpuwf5q,.urlset/master.m3u8',
    'https://delivery-node-aram.voe-network.net/hls/,6oarmrnuum33cszcr365f23rx36pi4desf7dc74tvpsifzqrfo6my2l53xga,.urlset/master.m3u8',
    'https://delivery-node-tawfiq.voe-network.net/hls/,6oarmmnuum33cszcr365fy3qvw676rcbyubwpet6hrcgtcfszsvq5lgemama,.urlset/master.m3u8',
    'https://delivery-node-ruwayd.voe-network.net/hls/,6oarnpkioy3lcszcr365f3jnwc6iwlwb2jdrfnjvxsrqvy6egky6ybv6yqgq,.urlset/master.m3u8',
    'https://delivery-node-sahlah.voe-network.net/hls/,6oarminuum33cszcr365fizpui2rzic7xcdmzysrhh256v7d4peemkabra6q,.urlset/master.m3u8',
    'https://delivery-node-najjar.voe-network.net/hls/,6oarmnvuum33cszcr365fkbrvfd5ttsdy3rliemnjoaww7dopjl6ricx2aoq,.urlset/master.m3u8',
    'https://delivery-node-hawra.voe-network.net/hls/,6oarn2cioy3lcszcr365flluvp4khdni5l3sflh6lpjmt47krrm3jshogs4q,.urlset/master.m3u8',
    'https://delivery-node-sayegh.voe-network.net/hls/,6oarmonuum33cszcr365f2be4hpahwda5oakq7t7x6cfpygcngwbkfy5xcgq,.urlset/master.m3u8',
    'https://delivery-node-harb.voe-network.net/hls/,6oarmlfuum33cszcr365f2drxz7y7mlj76stqztvdjgqek6j3k3y4gkswdla,.urlset/master.m3u8',
    'https://delivery-node-essa.voe-network.net/hls/,6oarmkfuum33cszcr365fkrqwgysjxrv6o4qr252fdhiufkxta6h4ntcmcma,.urlset/master.m3u8',
    'https://delivery-node-ubadah.voe-network.net/hls/,6oarmkvuum33cszcr365fmbxv3rdec7idtzqj2rvqgozpdkucyuoqgilqmfq,.urlset/master.m3u8',
    'https://delivery-node-umniyah.voe-network.net/hls/,6oarmknuum33cszcr365f3jo5ieejmc7vlyqjj4yof2letuxuaqt6az3y64q,.urlset/master.m3u8',
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
    const m3u8ToMp4 = require("m3u8-to-mp4");
    const converter = new m3u8ToMp4();
    await converter
        .setInputFile(m3u8URL)
        .setOutputFile(path.join(downloadPath, obj.file.replaceAll('.', '#') + '.mp4'))
        .start();
}