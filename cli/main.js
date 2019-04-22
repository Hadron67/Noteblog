'use strict';

const path = require('path');
let app = require('../lib/main.js')();


function parseArg(argv){
    let configFile = 'blog.config.js';
    if (argv[0] === '-c'){
        argv.shift();
        if (argv.length > 0){
            configFile = argv.shift();
        }
        else {
            console.log('File name expected after -c option');
            return null;
        }
    }
    if (argv.length > 0){
        return path.resolve(configFile);
    }
    else {
        console.log('Command expected');
        return null;
    }
}

async function main(argv){
    let configFile = parseArg(argv);
    if (configFile === null){
        return -1;
    }
    else {
        await app.applyConfig(require(configFile));
        let ret = app.cli.exec(argv);
        if (typeof ret === 'string'){
            console.log(ret);
            return -1;
        }
        else {
            if (ret && ret.then){
                ret = await ret;
            }
            return ret;
        }
    }
}

module.exports = (argv) => {
    main(argv)
    .then(c => process.exit(c))
    .catch(err => {
        app.logger.err(`Uncaught ${err.stack}`);
        process.exit(-1);
    });
}