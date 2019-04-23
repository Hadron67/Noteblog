'use strict';

class CIContext {
    constructor(ctx){
        this.ctx = ctx;
        this.cli = [];
    }
    _ensureNoDuplicate(cmd){
        for (let n of this.cli){
            if (cmd.name === n.name){
                throw new Error(`Duplicate command ${cmd.name}`);
            }
        }
    }
    register(cmd){
        this._ensureNoDuplicate(cmd);
        this.cli.push(cmd);
    }
    getCommand(cmdName){
        return this.cli.filter(c => c.name.indexOf(cmdName) === 0);
    }
    exec(argv){
        if (argv.length === 0){
            return 'Command expected';
        }
        let cmdName = argv.shift();
        let cmd = this.cli.filter(c => c.name.indexOf(cmdName) === 0);
        if (cmd.length === 0){
            return `Unknown command ${cmdName}`;
        }
        else if (cmd.length > 1){
            return `Ambiguous command ${cmdName}`;
        }
        else {
            return cmd[0].exec(argv);
        }
    }
}

module.exports = CIContext;