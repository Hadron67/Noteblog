'use strict';
const pathd = require('path');

function completeURL(main, path){
    if (/^((https?:)?\/\/)/.test(path)){
        return path;
    }
    else {
        return path.charAt(0) === '/' ? path : main.path(path);
    }
}

function completeImageURL(main, path){
    if (/^((https?:)?\/\/)/.test(path) || path.charAt(0) === '/'){
        return path;
    }
    else {
        return main.path(pathd.join(main.config.imagePath, path));
    }
}

module.exports = {completeImageURL, completeURL};