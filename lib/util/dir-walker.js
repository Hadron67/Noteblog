'use strict';
const pathd = require('path');
const fs = require('fs');

function walk(dir, opt){
    function walkOne(dir, path, obj, cb){
        let thisObj = null;
        function leave(){
            if (opt.leaveDirectory){
                opt.leaveDirectory(path, thisObj, cb);
            }
            else {
                // process.nextTick(cb);
                cb();
            }
        }
        function doReadDir(){
            fs.readdir(dir, (err, files) => {
                if (err){
                    opt.err(err);
                    leave();
                    return;
                }
                else if (files.length === 0){
                    leave();
                }
                else {
                    let count = 0;
                    function inc(){
                        count++;
                        if (count === files.length){
                            leave();
                        }
                    }
                    for (let f of files){
                        let newDir = pathd.join(dir, f);
                        let newPath = path.concat([f]);
                        fs.stat(newDir, (err, stat) => {
                            if (stat.isDirectory()) {
                                walkOne(newDir, newPath, thisObj, inc);
                            }
                            else {
                                if (err){
                                    opt.err(err);
                                }
                                else {
                                    opt.visitFile && opt.visitFile(path, f, thisObj);
                                }
                                inc();
                            }
                        });
                    }
                }
            });
        }
        // let obj = {};
        if (opt.enterDirectory){
            opt.enterDirectory(path, obj, (skip, obj) => {
                thisObj = obj;
                !skip ? doReadDir() : cb();
            });
        }
        else {
            doReadDir();
        }
    }
    walkOne(dir, [], null, () => opt.done && opt.done());
}

module.exports = walk;