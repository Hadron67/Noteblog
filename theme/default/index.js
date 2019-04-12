'use strict';

const pwd = __dirname + '/';
const _ = p => pwd + p;


function compareDate(a, b){
    let d1 = a.article.date, d2 = b.article.date;
    return d1 < d2;
}

function addNewLineToEnds(s){
    if (s.charAt(0) !== '\n'){
        s = '\n' + s;
    }
    if (s.charAt(s.length - 1) !== '\n'){
        s += '\n';
    }
    return s;
}

function getMyRenderer(app){
    let { escapeS, escapeHTML } = app.helper;
    let NodeType = app.markdown.NodeType;
    return class MyMarkdownRenderer extends app.markdown.DefaultRenderer {
        enterHeading(node) {
            if (node.val === 2){
                let id = this.getHeadingNodeID(node);
                id = id === null ? '' : ` id="${id}"`;
                this.text += `<div class="head2-wrapper"${id}><h2>`;
            }
            else
                this.text += `<h${node.val}>`;
        }
        leaveHeading(node) {
            if (node.val === 2){
                this.text += '</h2></div>';
            }
            else
                this.text += `</h${node.val}>`;
        }
        visitCode(node) {
            if (node.lang === 'mathjax-defs'){
                this.text += `<script type="math/tex">%<![CDATA[${addNewLineToEnds(node.val)}%]]></script>`;
            }
            else
                this.text += `<pre><code lang="${escapeS(node.lang)}">${escapeHTML(node.val)}</code></pre>`;
        }
        visitImage(node) {
            let src = /^https?:\/\//.test(node.src) ? node.src : `/static/img/${escapeS(node.src)}`;
            this.text += `<img src="${src}" alt="${escapeS(node.alt)}" />`;
        }

        getHeadingNodeID(node){
            if (node.children.length === 1 && node.children[0].type === NodeType.TEXT){
                let ret = node.children[0].val.trim();
                return ret.replace(/[A-Z]/g, c => c.toLowerCase()).replace(/[ ]+/g, '-');
            }
            else 
                return null;
        }
    };
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

async function registerStaticDir(app, webRoot, dir){
    (await app.helper.readFiles(webRoot + dir)).forEach(f => app.static.register('/' + dir + f));
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
 * @param {BlogConfig} config 
 */
async function main(app, config){
    app.config = config;
    config.mathjaxURL = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=TeX-AMS_CHTML';
    config.fontawsomeURL = 'https://use.fontawesome.com/releases/v5.8.1/css/all.css';

    let postArg = {
        tags: config.tags.path,
        archive: config.archive.path,
        category: config.categories.path,
    };

    Promise.all(config.staticDirs.map(dir => registerStaticDir(app, config.webRoot, dir)));
    app.scss.register('/css/main.css', (await app.helper.readFiles(_('css/'), 'main.scss')).map(f => _('css/') + f));

    app.markdown.setRenderer(getMyRenderer(app));
    
    await app.helper.registerModule(_('templates/templates.js'));

    let posts = config.posts.map(p => app.markdown.register(app.markdown.dateToPath(config.articles), p, {arg: postArg}));

    let mainPage = new app.helper.Paginator(compareDate, arg => app.layouts.page(arg), indexToPageName('/'), config.articlesPerPage, {arg: postArg});
    let archive = new app.helper.Paginator(compareDate, a => app.layouts.archive(a), indexToPageName(config.archive.path), config.archive.pagesPerPage, {arg: postArg});
    let tags = new app.helper.Tags(
        config.tags.path,
        a => app.layouts.tag(a),
        indexToPageName(''),
        compareDate,
        config.tags.pagesPerPage,
        {arg: postArg}
    );
    let category = new app.helper.Categorizer(
        config.categories.path,
        a => app.layouts.category(a),
        indexToPageName(''),
        compareDate,
        config.categories.pagesPerPage,
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
    tags.registerTemplate(config.tags.path + 'index.html', a => app.layouts.tagCloud(a), {arg: postArg});
    let listener = page => pg.update(page);
    posts.forEach(p => p.on('update', listener));
}

module.exports = main;