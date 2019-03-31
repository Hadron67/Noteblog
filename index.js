'use strict';

let app = require('./lib/main.js')();
let r = require('./blog.config.js')(app);
if (r.then){
    r.then(() => app.startServer(8080));
}
else
    app.startServer(8080);