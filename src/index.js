const seasons = 2, episodes = [26, 13];
const title = 'The Irregular at Magic High School';
const start = 'https://aniworld.to/anime/stream/the-irregular-at-magic-high-school/';

const urls = [];

const wait = (ms) => new Promise((resolve, reject) => setTimeout(resolve, ms));

(async () => {

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

    console.log(urls);

})();

async function startBrowser(obj) {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe' // Windows
    });
    const page = await this.browser.newPage();
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
        if (request.url.includes('m3u8') && request.url.includes('master')) {
            //TODO: Start the m3u8 file
        }
        client.send('Network.continueInterceptedRequest', {
            interceptionId
        });
    });
    await page.goto(obj.url);

    await page.evaluate(() => {
        // localStorage.setItem('mature', 'true')
        // localStorage.setItem('video-muted', '{"default":false}')
        // localStorage.setItem('volume', '0.5')
        // localStorage.setItem('video-quality', '{"default":"chunked"}')
    });

    await wait(15000);
}

async function startDownloading(obj) {

}