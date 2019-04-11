'use strict';

const fs = require('fs');

global.requireNew = path => {
    delete require.cache[require.resolve(path)];
    return require(path);
}

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
            this.text += `<img src="/static/img/${escapeS(node.src)}" alt="${escapeS(node.alt)}" />`;
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

module.exports = async (app) => {
    app.config = {
        title: "Hadroncfy's Notebook",
        mathjaxURL: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=TeX-AMS_CHTML',
        fontawsomeURL : 'https://use.fontawesome.com/releases/v5.8.1/css/all.css',
        webRoot: 'docs',
        domain: '124.16.113.131:8080'
    };

    app.markdown.setRenderer(getMyRenderer(app));
    
    app.helper.registerModule('./templates.js');

    // Image files
    (await app.helper.readFiles('docs/static/img/2019')).forEach(f => app.static.register('/static/img/2019/' + f));
    // Javascript
    (await app.helper.readFiles('docs/static/js')).forEach(f => app.static.register('/static/js/' + f));
    
    app.scss.register('/css/main.css', [
        'src/sass/main.scss',
        'src/sass/article.scss',
        'src/sass/category.scss',
        'src/sass/header.scss',
        'src/sass/search.scss',
        'src/sass/footer.scss',
        'src/sass/tags.scss'
    ]);

    // posts
    let postArg = {
        tags: '/tags/',
        archive: '/archive/',
        category: '/category/',
    };
    let postFiles = (await app.helper.readFiles('src/posts')).filter(f => f.endsWith('.md'));
    let posts = postFiles.map(f => app.markdown.register(app.markdown.dateToPath('/article'), 'src/posts/' + f, {arg: postArg}));
    let mainPage = new app.helper.Paginator(compareDate, arg => app.layouts.page(arg), indexToPageName('/'), 5, {arg: postArg});
    let archive = new app.helper.Paginator(compareDate, a => app.layouts.archive(a), indexToPageName('/archive/'), 20, {arg: postArg});
    let tags = new app.helper.Tags(
        postArg.tags,
        a => app.layouts.tag(a),
        indexToPageName(''),
        compareDate,
        20,
        {arg: postArg}
    );
    let category = new app.helper.Categorizer(
        postArg.category,
        a => app.layouts.category(a),
        indexToPageName(''),
        compareDate,
        20,
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
    tags.registerTemplate(postArg.tags + 'index.html', a => app.layouts.tagCloud, {arg: postArg});
    let listener = page => pg.update(page);
    posts.forEach(p => p.on('update', listener));
};