'use strict';

const find = require('../util/find.js');
const pathd = require('path');

async function readPostFiles(dirs){
    // let p = await Promise.all(dirs.map(p => app.helper.readFiles(p)));
    let ret = [];
    await Promise.all(dirs.map(p => new Promise((resolve, reject) => {
        find(p, (err, files) => {
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
    app.on('init-pages', () => {
        app.registerSource(new Promise((resolve, reject) => {
            posts = posts.map(p => app.markdown.register(app.markdown.dateToPath(pathBase), p));
            let postIDs = {};

            let count = 0;
            let onUpdate = page => app.extend.blogManager.updatePage(page);
            let onRemove = page => app.extend.blogManager.removePage(page);
            let onCompiled = page => {
                delete postIDs[page.id];
                let len = Object.keys(postIDs).length;
                len === 0 && resolve();
            };
            posts.forEach(p => {
                postIDs[p.id] = true;
                p.on('update', onUpdate);
                p.on('remove', onRemove);
                p.on('compiled', onCompiled);
            });
        }));
    });
}