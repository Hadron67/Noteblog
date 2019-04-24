'use strict';

const fs = require('fs');
const path = require('path');
const walkDir = require('./dir-walker.js');

class FoundFile {
    constructor(dir, fname){
        this.dir = dir;
        this.fname = fname;
    }
    toString(){
        return path.join(this.dir, this.fname);
    }
}

function find(dir, opt, cb){
    let files = [];
    return walkDir(dir, {
        visitFile(path, f){
            files.push(new FoundFile(path.join('/'), f));
        },
        done(){
            cb(null, files);
        }
    });
}

module.exports = find;
