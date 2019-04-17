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

    function script(s){
        let ret = '';
        let c1 = 'a'.charCodeAt(0), c2 = 'A'.charCodeAt(0);
        for (let i = 0; i < s.length; i++){
            let c = s.charAt(i);
            if (/[A-Z]/.test(c)){
                ret += '&#x' + (c.charCodeAt(0) - c2 + 0x1D49C).toString(16).toUpperCase() + ';';
            }
            else if (/[a-z]/.test(c)){
                ret += '&#x' + (c.charCodeAt(0) - c1 + 0x1D4B6).toString(16).toUpperCase() + ';';
            }
            // if (/[a-zA-Z]/.test(c)){
            //     ret += `&${c}scr;`;
            // }
            else {
                ret += c;
            }
        }
        return ret;
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

    let header = (banner, active = '') => [
        '<header class="main-header clearfix">',
            _if(banner, () => [
                '<div class="banner">',
                    banner,
                '</div>',
            ]),
            '<nav class="site-nav clearfix" id="main-nav">',
                '<a href="javascript:;" id="btn-collapse" class="nav-btn">',
                    '<i class="fas fa-bars"></i>',
                '</a>',
                '<ul class="nav-list right">',
                    [
                        {icon: '<i class="fas fa-search"></i>', path: 'javascript:;', id: 'btn-search'},
                        {icon: '<i class="fas fa-rss"></i>', path: '/rss.xml', id: null},
                    ].map(({icon, path, id}) => [
                        '<li>',
                            `<a href="${escapeS(path)}" class="nav-btn"${id ? ` id="${id}"` : ''}>`,
                                '<span class="nav-icon-btn">',
                                    icon,
                                '</span>',
                            '</a>',
                        '</li>'
                    ]),
                '</ul>',
                '<ul class="nav-list collapse" id="main-nav-list">',
                    '<li class="collapse">',
                        '<a class="nav-btn" id="btn-close-menu" href="javascript:;"><i class="fas fa-arrow-left"></i></a>',
                    '</li>',
                    [
                        {name: 'Home', icon: '<i class="fas fa-home"></i>', path: '/'},
                        {name: 'Archive', icon: '<i class="fas fa-archive"></i>', path: '/archive/'},
                        {name: 'Categories', icon: '<i class="fas fa-folder-open"></i>', path: '/category/'},
                        {name: 'Tags', icon: '<i class="fas fa-tags"></i>', path: '/tags/'},
                        {name: 'Programmes', icon: '<i class="fas fa-desktop"></i>', path: '/programmes/'},
                        {name: 'About', icon: '<i class="fas fa-address-card"></i>', path: '/about/'}
                    ].map(({name, icon, path}) => [
                        `<li${active === name ? ' class="active"' : ''}>`,
                            `<a href="${escapeS(path)}" class="nav-btn collapse">`,
                                '<span class="nav-icon">',
                                    icon,
                                '</span>',
                                `<span class="nav-item-name">${escapeHTML(name)}</span>`,
                            '</a>',
                        '</li>'
                    ]),
                '</ul>',
                '<div class="overlay"></div>',
            '</nav>',
        '</header>'
    ];

    let creativeCommon = [
        // '<a rel="license" href="http://creativecommons.org/licenses/by/4.0/">',
        //     '<img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" />',
        // '</a>',
        // '<br />',
        'This work is licensed under a ',
        '<a rel="license" href="http://creativecommons.org/licenses/by/4.0/" target="_blank">',
            'Creative Commons Attribution 4.0 International License',
        '</a>.'
    ];

    let footer = (path) => [
        '<footer class="main-footer">',
            '<div class="footer-row-2">',
                '<div class="footer-right">',
                    '<span>Links</span>',
                    '<ul class="link-list">',
                        _forIn(config.links, (name, url) => [
                            '<li>',
                                `<a href="${url}" target="_blank">${name}</a>`,
                            '</li>'
                        ]),
                    '</ul>',
                '</div>',
                '<div class="divider"></div>',
                '<div class="footer-left">',
                    '<p>',
                        creativeCommon,
                    '</p>',
                    '<p>',
                        'Powered by <a href="https://github.com/Hadron67/blog" target="_blank">Blogger</a>, theme written by Hadroncfy.',
                    '</p>',
                    '<p>',
                        '<i class="fab fa-html5"></i> ',
                        `<a href="http://validator.w3.org/check?uri=http://${config.domain}${path}" target="_blank">`,
                            'Validate HTML5',
                        '</a>',
                    '</p>',
                '</div>',
            '</div>',
        '</footer>'
    ];

    let searchPanel = [
        '<div id="search-panel">',
            '<div class="search-inner">',
                '<div class="search-input-container">',
                    '<a id="btn-clear-search"><i class="fas fa-times"></i></a>',
                    '<input id="search-input" type="text" autocomplete="off" placeholder="Search what you want to read..." />',
                '</div>',
                '<ul id="search-result">',
                    '<li>Warning: Searching is not implemented yet.</li>',
                '</ul>',
            '</div>',
        '</div>',
    ];
    
    let outter = (banner, active, path, content) => [
        '<!DOCTYPE html>',
        '<html>',
            head(),
            '<body>',
                header(banner, active),
                '<div class="outter-container">',
                    '<div class="main-container">',
                        content,
                    '</div>',
                '</div>',
                footer(path),
                searchPanel,
                '<a id="totop" href="javascript:;" title="Back to top"><i class="fas fa-chevron-up"></i></a>',
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
    
    let postTags = (article, arg, small = false) => {
        if (article.tags.length === 0){
            return '';
        }
        return [
            `<footer class="post-footer${small ? ' small' : ''}">`,
                article.tags.map(tag => [
                    `<a class="btn-tag" href="${escapeS(arg.tags)}${regulateName(tag)}/" title="Tag: ${escapeS(tag)}">`,
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
            `<div class="article-inner-container${article.indent ? ' indent' : ''}">`,
                content,
            '</div>',
            postTags(article, arg),
        '</article>',
    ];
    
    let post = ({article, arg, path}) => outter([
        "<h1>Welcome to</h1>",
        `<h1>Hadroncfy's Notebook</h1>`,
    ], '', path, postLike(article,
        escapeHTML(article.title),
        article.content,
        arg
    ));
    
    let page = ({pages, path, arg}) => outter([
        "<h1>Welcome to</h1>",
        `<h1>Hadroncfy's Notebook</h1>`,
    ], 'Home', path, [
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
        '</ul>',
        pageNav(pages.pagePaths, pages.index)
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
    
    let tag = ({pages, arg, tag, path}) => outter([
        `<h1>Tag: </h1>`,
        `<h2>${escapeHTML(tag)}</h2>`
    ], '', path, postDateList(pages.getPages(), arg));

    let smallPost = (page, args) => [
        '<article class="article-main">',
            '<header class="article-title-container small">',
                '<h1 class="article-title small">', 
                    `<a class="article-title-link" href="${escapeS(page.path)}">`,
                        escapeHTML(page.article.title),
                    '</a>',
                '</h1>',
                postInfo(page.article, args),
            '</header>',
            postTags(page.article, args, true),
        '</article>',
    ];


    let postDateList = (pages, args) => [
        '<ul class="post-date-list">',
            partitionByDate(pages.getPages()).map(({date, pages}) => [
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
        '</ul>',
        pageNav(pages.pagePaths, pages.index)
    ];

    let pageNav = (pagePaths, index, limit = 1) => [
        '<nav class="page-nav">',
            '<div>',
                () => {
                    let active = i => i === index ? ' active' : '';
                    let ret = [];
                    if (index > 0){
                        ret.push(
                            `<a href="${escapeS(pagePaths[index - 1])}" class="btn">`,
                                '<i class="fas fa-chevron-left"></i>',
                            '</a>'
                        );
                    }
                    if (pagePaths.length > 1){
                        ret.push('<ul class="page-nav-list">');
                        let i = 0;
                        ret.push(`<li><a href="${escapeS(pagePaths[0])}" class="btn${active(0)}">1</a></li>`);
                        i++;
                        if (i < index - limit){
                            ret.push('<li><a href="javascript:;" class="btn dotted"></a></li>');
                            i = index - limit;
                        }
                        while (i < index){
                            ret.push(`<li><a href="${escapeS(pagePaths[i])}" class="btn">${i + 1}</a></li>`);
                            i++;
                        }
                        if (i === index){
                            ret.push(`<li><a href="${escapeS(pagePaths[i])}" class="btn active">${i + 1}</a></li>`);
                            i++;
                        }
                        while (i < pagePaths.length && i <= index + limit){
                            ret.push(`<li><a href="${escapeS(pagePaths[i])}" class="btn">${i + 1}</a></li>`);
                            i++;
                        }
                        if (i < pagePaths.length - 1){
                            ret.push('<li><a href="javascript:;" class="btn dotted"></a></li>');
                            i = pagePaths.length - 1;
                        }
                        if (i === pagePaths.length - 1){
                            ret.push(`<li><a href="${escapeS(pagePaths[i])}" class="btn">${i + 1}</a></li>`);
                        }
                        ret.push('</ul>');
                    }
                    if (index < pagePaths.length - 1){
                        ret.push(
                            `<a href="${escapeS(pagePaths[index + 1])}" class="btn">`,
                                '<i class="fas fa-chevron-right"></i>',
                            '</a>'
                        );
                    }
                    return ret;
                },
            '</div>',
        '</nav>'
    ]
    
    let category = ({pages, node, pathBase, path, arg}) => outter([
        "<h1>Categories</h1>",
    ], 'Categories', path, [
        '<div class="category-outter-container">',
            '<header class="category-path">',
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
                        '<h3 class="post-list-date">Subcategories</h3>',
                        '<ul class="subcategory-container">',
                            subcat.map(c => [
                                `<li><a class="category-btn btn-category" href="${p}${regulateName(c)}/">`,
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
                postDateList(pages, arg),
            '</div>',
        '</div>',
    ]);

    let archive = ({pages, path, arg}) => outter([
        '<h1>Archive</h1>'
    ], 'Archive', path, [
        '<div class="archive-container">',
            postDateList(pages, arg),
        '</div>'
    ]);

    function totalTags(tags){
        let ret = 0;
        for (let name in tags){
            ret += tags[name].size();
        }
        return ret;
    }

    function getTagStyle(len, total){
        let from = 1, to = 3;
        let fs = from + (to - from) * len / total;
        return `font-size: ${fs}em;`;
    }

    let tagCloud = ({tags, path, arg}) => outter([
        '<h1>Tag Cloud</h1>'
    ], 'Tags', path, [
        '<ul class="tag-cloud">',
            () => {
                let total = totalTags(tags);
                return _forIn(tags, (k, v) => [
                    '<li>',
                        `<a href="${escapeS(arg.tags)}${escapeS(regulateName(k))}/" style="${getTagStyle(v.size(), total)}">`,
                            '<i class="fas fa-tag"></i>',
                            escapeHTML(k),
                        '</a>',
                    '</li>'
                ])
            },
        '</ul>'
    ]);

    main.layouts.post = post;
    main.layouts.page = page;
    main.layouts.tag = tag;
    main.layouts.category = category;
    main.layouts.archive = archive;
    main.layouts.tagCloud = tagCloud;
};
