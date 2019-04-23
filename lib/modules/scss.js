'use strict';

const sass = require('node-sass');

class SassRenderer {
    constructor(ctx){
        this.ctx = ctx;
    }
    compileFile(file, resolve, reject){
        sass.render({
            file,
            outputStyle: 'compressed'
        }, (err, result) => {
            if (err){
                reject(err);
            }
            else {
                resolve(result.css);
            }
        });
    }
    register(path, mainFile, files){
        let i = files.indexOf(mainFile);
        if (i > 0){
            let t = files[i];
            files[i] = files[0];
            files[0] = t;
        }

        let h = new SassHandler(this.ctx, this, files);
        this.ctx.pageRegistry.register(path, h);
        this.ctx.pageRegistry.registerSource(h);
        // h.watch();
    }
}

class SassHandler {
    constructor(ctx, renderer, files){
        this.ctx = ctx;
        this.logger = ctx.logger.subTag('Sass');
        this.renderer = renderer;
        this.file = files;

        this.isStatic = false;
        this.mime = 'text/css';

        this.result = null;
    }
    update(cb){
        let src = this.file[0];
        this.ctx.readFile(src, (err, data) => {
            if (err){
                this.logger.err(`Failed to read sass file ${src}: ${err.toString()}`);
                cb && cb(err);
            }
            else {
                this.renderer.compileFile(src, css => { 
                    this.result = css;
                    this.logger.info(`Sass file ${src} compiled`);
                    cb && cb();
                }, err => {
                    this.logger.err(`Failed to parse sass file ${src}: ${err.toString()}`);
                    cb && cb(err);
                });
            }
        });
    }
    handle(os, cb){
        if (this.result === null){
            this.update(err => {
                if (err)
                    cb(err);
                else {
                    os.end(this.result);
                    cb();
                }
            });
        }
        else {
            os.end(this.result);
            cb();
        }
    }
}

exports.SassRenderer = SassRenderer;