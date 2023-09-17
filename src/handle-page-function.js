const Apify = require('apify');
const { handleReviewPage } = require('./routes/review-page-route');

const { log } = Apify.utils;

module.exports = async (context, globalContext) => {
    log.info(`Opened url { url }`);
    await handleReviewPage(context, globalContext);
};
