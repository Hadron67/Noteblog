'use strict';

const gen = require('./generator.js');
const log = require('./log.js');
const fs = require('fs');
const md = require('./markdown_renderer.js');
const yaml = require('js-yaml');
const event = require('events');
const scss = require('./scss.js');

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
    let emitter = new event.EventEmitter();
    let main = {};
    main.emit = (event, ...arg) => emitter.emit(event, ...arg);
    main.on = (event, cb) => emitter.on(event, cb);

    let theGenerator = gen(main);
    let logger = new log.Logger('VERBOSE', 'Main', console);
    let config = {
        outDir: 'docs',
        pwd: __dirname
    };
    /** @typedef{(resolve: (d) => any, reject: (err) => any) => any} FileRenderer */

    emitter.on('RegisterPage', path => logger.verbose(`Page node ${path} registered`));
    emitter.on('request', (req, path) => logger.info(`Request ${path}`));
    emitter.on('ServerError', err => logger.err(err.toString()));

    function registerRaw(path, handler){
        theGenerator.register(path, handler);
    }

    function unregister(path){
        theGenerator.unregister(path);
    }

    function watch(file, cb){
        fs.watch(file, cb);
    }

    function readFile(file, cb){
        return fs.readFile(file, cb);
    }

    function startServer(port){
        theGenerator.listen(port, () => logger.info(`Server started at port ${port}`));
    }

    function parseYaml(source){
        return yaml.safeLoad(source);
    }
    // Internal methods
    main.registerRaw = registerRaw;
    main.unregister = unregister;
    main.startServer = startServer;
    main.parseYaml = parseYaml;
    main.watch = watch;
    main.readFile = readFile;

    // Internal variables
    main.logger = logger;
    main.layouts = {};
    main.config = config;

    // Externals
    main.markdown = new md.MarkdownContext(main);
    main.scss = new scss.SassRenderer(main);

    return main;
}

module.exports = createMainContext;