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

function _if(cond, cb){
    return cond ? cb() : '';
}

let config = main.config;

let mathjax = () => `<script type="text/javascript" async src="${escapeS(config.mathjaxURL)}"></script>`;
let fontawesome = () => `<link rel="stylesheet" href="${escapeS(config.fontawsomeURL)}" integrity="sha384-50oBUHEmvpQ+1lW4y57PTFmhCaXp0ML5d60M1M7uH2+nqUivzIebhndOJK28anvf" crossorigin="anonymous">`;

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
        fontawesome(),
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

let postInfo = article => {
    let date = article.date;
    return [
        '<div class="article-info-container">',
            '<span class="post-info-icon">', 
                '<i class="fas fa-calendar-alt"></i>', 
                `<time class="post-date" title="Created on" datetime="${date.toString()}">`,
                    `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
                '</time>',
            '</span>',
            _if(article.category, () => [
                '<span class="post-info-icon"> | ',
                    `<a href="#"><i class="fas fa-folder-open"></i>${article.category}</a>`,
                '</span>',
            ]),
        '</div>',
    ];
};

let postTags = article => {
    if (article.tags.length === 0){
        return '';
    }
    return [
        '<footer>',
            article.tags.map(tag => [
                `<a href="#"><i class="fas fa-tag"></i>${tag}</a>`,
            ]),
        '</footer>'
    ];
};

let postLike = (article, header, content) => [
    '<div class="article-outter-container">',
        '<article>',
            '<header class="article-title-container">',
                '<h1 class="article-title">', 
                    header,                
                '</h1>',
                postInfo(article),
            '</header>',
            '<div class="article-inner-container">',
                content,
            '</div>',
            postTags(article),
        '</article>',
    '</div>',
];

let post = article => outter(postLike(article,
    `<h1 class="article-title">${escapeHTML(article.title)}</h1>`,
    article.content
));

let page = pages => outter(pages.map(page => [
    '<div class="post-entry">',
        postLike(page.article,
            `<a class="article-title" href="${escapeS(page.path)}">${escapeHTML(page.article.title)}</a>`, [
                page.article.summary,
                '<p class="article-more-btn">',
                    `<a href="${escapeS(page.path)}">Read more</a>`,
                '</p>'
            ]
        ),
    '</div>'
]));

main.layouts.post = post;
main.layouts.page = page;