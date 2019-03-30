'use strict';

function _forOf(a, cb){
    let ret = [];
    for (let i of a){
        ret.push(cb(i));
    }
    return ret;
}

let config = main.config;

let mathjax = () => `<script type="text/javascript" async src="${config.mathjaxURL}"></script>`;

let metaTags = [
    '<meta charset="utf-8" />',
    '<meta http-equiv="X-UA-Compatible" content="IE=edge" />',
    '<meta viewport="width=device-width, initial-scale=1" />'
].join('');

let head = () => [
    '<head>',
        '<title>',
            config.title,
        '</title>',
        metaTags,
        '<link href="/css/main.css" rel="stylesheet">',
    '</head>'
];

let outter = content => [
    '<html>',
        head(),
        '<body>',
            content,
            mathjax(),
        '</body>',
    '</html>'
];

let post = article => outter([
    `<h1>${article.title}</h1>`,
    '<div>',
        article.content,
    '</div>'
]);

let page = pages => outter(pages.map(page => [
    '<div>',
        `<a href="${page.path}">${page.article.title}</a>`,
        `<div>${page.article.summary}</div>`,
    '</div>'
]));

main.layouts.post = post;
main.layouts.page = page;