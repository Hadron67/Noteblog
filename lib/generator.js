'use strict';

const http = require('http');
const url = require('url');
const Router = require('./router.js');
const log = require('log');

/** @typedef{{isStatic: boolean, handle: (resolve: (s: string) => any, reject: (err) => any) => any}} FileHandler */

function createGeneratorContext(ctx){

    let theRouter = new Router();
    let errHandler = {
        E404: null
    };
    /** @type{(req: IncomingMessage, path: string) => any} */

    let server = http.createServer((req, res) => {
        let path = url.parse(req.url).pathname;
        ctx.emit('request', req, path);

        if (path.charAt(path.length - 1) === '/'){
            path += 'index.html';
        }

        let h = theRouter.findRoute(path);
        if (h === null){
            res.statusCode = 404;
            if (errHandler.E404){
                errHandler.E404.handle(s => {
                    res.write(s);
                    res.end();
                }, err => {
                    res.statusCode = 500;
                    res.write(err);
                    res.end();
                });
            }
            else {
                res.setHeader('Content-Type', 'text/plain');
                res.write(`The requested path ${path} was not found`, 'utf-8');
                res.end();
            }
        }
        else {
            h.handle(s => {
                res.write(s);
                res.end();
            }, err => {
                res.statusCode = 500;
                res.write(err);
                res.end();
            });
        }
    });
    
    function register(pagePath, handler){
        if (pagePath === '404'){
            errHandler.E404 = handler;
        }
        else
            theRouter.addRoute(pagePath, handler);
        ctx.emit('RegisterPage', pagePath);
    }

    function unregister(pagePage){
        theRouter.removeRoute(pagePage);
    }
    
    function listen(port, cb){
        return server.listen(port, cb);
    }

    return {
        listen,
        register,
        unregister
    };
}

module.exports = createGeneratorContext;