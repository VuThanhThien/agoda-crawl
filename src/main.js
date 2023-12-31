const Apify = require('apify');
const { USER_AGENT } = require('./consts');
const { validateInput, parseInput, evalExtendOutputFn } = require('./input');
const { prepareRequestSources } = require('./start-urls');
const ErrorSnapshotter = require('./error-snapshotter');
const handlePageFunctionExtended = require('./handle-page-function');

const { log } = Apify.utils;

Apify.main(async () => {
    let input = await Apify.getInput();

    input = parseInput(input);
    validateInput(input);

    if (input.debug) {
        log.setLevel(log.LEVELS.DEBUG);
    }

    const extendOutputFunction = evalExtendOutputFn(input);

    const {
        startUrls,
        proxyConfig = { useApifyProxy: true },
        enableAssets = false,
    } = input;

    const errorSnapshotter = new ErrorSnapshotter();
    await errorSnapshotter.initialize(Apify.events);

    const globalContext = {
        input,
        extendOutputFunction,
    };

    const requestQueue = await Apify.openRequestQueue();

    const { requestSources } = await prepareRequestSources({ startUrls, input }, globalContext);
    const requestList = await Apify.openRequestList('LIST', requestSources);
    const proxyConfiguration = (await Apify.createProxyConfiguration(proxyConfig)) || undefined;

    const crawler = new Apify.PuppeteerCrawler({
        requestList,
        requestQueue,
        handlePageTimeoutSecs: enableAssets ? 120 : 60,
        proxyConfiguration,
        launchContext: {
            useChrome: Apify.isAtHome(),
            launchOptions: {
                args: ['--ignore-certificate-errors'],
                ignoreHTTPSErrors: true,
            },
            userAgent: USER_AGENT,
        },
        useSessionPool: true,
        handlePageFunction: async (context) => {
            const loadedUrl = context.page.url();
            if (loadedUrl.length <= 62) {
                context.session.retire();
                context.crawler.browserPool.retireBrowserByPage(context.page);
                throw new Error(`The loaded url (${loadedUrl}) seems wrong! Retry...`);
            }

            await errorSnapshotter.tryWithSnapshot(context.page, async () => {
                await handlePageFunctionExtended(context, globalContext);
            });
        },
        handleFailedRequestFunction: async ({ request }) => {
            log.info(`Request ${request.url} failed too many times`);
            await Apify.pushData({
                '#debug': Apify.utils.createRequestDebugInfo(request),
            });
        },
        preNavigationHooks: [
            async ({ page }) => {
                if (!enableAssets) {
                    await Apify.utils.puppeteer.blockRequests(page);
                }

                const cookies = await page.cookies('https://www.agoda.com');
                await page.deleteCookie(...cookies);
                await page.setViewport({
                    width: 1024 + Math.floor(Math.random() * 100),
                    height: 768 + Math.floor(Math.random() * 100),
                });
            },
        ],
    });

    log.info('Starting the crawl.');
    await crawler.run();
    log.info('Crawl finished.');
});
