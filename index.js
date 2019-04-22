'use strict';

let app = require('./lib/main.js')();

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
    
    app.emit('load');

    await app.waitSources();
    app.logger.info("All pages registered");
}

main().then(() => app.startServer(8080)).catch(e => {
    app.logger.err(e.toString());
    app.logger.err(e.stack);
});