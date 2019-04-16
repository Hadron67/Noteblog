'use strict';

let theme = require('./theme/default/index.js');

async function readPostFiles(app, dirs){
    let p = await Promise.all(dirs.map(p => app.helper.readFiles(p)));
    let ret = [];
    for (let i = 0; i < p.length; i++){
        for (let file of p[i].filter(f => f.endsWith('.md')).map(f => dirs[i] + f)){
            ret.push(file);
        }
    }
    return ret;
}

module.exports = async (app) => ({
    title: "Hadroncfy's Notebook",
    webRoot: 'docs/',
    domain: '124.16.113.131:8080',

    staticDirs: [
        'static/img/2016/',
        'static/img/2019/',
        'static/js/'
    ],

    
    plugins: [
        theme({
            posts: await readPostFiles(app, [
                'src/posts/',
                'src/posts-old/'
            ]),

            articles: '/article/',
            articlesPerPage: 5,
            archive: {path: '/archive/', pagesPerPage: 20},
            tags: {path: '/tags/', pagesPerPage: 20},
            categories: {path: '/category/', pagesPerPage: 20},
        
            links: {
                'zzy(BG6GCZ)': 'https://zzy.blog.ustc.edu.cn/',
                'wxy': 'https://wxyhly.github.io/',
                'futantan': 'https://www.futantan.com/'
            }
        })
    ]
});