'use strict';

const find = require('../util/find.js');
const pathd = require('path');

async function readPostFiles(dirs){
    // let p = await Promise.all(dirs.map(p => app.helper.readFiles(p)));
    let ret = [];
    await Promise.all(dirs.map(p => new Promise((resolve, reject) => {
        find(p, {}, (err, files) => {
            if (err){
                reject(err);
                return;
            }
            for (let f of files.filter(f => f.fname.endsWith('.md')).map(f => pathd.join(p, f.toString()))){
                ret.push(f);
            }
            resolve();
        });
    })));

    return ret;
}

module.exports = (posts, pathBase) => async (app) => {
    posts = await readPostFiles(posts);
    pathBase = app.path(pathBase);
    app.on('init-pages', () => {
        posts = posts.map(p => app.markdown.register(app.markdown.dateToPath(pathBase), p));

        let onUpdate = page => app.extend.blogManager.updatePage(page);
        let onRemove = page => app.extend.blogManager.removePage(page);
        posts.forEach(p => {
            p.on('update', onUpdate);
            p.on('remove', onRemove);
        });
    });
}