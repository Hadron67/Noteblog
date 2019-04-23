'use strict';

const path = require('path');
const pkg = require('../package.json');
let app = require('../lib/main.js')();
const chalk = require('chalk');

const help = 
`Usage: ${pkg.name} [options] <command> [command options]

Options:
    ${chalk.bold('-c, --config')} <config file>   Specify config file (default is blog.config.js);
    ${chalk.bold('-h, --help  ')}                 Display this help message and exit.

Available commands are determined by plugins specified in config file.
`;

function parseArg(argv){
    // let configFile = 'blog.config.js';
    let ret = {configFile: 'blog.config.js', err: null, help: false, version: false};
    
    function requireArg(){
        if (argv.length > 1){
            argv.shift();
            return argv.shift();
        }
        else {
            ret.err = `Option ${argv[0]} requires one argument`;
            argv.shift();
            return null;
        }
    }

    out: while (argv.length){
        switch (argv[0]){
            case '-c':
            case '--config':
                ret.configFile = requireArg();
                break;
            case '-h':
            case '--help':
                argv.shift();
                ret.help = true;
                break;
            case '-v':
            case '--version':
                argv.shift();
                ret.version = true;
            default: break out;
        }
    }

    ret.configFile && (ret.configFile = path.resolve(ret.configFile));
    return ret;
}

function errorWithHelp(e){
    console.error(e);
    console.log('Try --help for more information');
}

async function main(argv){
    let params = parseArg(argv);
    if (params.err){
        errorWithHelp(params.err);
        return -1;
    }
    else if (params.help){
        console.log(help);
        return 0;
    }
    else if (params.version){
        console.log(`Noteblog ${pkg.version}`);
        return 0;
    }
    else if (argv.length){
        let cmdName = argv.shift();
        await app.applyConfig(require(params.configFile));
        let cmd = app.cli.getCommand(cmdName);
        if (cmd.length === 0){
            errorWithHelp(`Unknown command ${cmdName}`);
            return -1;
        }
        else if (cmd.length > 1){
            errorWithHelp(`Ambigious command ${cmdName}, it could be: ${cmd.map(p => p.name).join(', ')}`);
            return -1;
        }
        cmd = cmd[0];
        
        let ret = cmd.exec(argv);

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
    else {
        errorWithHelp('Command expected');
        return -1;
    }
}

module.exports = (argv) => {
    main(argv)
    // .then(c => process.exit(c))
    .catch(err => {
        app.logger.err(`Uncaught ${err.stack}`);
        process.exit(-1);
    });
}