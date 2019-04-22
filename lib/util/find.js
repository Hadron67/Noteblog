'use strict';

const fs = require('fs');
const path = require('path');

class FoundFile {
    constructor(dir, fname){
        this.dir = dir;
        this.fname = fname;
    }
    toString(){
        return path.join(this.dir, this.fname);
    }
}
function find(dir, cb){
    let ret = [];
    let pending = 0;
    function readOne(d, relative){
        pending++;
        fs.readdir(d, (err, files) => {
            if (err){
                cb(err);
                return;
            }
            let count = 0;
            for (let f of files){
                let p = path.join(d, f);
                fs.stat(p, (err, stat) => {
                    count++;
                    if (!err){
                        if (stat.isDirectory()){
                            readOne(p, path.join(relative, f));
                        }
                        else {
                            ret.push(new FoundFile(relative, f));
                        }
                    }
                    if (count >= files.length){
                        pending--;
                        if (pending === 0){
                            cb(null, ret);
                        }
                    }
                });
            }
        });
    }
    readOne(dir, '');
}

module.exports = find;
