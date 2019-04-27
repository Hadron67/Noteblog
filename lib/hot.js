'use strict';

function removeFromArray(a, item){
    let i = a.indexOf(item);
    if (i !== -1){
        if (i !== a.length - 1){
            let t = a[i];
            a[i] = a[a.length - 1];
            a[a.length - 1] = t;
        }
        a.pop();
    }
}

class Handler {
    constructor(hotm, file, resolved){
        this.hotm = hotm;
        this.file = file;

        this.resolved = resolved || require.resolve(file);

        this.func = null;
        this.val = null;
        
        this.dependents = [];
        this.depenencies = [];
    }
    require(path){
        let ret = this.hotm.require(path);
        ret.eval();
        this.hotm.logger.info(`Require: ${path}`);
        ret.dependents.indexOf(this) === -1 && ret.dependents.push(this);
        this.depenencies.indexOf(ret) === -1 && this.depenencies.push(this);
        return ret.val;
    }
    _clearDependencies(){
        for (let d of this.depenencies){
            removeFromArray(d.dependents, this);
        }
        this.depenencies.length = 0;
    }
    eval(){
        if (this.val !== null){
            return this.val;
        }
        else {
            if (this.func === null){
                delete require.cache[this.resolved];
                let m = require(this.resolved);
                if (typeof m === 'function'){
                    this.func = m;
                    this._clearDependencies();
                }
                else {
                    throw new Error('Module is not a function');
                }
            }
            return this.val = this.func(this.hotm.ctx, this);
        }
    }
    refresh(){
        this.val = null;
        this.eval();
        this.hotm.logger.info(`Refreshed: ${this.file}`);
        for (let d of this.dependents){
            d.refresh();
        }
    }
    update(cb){
        let app = this.hotm.ctx;
        let src = this.file;
        try {
            this.func = this.val = null;
            this.eval();
            this.hotm.logger.info(`Loaded: ${src}`);
            for (let d of this.dependents){
                d.refresh();
            }
            cb && cb();
        }
        catch(e){
            e = e.stack;
            app.logger.err(`Failed to load module ${src}: ${e}`);
            cb && cb(e);
            cb = null;
        }
    }
}

class HotModule {
    constructor(ctx){
        this.ctx = ctx;
        this.logger = ctx.logger.subTag('HotModule');
        this.cache = {};
    }
    require(path){
        let resolved = require.resolve(path);
        if (this.cache.hasOwnProperty(resolved)){
            return this.cache[resolved];
        }
        else {
            let h = new Handler(this, path, resolved);
            this.ctx.pageRegistry.registerSource(h);
            return h;
        }
    }
    register(src, cb){
        if (cb){
            return this._register(src, cb);
        }
        else {
            return new Promise((resolve, reject) => {
                this._register(src, err => err ? reject(err): resolve());
            });
        }
    }
    _register(src, cb){
        let h;
        try {
            h = this.require(src);
        }
        catch(e){
            cb(e.stack);
            return;
        }
        h.update(cb);
    }
}
module.exports = HotModule;