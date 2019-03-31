'use strict';
const fs = require('fs');

const escapes = {
    "'": "'",
    '"': '"',
    '\n': '\\n',
    '\t': '\\t',
    '\\': '\\\\'
};

const unescapes = {
    "'": "'",
    '"': '"',
    'n': '\n',
    't': '\t',
    '\\': '\\'
};

function escapeS(s){
    let ret = '';
    for (let i = 0; i < s.length; i++){
        let c = s.charAt(i);
        if (escapes.hasOwnProperty(c))
            ret += escapes[c];
        else
            ret += c;
    }
    return ret;
}

const htmlEscapes = {
    '>': '&gt;',
    '<': '&lt;',
    '&': '&amp;'
};

const regHTMLSpecial = /[<>&]/g;

function escapeHTML(s){
    return s.replace(regHTMLSpecial, c => htmlEscapes[c]);
}

module.exports = ctx => {
    ctx.helper = {
        escapeS,
        escapeHTML
    };

    ctx.helper.registerModule = function(src){
        return new Promise((resolve, reject) => {
            ctx.registerModule(src, ctx => resolve());
        });
    }
    ctx.helper.readFiles = function(dir){
        return new Promise((resolve, reject) => {
            fs.readdir(dir, (err, files) => {
                if (err){
                    reject(err);
                    return;
                }
                let ret = [];
                let count = 0;
                for (let file of files){
                    fs.stat(dir + '/' + file, (err, stat) => {
                        count++;
                        if (!err && stat.isFile()){
                            ret.push(file);
                            if (count === files.length){
                                resolve(ret);
                            }
                        }
                    });
                }
            });
        });
    }
}
