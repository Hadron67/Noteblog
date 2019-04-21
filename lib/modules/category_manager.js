'use strict';

function compareDate(a, b){
    let d1 = a.article.date, d2 = b.article.date;
    return d1 < d2;
}

function indexToPageName(i){
    return i === 1 ? 'index.html' : `page-${i}.html`;
}

module.exports = params => async (app) => {
    let postArg = {
        tags: params.tags.path,
        archive: params.archive.path,
        category: params.categories.path,
    };

    let ext = app.ext;
    ext.blog = params.mainPage.path;
    ext.tags = postArg.tags;
    ext.archive = postArg.archive;
    ext.category = postArg.category;

    let mainPage = app.helper.createPaginator(compareDate, arg => app.layouts.page(arg), indexToPageName, params.mainPage.pagesPerPage, params.mainPage.path, {arg: postArg});
    let archive = app.helper.createPaginator(compareDate, a => app.layouts.archive(a), indexToPageName, params.archive.pagesPerPage, params.archive.path, {arg: postArg});
    let tags = app.helper.createTags(
        params.tags.path,
        a => app.layouts.tag(a),
        indexToPageName,
        compareDate,
        params.tags.pagesPerPage,
        {arg: postArg}
    );
    let category = app.helper.createCategorizer(
        params.categories.path,
        a => app.layouts.category(a),
        indexToPageName,
        compareDate,
        params.categories.pagesPerPage,
        {arg: postArg}
    );
    let pg = app.helper.createPageGroup((page, n) => {
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
        },
        removePage(p){
            pg.remove(p);
            mainPage.remove(p);
            archive.remove(p);
            tags.remove(p);
            category.remove(p);
        },
        getPosts: () => mainPage.pages
    };
}