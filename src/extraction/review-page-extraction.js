module.exports.extractReviews = async (page) => {
    const extractedReviews = await page.evaluate(() => {
        const $ = window.jQuery;

        const extractReviewTitle = (reviewElement) => {
            const reviewTextElements = $(reviewElement).find('.Review-comments #reviewSectionComments');

            const reviewTexts = {
                positive: null,
                negative: null,
            };

            $(reviewTextElements).each((_index, element) => {
                const reviewScore = $(element).find('.Review-comment-leftScore').text().trim() || null;
                const reviewTitle = $(element).find('.Review-comment-bodyTitle').text().trim() || null;
                if (reviewScore) {
                    if (parseFloat(reviewScore) > 3) {
                        reviewTexts.positive = reviewTitle;
                    } else if (parseFloat(reviewScore) <= 3) {
                        reviewTexts.negative = reviewTitle;
                    }
                }
            });

            return reviewTexts;
        };

        const extractDescriptionComment = (reviewElement) => {
            const commentDesc = $(reviewElement).find('.Review-comment-bodyText').text().trim() || null;
            return commentDesc;
        };

        const extractCountryName = (reviewElement) => {
            const reviewers = $(reviewElement).find('.Review-comment-reviewer [data-info-type="reviewer-name"]') || null;
            const country = $(reviewers).children().last().text() || null;
            return country;
        };

        const reviewBlocks = $('.Review-comments');
        const reviews = $.map(reviewBlocks, (el) => {
            const reviewTitle = extractReviewTitle(el);

            const review = {
                title: $(el).find('.c-review-block__title').first().text()
                    .trim() || null,
                score: parseFloat($(el).find('.Review-comment-leftScore').text().trim()) || null,
                ...reviewTitle,
                guestName: $(el)
                    .find('.Review-comment-reviewer [data-info-type="reviewer-name"]')
                    .children()
                    .eq(1)
                    .text(),
                travellerType: $(el).find('.Review-comment-reviewer [data-info-type="group-name"]')
                    .children()
                    .eq(1)
                    .text()
                    .trim(),
                room: $(el).find('.Review-comment-reviewer [data-info-type="room-type"]')
                    .children()
                    .eq(1)
                    .text()
                    .trim(),
                nightsStay: $(el).find('.Review-comment-reviewer [data-info-type="stay-detail"]')
                    .children()
                    .eq(1)
                    .text()
                    .trim(),
                country: $(el).find('.bui-avatar-block__subtitle').text().trim(),
                countryName: extractCountryName(el),
                description: extractDescriptionComment(el),
            };

            return review;
        });

        return reviews;
    });

    return extractedReviews;
};
