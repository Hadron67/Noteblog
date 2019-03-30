'use strict';

let escapeS = main.helper.escapeS;
let escapeHTML = main.helper.escapeHTML;

function _forOf(a, cb){
    let ret = [];
    for (let i of a){
        ret.push(cb(i));
    }
    return ret;
}

let config = main.config;

let mathjax = () => `<script type="text/javascript" async src="${escapeS(config.mathjaxURL)}"></script>`;

let metaTags = [
    '<meta charset="utf-8" />',
    '<meta http-equiv="X-UA-Compatible" content="IE=edge" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />'
].join('');

let head = () => [
    '<head>',
        '<title>',
            escapeHTML(config.title),
        '</title>',
        metaTags,
        '<link href="/css/main.css" rel="stylesheet">',
    '</head>'
];

let outter = content => [
    '<html>',
        head(),
        '<body>',
            '<div class="main-container">',
                content,
            '</div>',
            mathjax(),
        '</body>',
    '</html>'
];

let post = article => outter([
    '<div class="article-outter-container">',
        '<header class="article-title-container">',
            `<h1 class="article-title">${escapeHTML(article.title)}</h1>`,
        '</header>',
        '<div class="article-inner-container">',
            article.content,
        '</div>',
    '</div>'
]);

let page = pages => outter(pages.map(page => [
    '<div>',
        `<a href="${escapeS(page.path)}">${escapeHTML(page.article.title)}</a>`,
        `<div>${page.article.summary}</div>`,
    '</div>'
]));

main.layouts.post = post;
main.layouts.page = page;