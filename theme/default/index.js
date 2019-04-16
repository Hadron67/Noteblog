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
                // XXX: A hack! 
                this.text += `<div class="mathjax-defs"><script type="math/tex">%<![CDATA[${addNewLineToEnds(node.val)}%]]></script></div>`;
            }
            else
                this.text += `<pre><code lang="${escapeS(node.lang)}">${escapeHTML(node.val)}</code></pre>`;
        }
        visitImage(node) {
            let src = /^https?:\/\//.test(node.src) ? node.src : `/static/img/${escapeS(node.src)}`;
            let inline = false, float = '', styles = [];
            for (let a of node.attrs){
                switch (a){
                    case 'inline': inline = true; break;
                    case 'left': float = 'left'; inline = false; break;
                    case 'right': float = 'right'; inline = false; break;
                    default:
                        if (/^"[^"]*"$/.test(a)){
                            styles.push(a.substr(1, a.length - 2) + ';');
                        }
                }
            }
            let classes = [];
            if (float !== ''){
                classes.push(float);
            }
            classes = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';
            let styleString = styles.length > 0 ? ` style="${styles.join(' ')}"` : '';

            if (inline){
                this.text += `<img class="inline"${styleString} src="${src}" alt="${escapeS(node.alt)}" />`;
            }
            else {
                this.text += [
                    '<div class="img-container">',
                        `<figure${classes}>`,
                            `<img src="${src}"${styleString} alt="${escapeS(node.alt)}" />`,
                            node.alt !== '' ? `<figcaption><span>${escapeHTML(node.alt)}</span></figcaption>` : '',
                        '</figure>',
                    '</div>'
                ].join('');
            }
        }

        enterParagraph(node){
            let saved = this.text;
            this.text = '';
            let i, _a = node.children;
            for (i = 0; i < _a.length; i++){
                if (this.isBlockImage(_a[i])){
                    break;
                }
                _a[i].accept(this);
            }
            let hasPreceedingP = false;
            if (i > 0){
                this.text = saved + `<p>${this.text}</p>`;
                hasPreceedingP = true;
            }
            else {
                this.text = saved;
            }
            while (i < _a.length){
                this.text += `<div class="p-with-img${hasPreceedingP ? ' partial' : ''}">`;
                _a[i].accept(this);
                i++;
                if (i < _a.length && !this.isBlockImage(_a[i])){
                    this.text += '<p>';
                    while (i < _a.length && !this.isBlockImage(_a[i])){
                        _a[i].accept(this);
                        i++;
                    }
                    this.text += '</p>';
                }
                this.text += '</div>';
            }
            return true;
        }
        leaveParagraph(){
            this.text += '</p>';
        }

        getHeadingNodeID(node){
            if (node.children.length === 1 && node.children[0].type === NodeType.TEXT){
                let ret = node.children[0].val.trim();
                return ret.replace(/[A-Z]/g, c => c.toLowerCase()).replace(/[ ]+/g, '-');
            }
            else 
                return null;
        }
        isBlockImage(n){
            if (n.type === NodeType.IMAGE){
                let inline = false;
                for (let attr of n.attrs){
                    if (attr === 'left' || attr === 'right'){
                        return true;
                    }
                    if (attr === 'inline'){
                        inline = true;
                    }
                }
                return !inline;
            }
            return false;
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