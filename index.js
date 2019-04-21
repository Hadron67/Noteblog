'use strict';

let app = require('./lib/main.js')();

async function registerStaticDir(app, webRoot, dir){
    (await app.helper.readFiles(webRoot + dir)).forEach(f => app.file.register('/' + dir + f, webRoot + dir + f, true));
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

async function main(){
    let config = await (require('./blog.config.js'))(app);
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

    await app.waitSources();
    app.logger.info("All pages registered");
}

main().then(() => app.startServer(8080)).catch(e => {
    app.logger.err(e.toString());
    app.logger.err(e.stack);
});