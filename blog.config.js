'use strict';

const theme = require('./theme/default/index.js');

module.exports = async (app) => ({
    title: "Hadroncfy's Notebook",
    webRoot: 'docs/',
    domain: '124.16.112.225:8080',
    author: 'hadroncfy',

    mathjaxURL: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=TeX-AMS_CHTML',
    fontawsomeURL: 'https://use.fontawesome.com/releases/v5.8.1/css/all.css',

    // staticDirs: [
    //     'static/img/2016/',
    //     'static/img/2019/'
    // ],

    links: {
        'zzy(BG6GCZ)': 'https://zzy.blog.ustc.edu.cn/',
        'wxy': 'https://wxyhly.github.io/',
        'futantan': 'https://www.futantan.com/'
    },
    
    plugins: [
        app.staticDirs('static'),
        app.markdownPost([
            'src/posts',
            'src/posts-old'
        ], '/articles'),
        app.categoryManager({
            mainPage: {path: '/', pagesPerPage: 5},
            archive: {path: '/archive', pagesPerPage: 20},
            tags: {path: '/tags', pagesPerPage: 20},
            categories: {path: '/category', pagesPerPage: 20},
        }),
        theme(),
        app.indexGenerator('/search/content.json'),
        app.rss({
            path: '/rss.xml',
            limit: 10
        }),
        app.simpleMarkdownFilter()
    ]
});