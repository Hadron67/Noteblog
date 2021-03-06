'use strict';
const chalk = require('chalk');

const LogLevel = (() => {
    let i = 0;
    return {
        ERR: i++,
        WARN: i++,
        INFO: i++,
        VERBOSE: i++
    };
})();

function logFunc(levelTag){
    let level = LogLevel[levelTag];
    let chalkFunc;
    switch (levelTag){
        case 'ERR': chalkFunc = s => chalk.red(s); break;
        case 'WARN': chalkFunc = s => chalk.yellow(s); break;
        default: chalkFunc = s => s;
    }

    return function(message){
        if (level <= this.level){
            let t = new Date();
            let ds = t.toLocaleDateString() + ' ' + t.toLocaleTimeString();
            // Minecraft-like logging format
            this.console.log(chalk.blue(`[${ds}] [${this.tag}/${levelTag}] `) + chalkFunc(message));
        }
    }
}

function Logger(level, tag, console){
    if (typeof level === 'number'){
        this.level = level;
    }
    else {
        if (LogLevel.hasOwnProperty(level)){
            this.level = LogLevel[level];
        }
        else 
            throw new Error(`Unknown log level ${level}`);
    }
    this.console = console;
    this.tag = tag;
}
Logger.prototype.subTag = function(tag){
    return new Logger(this.level, tag, this.console);
}
Logger.prototype.err = logFunc('ERR');
Logger.prototype.warn = logFunc('WARN');
Logger.prototype.info = logFunc('INFO');
Logger.prototype.verbose = logFunc('VERBOSE');

exports.Logger = Logger;