'use strict';

const gen = require('./generator.js');
const log = require('./log.js');
const fs = require('fs');
const scss = require('node-sass');

function getSuffix(fname){
    let i = fname.lastIndexOf('.');
    if (i === -1){
        return '';
    }
    else {
        return fname.substr(i, fname.length - i);
    }
}

function createMainContext(){
    let theGenerator = gen();
    let logger = new log.Logger('VERBOSE', 'Main', console);
    let config = {
        outDir: 'docs',
        pwd: __dirname
    };
    /** @typedef{(resolve: (d) => any, reject: (err) => any) => any} FileRenderer */
    /** @type{{[s: string]: FileRenderer}} */
    let fileRendererMap = {};

    theGenerator.onRegisterPage(path => logger.verbose(`Page node ${path} registered`));
    theGenerator.onRequest((req, path) => logger.info(`Request ${path}`));

    function registerRaw(path, factory){
        theGenerator.register(path, factory);
    }

    function startServer(port){
        theGenerator.listen(port, () => logger.info(`Server started at port ${port}`));
    }

    return {
        registerRaw,
        startServer,

        logger
    };
}

module.exports = createMainContext;