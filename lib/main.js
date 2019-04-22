'use strict';

const cp = require('./component.js');
const gen = require('./generator.js');
const log = require('./log.js');
const fs = require('fs');
const yaml = require('js-yaml');
const event = require('events');
const merge = require('./util/merge.js');
const CIContext = require('./cli.js');
const HotModule = require('./hot.js');

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

    let theGenerator = gen(main);
    let logger = new log.Logger('VERBOSE', 'Main', console);
    let ids = {};
    /** @typedef{(resolve: (d) => any, reject: (err) => any) => any} FileRenderer */

    let sources = [];

    emitter.on('RegisterPage', path => logger.info(`Page node ${path} registered`));
    emitter.on('request', (req, path) => logger.info(`[${req.socket.remoteAddress}]: Request ${path}`));
    emitter.on('ServerError', err => logger.err(err.toString()));

    class TemplateHandler {
        constructor(path, temp, arg){
            this.isStatic = false;
            this.mime = 'text/html';

            this.temp = temp;
            this.arg = merge({path}, arg);
        }
        handle(os, cb){
            try {
                os.end(cp.render(this.temp, this.arg));
                cb();
            }
            catch(e){
                cb(e.stack);
            }
        }
    }

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

    function register(path, handler){
        theGenerator.register(path, handler);
    }

    function registerTemplate(path, temp, arg){
        theGenerator.register(path, new TemplateHandler(path, temp, arg));
    }

    function registerSource(src){
        sources.push(src);
    }

    async function waitSources(){
        await Promise.all(sources);
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
        return yaml.safeLoad(source, {
            schema: yaml.JSON_SCHEMA
        });
    }

    async function applyPlugins(plugins){
        let asyncPlugins = [];
        for (let p of plugins){
            let r = p(app);
            if (r && r.then && r.catch){
                asyncPlugins.push(r);
            }
        }
        asyncPlugins.length > 0 && (await Promise.all(asyncPlugins));
        
        app.emit('load');
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
        
        // emitter.emit('load');
    }

    // Internal methods
    main.register = register;
    main.registerTemplate = registerTemplate;
    main.registerSource = registerSource;
    main.unregister = unregister;
    main.startServer = startServer;
    main.waitSources = waitSources;
    main.parseYaml = parseYaml;
    main.watch = watch;
    main.readFile = readFile;
    main.uniqueID = uniqueID;
    main.invalidateID = invalidateID;
    main.applyConfig = applyConfig;
    
    // Internal variables
    main.logger = logger;
    main.layouts = {};
    main.config = {};
    
    // Externals
    external(main);
    main.cli = new CIContext(main);
    main.hot = new HotModule(main);
    main.ext = {};
    main.extend = {};

    return main;
}

module.exports = createMainContext;