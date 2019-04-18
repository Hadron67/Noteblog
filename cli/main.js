'use strict';

let app = require('../lib/main.js')();

async function registerStaticDir(app, webRoot, dir){
    (await app.helper.readFiles(webRoot + dir)).forEach(f => app.static.register('/' + dir + f));
}

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

async function init(configFile){
    let config = await (require(configFile))(app);
    app.config = config;

    let asyncPlugins = [];
    for (let p of config.plugins){
        let r = p(app);
        if (r && r.then && r.catch){
            asyncPlugins.push(r);
        }
    }
    asyncPlugins.length > 0 && (await Promise.all(asyncPlugins));
    
    await Promise.all(config.staticDirs.map(dir => registerStaticDir(app, config.webRoot, dir)));
    app.emit('load');
}

main().then(() => app.startServer(8080)).catch(e => {
    app.logger.err(e.toString());
    app.logger.err(e.stack);
});