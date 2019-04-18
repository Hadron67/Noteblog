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
    posts = posts.map(p => app.markdown.register(app.markdown.dateToPath(pathBase), p));
    
    let listener = page => app.extend.blogManager.updatePage(page);
    posts.forEach(p => p.on('update', listener));
}