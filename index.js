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
            }
        }
        catch(e){
            app.logger.err(`Failed to load module ${src}: ${e.stack}`);
        }
    }
    refresh();
    app.watch(src, (event, fn) => event === 'change' && refresh());
}

let r = require('./blog.config.js')(app);
if (r.then){
    r.then(() => app.startServer(8080));
}
else
    app.startServer(8080);