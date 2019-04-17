'use strict';
const getMyRenderer = require('./renderer.js');

const pwd = __dirname + '/';
const _ = p => pwd + p;

function compareDate(a, b){
    let d1 = a.article.date, d2 = b.article.date;
    return d1 < d2;
}

function indexToPageName(base){
    return i => base + (i === 1 ? 'index.html' : `page-${i}.html`);
}

async function readPostFiles(app, dirs, arg){
    let p = await Promise.all(dirs.map(p => app.helper.readFiles(p)));
    let ret = [];
    for (let i = 0; i < p.length; i++){
        for (let file of p[i].filter(f => f.endsWith('.md')).map(f => dirs[i] + f)){
            ret.push(file);
        }
    }
    return ret.map(f => app.markdown.register(app.markdown.dateToPath('/article'), f, {arg}));
}

/** @typedef{{path: string, pagesPerPage: number}} Pagination */

/** @typedef{{webRoot: string, 
 * articles: string, 
 * articlesPerPage: number,
 * archive: Pagination,
 * categories: Pagination, 
 * tags: Pagination, 
 * staticDirs: string[], 
 * posts: string[]
 * }} BlogConfig */

/**
 * @param {*} app 
 * @param {BlogConfig} params 
 */
async function main(app, params){
    app.config.mathjaxURL = params.mathjaxURL || 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=TeX-AMS_CHTML';
    app.config.fontawsomeURL = params.fontawsomeURL || 'https://use.fontawesome.com/releases/v5.8.1/css/all.css';
    app.config.links = params.links || {};

    let postArg = {
        tags: params.tags.path,
        archive: params.archive.path,
        category: params.categories.path,
    };

    app.scss.register('/css/main.css', (await app.helper.readFiles(_('css/'), 'main.scss')).map(f => _('css/') + f));

    app.markdown.setRenderer(getMyRenderer(app));
    
    await app.helper.registerModule(_('templates/templates.js'));

    let posts = params.posts.map(p => app.markdown.register(app.markdown.dateToPath(params.articles), p, {arg: postArg}));

    let mainPage = new app.helper.Paginator(compareDate, arg => app.layouts.page(arg), indexToPageName('/'), params.articlesPerPage, {arg: postArg});
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
    let listener = page => pg.update(page);
    posts.forEach(p => p.on('update', listener));
}

// module.exports = main;
module.exports = params => app => app.on('load', () => main(app, params));