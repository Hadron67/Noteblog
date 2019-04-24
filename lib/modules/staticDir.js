'use strict';
const find0 = require('../util/find.js');
const path = require('path');

function find(dir){
    return new Promise((resolve, reject) => {
        find0(dir, {}, (err, files) => err ? reject(err) : resolve(files));
    });
}

module.exports = (dir, outDir) => async (app) => {
    let files = await find(dir);

    app.on('init-pages', () => {
        for (let file of files){
            let fn = file.toString();
            app.file.register(path.join('/', outDir, fn), path.join(dir, fn));
        }
    });
    // await Promise.all(config.staticDirs.map(dir => registerStaticDir(app, config.webRoot, dir)));
}