'use strict';

let app = require('./lib/main.js')();
require('./blog.config.js')(app);

app.startServer(8080);