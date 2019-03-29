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
    register(path, files){
        if (typeof files === 'string'){
            files = [files];
        }
        let h = new SassHandler(this.ctx, this, files);
        this.ctx.registerRaw(path, h);
        h.watch();
    }
}

class SassHandler {
    constructor(ctx, renderer, files){
        this.ctx = ctx;
        this.renderer = renderer;
        this.files = files;

        this.isStatic = false;
        this.mime = 'text/css';

        this.result = null;
        this.refresh();
    }
    watch(){
        let cb = (event) => event === 'change' && this.refresh();
        for (let f of this.files){
            this.ctx.watch(f, cb);
        }
    }
    refresh(){
        this.ctx.readFile(this.files[0], (err, data) => {
            if (err){
                this.ctx.logger.err(`Failed to read sass file ${this.files[0]}: ${err.toString()}`);
            }
            else {
                this.renderer.compileFile(this.files[0], css => { 
                    this.result = css;
                    this.ctx.logger.info(`Sass file ${this.files[0]} compiled`);
                }, err => {
                    this.ctx.logger.err(`Failed to parse sass file ${this.files[0]}: ${err.toString()}`);
                });
            }
        });
    }
    handle(resolve, reject){
        this.result === null ? reject('No sass file present') : resolve(this.result);
    }
}

exports.SassRenderer = SassRenderer;