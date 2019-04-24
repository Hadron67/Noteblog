'use strict';
const cpc = require('child_process');
const fs = require('fs');
const pathd = require('path');
const fsx = require('../util/fsx.js');
const find = require('../util/find.js');

module.exports = params => app => {
    let url = params.url;
    let branch = params.branch || 'master';
    let msg = params.message || `blog update: ${new Date().toLocaleString()}`;
    let cwd = params.deployDir || '.deploy';
    
    function git(...args){
        return new Promise((resolve, reject) => {
            let task = cpc.spawn('git', args, {
                cwd
            });
            task.on('error', reject);
            task.on('close', e => e ? reject(e) : resolve());
            task.stdout.pipe(process.stdout);
            task.stderr.pipe(process.stderr);
        });
    }

    async function prepareEnv(){
        if (!await fsx.exists(cwd)){
            await fsx.mkdir(cwd);
        }
        if (!await fsx.exists(pathd.join(cwd, '.git'))){
            await git('init');
            await git('remote', 'add', 'origin', url);
        }
        await fsx.emptyDir(cwd);
        // console.log((await app.helper.find(cwd, {})).map(f => f.toString()).join('\n'));
        await fsx.copyDir(app.config.outDir, cwd);
    }
    
    app.cli.register({
        name: 'deploy',
        async exec(argv){
            await prepareEnv();
            await git('add', '.');
            await git('commit', '-m', msg);
            await git('push', 'origin', branch);
        }
    });
}