'use strict';

const http = require('http');
const url = require('url');
const Router = require('./router.js');
const log = require('log');

/** @typedef{{handleRequest: (req, res) => any, generate: (res: (result) => any) => string}} FileHandler */

function createGeneratorContext(){

    let theRouter = new Router();
    let errHandler = {
        E404: null
    };
    /** @type{(req: IncomingMessage, path: string) => any} */
    let requestListener = null;
    let registerListener = null;

    let server = http.createServer((req, res) => {
        let path = url.parse(req.url).pathname;
        requestListener && requestListener(req, path);

        if (path.charAt(path.length - 1) === '/'){
            path += 'index.html';
        }

        let h = theRouter.findRoute(path);
        if (h === null){
            res.statusCode = 404;
            if (errHandler.E404){
                errHandler.E404.handleRequest(req, res);
            }
            else {
                res.setHeader('Content-Type', 'text/plain');
                res.write(`The requested path ${path} was not found`, 'utf-8');
                res.end();
            }
        }
        else {
            h.handler.handleRequest(req, res);
        }
    });
    
    function register(pagePath, factory){
        let h = {factory, handler: factory()};
        if (pagePath === '404'){
            errHandler.E404 = h;
        }
        else
            theRouter.addRoute(pagePath, h);
        registerListener && registerListener(pagePath);
    }

    function refresh(){
        theRouter.forEach((path, handler) => {
            handler.handler = handler.factory();
        });
    }

    function onRequest(cb){
        requestListener = cb;
    }

    function onRegisterPage(cb){
        registerListener = cb;
    }
    
    function listen(port, cb){
        return server.listen(port, cb);
    }

    return {
        listen,
        register,
        onRegisterPage,
        onRequest,
        refresh
    };
}

module.exports = createGeneratorContext;