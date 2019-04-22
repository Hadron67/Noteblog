'use strict';

const Router = require('./router.js');
const event = require('events');
const merge = require('./util/merge.js');
const cp = require('./component.js');

class TemplateHandler {
    constructor(path, temp, arg){
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

        this.errHandler = {
            '404': null
        };
    }
    register(path, handler){
        if (path === '404'){
            this.errHandler['404'] = handler;
        }
        else
            this.router.addRoute(path, handler);
        // this.emit('RegisterPage', path);
        this.logger.info(`Page node ${path} registered`);
    }
    unregister(path){
        this.router.removeRoute(path);
        this.logger.info(`Page node ${path} unregistered`);
    }
    registerTemplate(path, temp, arg){
        this.register(path, new TemplateHandler(path, temp, arg));
    }
    getHandler(path){
        return this.router.findRoute(path);
    }
    getErrorHandler(code){
        return this.errHandler[code.toString()];
    }
}

module.exports = PageRegistry;