'use strict';

const cp = require('./component.js');
const log = require('./log.js');
const fs = require('fs');
const yaml = require('js-yaml');
const event = require('events');
const merge = require('./util/merge.js');
const CIContext = require('./cli.js');
const HotModule = require('./hot.js');
const PageRegistry = require('./page_registry.js');

const external = require('./external.js');

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

    // let theGenerator = gen(main);
    let logger = new log.Logger('VERBOSE', 'Main', console);
    let ids = {};
    let watchEnabled = true;
    /** @typedef{(resolve: (d) => any, reject: (err) => any) => any} FileRenderer */

    let sources = [];

    function uniqueID(){
        let id;
        // Checking for collision here is almost redundant, but necessary for absolute reliablity
        while (ids.hasOwnProperty(id = randomHex(32)));
        ids[id] = true;
        return id;
    }

    function invalidateID(id){
        delete ids[id];
    }

    function registerSource(src){
        sources.push(src);
    }

    async function waitSources(){
        await Promise.all(sources);
    }

    function watch(file, cb){
        if (watchEnabled){
            return fs.watch(file, cb);
        }
        else {
            return null;
        }
    }

    function disableWatch(){
        watchEnabled = false;
    }

    function readFile(file, cb){
        return fs.readFile(file, cb);
    }

    function startServer(port){
        theGenerator.listen(port, () => logger.info(`Server started at port ${port}`));
    }

    function parseYaml(source){
        return yaml.safeLoad(source, {
            schema: yaml.JSON_SCHEMA
        });
    }

    async function applyConfig(config){
        config = await config(main);
        main.config = config;
        let asyncPlugins = [];

        for (let p of config.plugins){
            let r = p(main);
            if (r && r.then && r.catch){
                asyncPlugins.push(r);
            }
        }
        asyncPlugins.length > 0 && (await Promise.all(asyncPlugins));
    }

    async function initPages(){
        emitter.emit('init-pages');
        await waitSources();
    }

    // Internal methods
    main.registerSource = registerSource;
    main.startServer = startServer;
    main.parseYaml = parseYaml;
    main.watch = watch;
    main.disableWatch = disableWatch;
    main.readFile = readFile;
    main.uniqueID = uniqueID;
    main.invalidateID = invalidateID;
    main.applyConfig = applyConfig;
    main.initPages = initPages;
    
    // Internal variables
    main.logger = logger;
    main.layouts = {};
    main.config = {};
    
    // Externals
    external(main);
    main.pageRegistry = new PageRegistry(main);
    main.cli = new CIContext(main);
    main.hot = new HotModule(main);
    main.ext = {};
    main.extend = {};

    return main;
}

module.exports = createMainContext;