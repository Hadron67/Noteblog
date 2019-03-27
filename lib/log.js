'use strict';

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
    return function(message){
        if (level <= this.level){
            let t = new Date();
            let ds = t.toLocaleDateString() + ' ' + t.toLocaleTimeString();
            this.console.log(`[${ds}] [${this.tag}/${levelTag}] ${message}`);
        }
    }
}

function Logger(level, tag, console){
    if (LogLevel.hasOwnProperty(level)){
        this.level = LogLevel[level];
    }
    else 
        throw new Error(`Unknown log level ${level}`);
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