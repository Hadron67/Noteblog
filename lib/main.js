'use strict';

const cp = require('./component.js');
const log = require('./log.js');
const yaml = require('js-yaml');
const event = require('events');
const CIContext = require('./cli.js');
const HotModule = require('./hot.js');
const PageRegistry = require('./page_registry.js');
const pathd = require('path');

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
    /** @typedef{(resolve: (d) => any, reject: (err) => any) => any} FileRenderer */

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

    function parseYaml(source){
        return yaml.safeLoad(source, {
            schema: yaml.JSON_SCHEMA
        });
    }
    
    function render(t){
        main.rendering = t;
        this.emit('render');
        let ret = cp.render(t.template, t.arg);
        main.rendering = null;
        return ret;
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
        await main.pageRegistry.updateSources();
    }

    // Internal methods
    main.parseYaml = parseYaml;
    main.uniqueID = uniqueID;
    main.invalidateID = invalidateID;
    main.applyConfig = applyConfig;
    main.initPages = initPages;
    main.path = p => pathd.join(pathd.join('/', main.config.webRoot || '/'), p);
    
    // Internal variables
    main.logger = logger;
    main.layouts = {};
    main.config = {};
    main.rendering = null;
    main.render = render;
    
    // Externals
    external(main);
    main.pageRegistry = new PageRegistry(main);
    main.cli = new CIContext(main);
    main.hot = new HotModule(main);
    main.env = {};
    main.ext = {};
    main.extend = {};

    return main;
}

module.exports = createMainContext;