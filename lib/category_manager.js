'use strict';

function compareDate(a, b){
    let d1 = a.article.date, d2 = b.article.date;
    return d1 < d2;
}

function indexToPageName(base){
    return i => base + (i === 1 ? 'index.html' : `page-${i}.html`);
}

module.exports = params => async (app) => {
    let postArg = {
        tags: params.tags.path,
        archive: params.archive.path,
        category: params.categories.path,
    };

    app.config.ext = app.config.ext || {};
    app.config.ext.blog = params.mainPage.path;
    app.config.ext.tags = postArg.tags;
    app.config.ext.archive = postArg.archive;
    app.config.ext.category = postArg.category;

    let mainPage = new app.helper.Paginator(compareDate, arg => app.layouts.page(arg), indexToPageName(params.mainPage.path), params.mainPage.pagesPerPage, {arg: postArg});
    let archive = new app.helper.Paginator(compareDate, a => app.layouts.archive(a), indexToPageName(params.archive.path), params.archive.pagesPerPage, {arg: postArg});
    let tags = new app.helper.Tags(
        params.tags.path,
        a => app.layouts.tag(a),
        indexToPageName(''),
        compareDate,
        params.tags.pagesPerPage,
        {arg: postArg}
    );
    let category = new app.helper.Categorizer(
        params.categories.path,
        a => app.layouts.category(a),
        indexToPageName(''),
        compareDate,
        params.categories.pagesPerPage,
        {arg: postArg}
    );
    let pg = new app.helper.PageGroup((page, n) => {
        if (n){
            mainPage.add(page).update();
            archive.add(page).update();
        }
        page.article.tags.length > 0 && tags.update(page, page.article.tags);
        category.update(page, page.article.category);
    });
    tags.registerTemplate(params.tags.path + 'index.html', a => app.layouts.tagCloud(a), {arg: postArg});

    app.extend.blogManager = {
        updatePage(page){
            pg.update(page);
            app.logger.info(`Page update: ${page.path}`);
        }
    };
}