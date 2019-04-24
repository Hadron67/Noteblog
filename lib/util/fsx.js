'use strict';
const fs = require('fs');
const walkDir = require('./dir-walker.js');
const pathd = require('path');
const find = require('./find.js');

function rmFile(file){
    return new Promise((resolve, reject) => {
        fs.unlink(file, err => err ? reject(err) : resolve());
    });
}

function rmdir(dir){
    return new Promise((resolve, reject) => {
        fs.rmdir(dir, err => err ? reject(err) : resolve());
    });
}

function copy(from, to){
    return new Promise((resolve, reject) => {
        fs.copyFile(from, to, err => err ? reject(err) : resolve());
    });
}

function exists(f){
    return new Promise((resolve, reject) => {
        fs.exists(f, e => resolve(e));
    });
}

function mkdir(dir){
    return new Promise((resolve, reject) => {
        fs.mkdir(dir, err => err ? reject(err) : resolve());
    });
}

function readdir(dir){
    return new Promise((resolve, reject) => {
        fs.readdir(dir, (err, files) => err ? reject(err) : resolve(files));
    });
}

async function rmdir2(d){
    while(true){
        try {
            return await rmdir(d);
        }
        catch(e){
            // Not empty??
            console.log('Caught: ' + e + '\n' + 'dir content: ' + (await readdir(d)).join(','));
            // console.log((await readdir(d)));
        }
    }
}

async function mkdirIfNExist(dir){
    if (!await exists(dir)){
        await mkdir(dir);
    }
}

function ls(dir){
    return new Promise((resolve, reject) => {
        let ret = [];
        fs.readdir(dir, (err, files) => {
            if (err){
                reject(err);
            }
            else if (files.length > 0){
                let count = 0;
                for (let file of files){
                    fs.stat(pathd.join(dir, file), (err, stat) => {
                        if (!err){
                            ret.push({file, isDir: stat.isDirectory()});
                        }
                        count++;
                        if (count >= files.length){
                            resolve(ret);
                        }
                    });
                }
            }
        });
    });
}

function emptyDir(dir){
    async function emptyOne(dir, top){
        let list = await ls(dir);
        top && (list = list.filter(({file, isDir}) => !isDir || file.charAt(0) !== '.'));
        let pr = list.map(({file, isDir}) => { 
            file = pathd.join(dir, file);
            return isDir ? emptyOne(file, false).then(() => rmdir(file)) : rmFile(file);
        })
        await Promise.all(pr);
    }
    return emptyOne(dir, true);
}

function copyDir(from, to){
    async function copyOne(from, to){
        let list = await ls(from);
        await Promise.all(list.map(({file, isDir}) => {
            let from1 = pathd.join(from, file);
            let to1 = pathd.join(to, file);
            return isDir ? mkdirIfNExist(to1) : copy(from1, to1);
        }));
    }
    return copyOne(from, to);
}

// function copyDir(from, to){
//     let promises = [];
//     return new Promise((resolve, reject) => {
//         walkDir(from, {
//             enterDirectory(path, obj, cb){
//                 path = pathd.join(to, path.join('/'));
//                 mkdirIfNExist(path).then(() => cb());
//             },
//             visitFile(path, f, obj){
//                 let fname = pathd.join(path.join('/'), f);
//                 let from1 = pathd.join(from, fname);
//                 let to1 = pathd.join(to, fname);
//                 promises.push(copy(from1, to1));
//             },
//             done(){
//                 Promise.all(promises).then(resolve);
//             }
//         });
//     });
// }

exports.exists = exists;
exports.mkdir = mkdir;

exports.emptyDir = emptyDir;
exports.copyDir = copyDir;