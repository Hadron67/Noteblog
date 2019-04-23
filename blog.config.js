'use strict';

const theme = require('./theme/default/index.js');

module.exports = async (app) => ({
    title: "Hadroncfy's Notebook",
    outDir: 'dist/',
    domain: '124.16.112.225:8080',
    author: 'hadroncfy',

    mathjaxURL: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=TeX-AMS_CHTML',
    fontawsomeURL: 'https://use.fontawesome.com/releases/v5.8.1/css/all.css',

    links: {
        'zzy(BG6GCZ)': 'https://zzy.blog.ustc.edu.cn/',
        'wxy': 'https://wxyhly.github.io/',
        'futantan': 'https://www.futantan.com/'
    },

    imagePath: '/static/img',
    
    plugins: [
        app.staticDirs('src/static', '/static'),
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
        theme({
            oldBlogTime: '2016-07-24 15:45:26'
        }),
        app.indexGenerator('/search/content.json'),
        app.rss({
            path: '/rss.xml',
            limit: 10
        }),
        app.simpleMarkdownFilter(),
        app.server(),
        app.generator()
    ]
});