'use strict';

class Handler {
    constructor(hotm, file){
        this.hotm = hotm;
        this.file = file;
    }
    update(cb){
        let app = this.hotm.ctx;
        let src = this.file;
        try {
            delete require.cache[require.resolve(src)];
            let m = require(src);
            if (typeof m === 'function'){
                m(app);
                this.hotm.logger.info(`Loaded: ${src}`);
                cb && cb();
            }
            else if (cb){
                cb('Module is not a function');
                cb = null;
            }
        }
        catch(e){
            app.logger.err(`Failed to load module ${src}: ${e.stack}`);
            cb && cb(e.stack);
        }
    }
}

class HotModule {
    constructor(ctx){
        this.ctx = ctx;
        this.logger = ctx.logger.subTag('HotModule');
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
        let h = new Handler(this, src);
        this.ctx.pageRegistry.registerSource(h);
        h.update(cb);
    }
}
module.exports = HotModule;