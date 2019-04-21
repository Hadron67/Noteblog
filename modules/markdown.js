'use strict';

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

module.exports = (posts, pathBase) => async (app) => {
    posts = await readPostFiles(app, posts);
    app.on('load', () => {
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