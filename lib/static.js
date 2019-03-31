'use strict';
const mime = require('mime');


class StaticContext {
    constructor(ctx) {
        this.ctx = ctx;
    }
    register(path){
        this.ctx.registerRaw(path, new StaticHandler(this.ctx, path));
    }
}

class StaticHandler {
    constructor(ctx, path){
        this.ctx = ctx;
        this.path = path;
        this.isStatic = true;
        this.id = ctx.uniqueID();
        this.mime = mime.getType(path);
    }
    isReady(){
        return true;
    }
    handle(resolve, reject){
        this.ctx.readFile(this.ctx.config.webRoot + this.path, (err, data) => err ? reject(err) : resolve(data));
    }
};

module.exports = StaticContext;