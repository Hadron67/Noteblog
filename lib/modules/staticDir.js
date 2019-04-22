'use strict';
const find0 = require('../util/find.js');
const path = require('path');

function find(dir){
    return new Promise((resolve, reject) => {
        find0(dir, (err, files) => err ? reject(err) : resolve(files));
    });
}

module.exports = dir => async (app) => {
    let base = path.join(app.config.webRoot, dir);
    let files = await find(base);

    app.on('init-pages', () => {
        for (let file of files){
            app.file.register(path.join('/', dir, file.toString()), path.join(base, file.toString()), true);
        }
    });
    // await Promise.all(config.staticDirs.map(dir => registerStaticDir(app, config.webRoot, dir)));
}