'use strict';

const http = require('http');
const url = require('url');

let pages = [];
let pageMap = {};

function register(pagePath, factory, mime){
    let e;
    pages.push(e = { pagePath, mime, handler: factory() });
    pageMap[pagePath] = e;
}

function listen(port, cb){
    return http.createServer((req, res) => {
        let path = url.parse(req.url).pathname;
        if (path.charAt(path.length - 1) === '/'){
            path += 'index.html';
        }

    });
}

exports.register = register;