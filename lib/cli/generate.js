'use strict';
const pathd = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');

function exists(path){
    return new Promise((resolve, reject) => {
        fs.exists(path, e => resolve(e));
    });
}

function mkdir(dir, opt){
    return new Promise((resolve, reject) => {
        // fs.mkdir(dir, opt, err => err ? reject(err) : resolve());
        mkdirp(dir, err => err ? reject(err) : resolve());
    });
}

function handle(filePath, handler){
    return new Promise((resolve, reject) => {
        let os = fs.createWriteStream(filePath);
        handler.handle(os, err => err ? reject(err) : resolve());
        // os.on('end', () => resolve());
    });
}

async function generatePage(filePath, handler){
    let dir = pathd.dirname(filePath);
    if (!await exists(dir)){
        await mkdir(dir, {recursive: true});
    }
    await handle(filePath, handler);
}

module.exports = params => app => {
    let logger = app.logger.subTag('Generator');
    app.cli.register({
        name: 'generate',
        async exec(argv){
            let start = new Date();
            app.ext.env = "Generate";
            await app.initPages();
            logger.info('Start generating');
            let promises = [];
            app.pageRegistry.forEach((path, handler) => {
                let pathName = '/' + path.join('/');
                let filePath = pathd.join(app.config.outDir, pathName);
                !handler.isStatic && promises.push((async () => {
                    await generatePage(filePath, handler);
                    logger.info(`Generated: ${pathName}`);
                })());
            });
            await Promise.all(promises);
            logger.info(`Generation done in ${(new Date() - start)/1000}s`);
        }
    });
}