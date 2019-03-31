'use strict';

const fs = require('fs');

function compareDate(a, b){
    let d1 = a.article.date, d2 = b.article.date;
    return d1 > d2 ? -1 : d1 < d2 ? 1 : 0;
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
            if (node.children.length === 1 && node.children[0].type === app.markdown.NodeType.TEXT){
                let ret = node.children[0].val.trim();
                return ret.replace(/[A-Z]/g, c => c.toLowerCase()).replace(/[ ]+/g, '-');
            }
            else 
                return null;
        }
    };
}

module.exports = async (app) => {
    app.config = {
        title: 'Blog de CFY',
        mathjaxURL: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=TeX-AMS-MML_HTMLorMML',
        fontawsomeURL : 'https://use.fontawesome.com/releases/v5.8.1/css/all.css',
        webRoot: 'docs'
    };

    app.markdown.setRenderer(getMyRenderer(app));
    
    await app.helper.registerModule('templates.js');

    // Image files
    (await app.helper.readFiles('docs/static/img/2019')).forEach(f => app.static.register('/static/img/2019/' + f));
    
    app.scss.register('/css/main.css', ['src/sass/main.scss', 'src/sass/article.scss']);

    // posts
    let postFiles = (await app.helper.readFiles('src/posts')).filter(f => f.endsWith('.md'));
    let posts = postFiles.map(f => app.markdown.register(app.markdown.dateToPath('/article'), 'src/posts/' + f));
    app.pageGroup()
            .registerAll(posts)
            .paginate(arg => app.layouts.page(arg), i => i === 1 ? '/index.html' : `/page-${i}.html`, compareDate, 5)
            .on('load', () => app.logger.info('All posts loaded'));
};