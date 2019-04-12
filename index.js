'use strict';

let app = require('./lib/main.js')();

app.registerModule = (src, cb) => {
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

async function main(){
    let config = await (require('./blog.config.js'))(app);
    let theme = require('./theme/' + config.theme + '/index.js');
    await theme(app, config);
}

main().then(() => app.startServer(8080)).catch(e => app.logger.err(e.toString()));