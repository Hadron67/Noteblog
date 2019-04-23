'use strict';

const mime = require('mime');
const fs = require('fs');

class FileContext {
    constructor(ctx) {
        this.ctx = ctx;
    }
    register(path, filePath, isStatic = false){
        this.ctx.pageRegistry.register(new FileHandler(this.ctx, path, filePath, isStatic));
    }
}

class FileHandler {
    constructor(ctx, path, filePath, isStatic){
        this.ctx = ctx;
        this.path = path;
        this.filePath = filePath;
        this.isStatic = isStatic;
        this.id = ctx.uniqueID();
        this.mime = mime.getType(path);
    }
    isReady(){
        return true;
    }
    handle(os, cb){
        let is = fs.createReadStream(this.filePath);
        is.pipe(os);
        is.on('end', () => cb());
        is.on('error', err => cb(err));
    }
};

module.exports = FileContext;