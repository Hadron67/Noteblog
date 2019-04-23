'use strict';

const Router = require('./router.js');
const event = require('events');
const merge = require('./util/merge.js');
const cp = require('./component.js');
const fs = require('fs');

class TemplateHandler {
    constructor(path, temp, arg){
        this.path = path;
        this.isStatic = false;
        this.mime = 'text/html';

        this.temp = temp;
        this.arg = merge({path}, arg);
    }
    handle(os, cb){
        try {
            os.end(cp.render(this.temp, this.arg));
            cb();
        }
        catch(e){
            cb(e.stack);
        }
    }
}

class PageRegistry extends event.EventEmitter {
    constructor(ctx){
        super();
        this.ctx = ctx;
        this.logger = ctx.logger.subTag('PageRegistry');
        this.router = new Router();

        this.sources = [];

        this.errHandler = {
            '404': null
        };
    }
    register(handler){
        let path = handler.path;
        if (path === '404'){
            this.errHandler['404'] = handler;
        }
        else
            this.router.addRoute(path, handler);
        // this.emit('RegisterPage', path);
        this.logger.info(`Registered: ${path}`);
    }
    unregister(path){
        this.router.removeRoute(path);
        this.logger.info(`Unregistered: ${path}`);
    }
    registerSource(src){
        this.sources.push(src);
    }
    async updateSources(){
        await Promise.all(this.sources.map(p => new Promise((resolve, reject) => {
            p.update(err => err ? reject(err) : resolve());
        })));
    }
    watchFiles(){
        for (let src of this.sources){
            if (typeof src.file === 'string'){
                fs.watch(src.file, () => src.update());
            }
            else {
                for (let f of src.file){
                    fs.watch(f, () => src.update());
                }
            }
        }
    }
    registerTemplate(path, temp, arg){
        this.register(new TemplateHandler(path, temp, arg));
    }
    getHandler(path){
        return this.router.findRoute(path);
    }
    getErrorHandler(code){
        return this.errHandler[code.toString()];
    }
    forEach(cb){
        this.router.forEach(cb);
    }
}

module.exports = PageRegistry;