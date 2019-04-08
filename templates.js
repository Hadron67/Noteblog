'use strict';

module.exports = main => {

    let escapeS = main.helper.escapeS;
    let escapeHTML = main.helper.escapeHTML;
    let regulateName = main.helper.regulateName;
    let monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    function _forIn(obj, cb){
        let ret = [];
        for (let k in obj){
            ret.push(cb(k, obj[k]));
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
            '<link href="/css/main.css" type="text/css" rel="stylesheet">',
            // XXX: Using an empty script tag to fix the Chrome bug that all property transition from 
            // user agent to the supplied value on page load. See https://github.com/LeaVerou/prefixfree/issues/99
            '<script> (function(){})(); </script>',
            metaTags,
            fontawesome(),
        '</head>'
    ];

    let header = () => [
        '<header class="main-header">',
            
        '</header>'
    ];
    
    let outter = (content, active) => [
        '<!DOCTYPE html>',
        '<html>',
            head(),
            '<body>',
                '<div class="main-container">',
                    content,
                '</div>',
                '<script src="/static/js/main.js"></script>',
                mathjax(),
            '</body>',
        '</html>'
    ];
    
    function articleCategoryList(pathBase, categoryPath){
        let list = [];
        let path = pathBase;
        for (let name of categoryPath){
            path += `${name}/`;
            list.push({name, path});
        }
        return list;
    }
    
    let postInfo = (article, arg) => {
        let date = article.date;
        return [
            '<div class="article-info-container">',
                '<span class="post-meta-block">',
                    '<span class="post-info-icon">', 
                        '<i class="fas fa-calendar-alt"></i>', 
                    '</span>',
                    `<time class="post-date" title="Created on" datetime="${date.toISOString()}">`,
                        `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
                    '</time>',
                '</span>',
                _if(article.category, () => {
                    let list = articleCategoryList(arg.category, article.category);
                    let content = [];
                    for (let i = 0; i < list.length; i++){
                        if (i > 0){
                            content.push(
                                '<span class="category-divider">',
                                    '<i class="fas fa-chevron-right"></i>',
                                '</span>'
                            );
                        }
                        content.push(
                            `<a href="${escapeS(regulateName(list[i].path))}">`,
                                escapeHTML(list[i].name),
                            '</a>'
                        );
                    }
                    return [
                        '<span class="post-meta-block">',
                            '<span class="post-info-icon">',
                                '<i class="fas fa-folder-open"></i>',
                            '</span>',
                            content,
                        '</span>',
                    ];
                }),
            '</div>',
        ];
    };
    
    let postTags = (article, arg) => {
        if (article.tags.length === 0){
            return '';
        }
        return [
            '<footer class="post-footer">',
                article.tags.map(tag => [
                    `<a href="${escapeS(arg.tags)}${regulateName(tag)}/" title="Tag: ${escapeS(tag)}">`,
                        `<i class="fas fa-tag"></i>${escapeHTML(tag)}`,
                    '</a>',
                ]),
            '</footer>'
        ];
    };
    
    let postLike = (article, header, content, arg) => [
        '<article class="article-main">',
            '<header class="article-title-container">',
                '<h1 class="article-title">', 
                    header,                
                '</h1>',
                postInfo(article, arg),
            '</header>',
            '<div class="article-inner-container">',
                content,
            '</div>',
            postTags(article, arg),
        '</article>',
    ];
    
    let post = ({article, arg}) => outter(postLike(article,
        escapeHTML(article.title),
        article.content,
        arg
    ));
    
    let page = ({pages, arg}) => outter([
        '<ul class="main-post-list">',
        pages.getPages().map(page => [
            '<li>',
                postLike(page.article,
                    `<a class="article-title-link" href="${escapeS(page.path)}">${escapeHTML(page.article.title)}</a>`, [
                        page.article.summary,
                        '<p class="article-more-btn">',
                            `<a href="${escapeS(page.path)}">Read more</a>`,
                        '</p>'
                    ],
                    arg
                ),
            '</li>'
        ]),
        '</ul>'
    ]);
    
    function partitionByDate(pages){
        let ret = [];
        for (let p of pages){
            let top = ret[ret.length - 1];
            let date = p.article.date;
            if (top && top.date.getFullYear() === date.getFullYear() && top.date.getMonth() === date.getMonth()){
                top.pages.push(p);
            }
            else {
                ret.push({date, pages: [p]});
            }
        }
        return ret;
    }
    
    let postList = ({pages, arg}) => outter(postDateList(pages.getPages(), arg));

    let smallPost = (page, args) => [
        '<article class="article-main">',
            '<h1 class="article-title-small">', 
                `<a class="article-title-link" href="${escapeS(page.path)}">`,
                    escapeHTML(page.article.title),
                '</a>',
            '</h1>',
        '</article>',
    ];


    let postDateList = (pages, args) => [
        '<ul class="post-date-list">',
            partitionByDate(pages).map(({date, pages}) => [
                '<li>',
                    `<h2 class="post-list-date">${monthNames[date.getMonth()]}, ${escapeHTML(date.getFullYear().toString())}</h2>`,
                    '<ul class="post-list">',
                        pages.map(p => [
                            '<li>',
                                smallPost(p, args),
                            '</li>'
                        ]),
                    '</ul>',
                '</li>'
            ]),
        '</ul>'
    ];
    
    let category = ({pages, node, pathBase, arg}) => outter([
        '<div class="category-outter-container">',
            '<header>',
                `<a href="${escapeS(pathBase)}">Category</a>`,
                node.getPath().map(n => [
                    '<span class="category-divider">',
                        '<i class="fas fa-chevron-right"></i>',
                    '</span>',
                    `<a href="${escapeS(pathBase)}${n.getPath().map(p => regulateName(p.name) + '/').join('')}">${escapeHTML(n.name)}</a>`,
                ]),
            '</header>',
            () => {
                let subcat = node.getSubcategories();
                let p = pathBase + node.getPath().map(n => regulateName(n.name) + '/').join('');
                if (subcat.length > 0){
                    return [
                        '<ul class="subcategory-container">',
                            subcat.map(c => [
                                `<li><a class="category-btn" href="${p}${regulateName(c)}/">`,
                                    '<span class="category-file-icon"><i class="fas fa-folder-open"></i></span>',
                                    escapeHTML(c),
                                `</a></li>`
                            ]),
                        '</ul>'
                    ];
                }
                else 
                    return '';
            },
            '<div class="category-post-list">',
                postDateList(pages.getPages(), arg),
            '</div>',
        '</div>',
    ]);
    
    main.layouts.post = post;
    main.layouts.page = page;
    main.layouts.tag = postList;
    main.layouts.category = category;
};
