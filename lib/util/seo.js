const {escapeHTML, escapeS} = require('./escape.js');

module.exports = (main) => {
    let page = main.rendering;
    let config = main.config;
    let completeURL = main.helper.completeURL;
    let ret = [
        `<meta property="og:site_name" content="${escapeS(config.title)}" />`,
        `<meta property="og:url" content="${completeURL(page.path)}" />`
    ];
    if (page.seo){
        let seo = page.seo;
        ret.push(
            `<meta property="og:title" content="${escapeS(seo.title)}" />`,
            `<meta property="og:type" content="${seo.type}" />`,
            seo.keywords ? `<meta name="keywords" content="${escapeS(seo.keywords)}" />` : '',
            `<meta property="og:description" content="${escapeS(seo.description)}" />`,
            `<meta name="description" content="${escapeS(seo.description)}" />`
        );
        if (seo.images){
            for (let image of seo.images){
                ret.push(`<meta property="og:image" content="${completeURL(main.helper.completeImageURL(image.src))}">`);
            }
        }
    }

    return ret;
}