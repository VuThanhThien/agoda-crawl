const Apify = require('apify');

const { addUrlParameters } = require('./util');

const { downloadListOfUrls } = Apify.utils;

module.exports.prepareRequestSources = async ({ startUrls }, globalContext) => {
    const { input } = globalContext;

    const requestSources = [];
    const startUrl = { input };

    if (startUrls) {
        const requests = await buildRequestsFromStartUrls(startUrls, input);
        requestSources.push(...requests);
    }

    return { requestSources, startUrl };
};

/**
 * Converts any inconsistencies to the correct format.
 * @param {{ url: string }[]} startUrls
 * @param {Record<string, any>} input
 * @returns
 */
const buildRequestsFromStartUrls = async (startUrls, input) => {
    const requests = [];

    for (let request of startUrls) {
        if (request.requestsFromUrl) {
            const sourceUrlList = await downloadListOfUrls({ url: request.requestsFromUrl });
            for (const url of sourceUrlList) {
                request = { url };
                request.url = addUrlParameters(request.url, input);

                requests.push(request);
            }
        } else {
            if (typeof request === 'string') {
                request = { url: request };
            }
            request.url = addUrlParameters(request.url, input);

            requests.push(request);
        }
    }

    return requests;
};
