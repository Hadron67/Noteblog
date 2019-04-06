'use strict';

const cp = require('./component.js');
const gen = require('./generator.js');
const log = require('./log.js');
const fs = require('fs');
const md = require('./markdown_renderer.js');
const yaml = require('js-yaml');
const event = require('events');
const scss = require('./scss.js');
const PageGroup = require('./page_group.js');
const helper = require('./helper.js');
const StaticContext = require('./static.js');

function getSuffix(fname){
    let i = fname.lastIndexOf('.');
    if (i === -1){
        return '';
    }
    else {
        return fname.substr(i, fname.length - i);
    }
}
const hexes = '0123456789abcdef';
function randomHex(len){
    let ret = '';
    while (len--){
        ret += hexes.charAt((Math.random() * 16) | 0);
    }
    return ret;
}

function createMainContext(){
    let emitter = new event.EventEmitter();
    let main = {};
    main.emit = (event, ...arg) => emitter.emit(event, ...arg);
    main.on = (event, cb) => emitter.on(event, cb);

    let theGenerator = gen(main);
    let logger = new log.Logger('VERBOSE', 'Main', console);
    let config = {
        title: 'Blog de CFY',
        outDir: 'docs',
        pwd: __dirname
    };
    let ids = {};
    /** @typedef{(resolve: (d) => any, reject: (err) => any) => any} FileRenderer */

    emitter.on('RegisterPage', path => logger.info(`Page node ${path} registered`));
    emitter.on('request', (req, path) => logger.info(`Request ${path}`));
    emitter.on('ServerError', err => logger.err(err.toString()));

    function uniqueID(){
        let id;
        // Checking for collision here is almost redundant, but necessary for absolute reliablity
        while (ids.hasOwnProperty(id = randomHex(32)));
        ids[id] = true;
        return id;
    }

    function registerRaw(path, handler){
        theGenerator.register(path, handler);
    }

    function registerTemplate(path, temp, arg){
        theGenerator.register(path, {
            handle(resolve, reject){
                resolve(cp.render(temp, arg));
            },
            isStatic: false,
            mime: 'text/html'
        });
    }

    function unregister(path){
        theGenerator.unregister(path);
        logger.info(`Page node ${path} unregistered`);
    }

    function watch(file, cb){
        return fs.watch(file, cb);
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
    main.registerTemplate = registerTemplate;
    main.unregister = unregister;
    main.startServer = startServer;
    main.parseYaml = parseYaml;
    main.watch = watch;
    main.readFile = readFile;
    main.uniqueID = uniqueID;

    // Internal variables
    main.logger = logger;
    main.layouts = {};
    main.config = config;

    // Externals
    main.markdown = new md.MarkdownContext(main);
    main.scss = new scss.SassRenderer(main);
    main.pageGroup = () => new PageGroup(main);
    main.static = new StaticContext(main);
    helper(main);

    return main;
}

module.exports = createMainContext;