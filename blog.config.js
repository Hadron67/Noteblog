'use strict';

const fs = require('fs');

function compareDate(a, b){
    let d1 = a.article.data, d2 = b.article.date;
    return d1 > d2 ? 1 : d1 < d2 ? -1 : 0;
}

module.exports = app => {
    app.config = {
        title: 'Blog de CFY',
        mathjaxURL: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.1/MathJax.js?config=TeX-AMS-MML_HTMLorMML'
    };
    
    app.registerModule('templates.js');
    
    app.scss.register('/css/main.css', ['src/sass/main.scss', 'src/sass/article.scss']);
    
    fs.readdir('src/posts', (err, files) => {
        let posts = files.filter(f => f.endsWith('.md')).map(f => app.markdown.register(app.markdown.dateToPath('/article'), 'src/posts/' + f));
        app.pageGroup()
            .registerAll(posts)
            .paginate(arg => app.layouts.page(arg), i => i === 1 ? '/index.html' : `/page-${i}.html`, compareDate, 5)
            .on('load', () => app.logger.info('All posts loaded'));
    });
};