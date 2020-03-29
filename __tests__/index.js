const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();

    await page.goto('http://127.0.0.1:8080');
    await page.waitFor(1000);
    await page.screenshot({path: '__tests__/screenshot/home.png'});
    await page.click('.js-to-map');
    await page.waitFor(1000);
    await page.screenshot({path: '__tests__/screenshot/map.png'});
    await browser.close();
})();