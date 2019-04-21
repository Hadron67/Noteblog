'use strict';

class HotModule {
    constructor(ctx){
        this.ctx = ctx;
    }
    register(src, cb){
        let app = this.ctx;
        function refresh(){
            try {
                delete require.cache[require.resolve(src)];
                let m = require(src);
                if (typeof m === 'function'){
                    m(app);
                    app.logger.info(`Module ${src} loaded`);
                    if (cb){
                        cb();
                        cb = null;
                    }
                }
            }
            catch(e){
                app.logger.err(`Failed to load module ${src}: ${e.stack}`);
            }
        }
        refresh();
        app.watch(src, (event, fn) => event === 'change' && refresh());
    }
}
module.exports = HotModule;