// // puppeteer-extra is a drop-in replacement for puppeteer,
// // it augments the installed puppeteer with plugin functionality
// const puppeteer = require('puppeteer-extra')

// // Add adblocker plugin, which will transparently block ads in all pages you
// // create using puppeteer.
// const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
// puppeteer.use(AdblockerPlugin())

const puppeteer = require('puppeteer-extra');
const stealth = require("puppeteer-extra-plugin-stealth")();
puppeteer.use(stealth);


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