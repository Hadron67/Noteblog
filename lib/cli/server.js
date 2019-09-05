'use strict';
const http = require('http');
const url = require('url');

module.exports = params => app => {
    let logger = app.logger.subTag('Server');

    function sendInternalError(res, err){
        // ctx.emit('ServerError', err);
        logger.err(err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.write(err);
        res.end();
    }

    let server = http.createServer((req, res) => {
        let path = url.parse(req.url).pathname;
        
        try {
            path = decodeURI(path);
        }
        catch(e){
            sendInternalError(res, `Cannot decode uri ${path}: ${e}`);
            return;
        }
        // ctx.emit('request', req, path);
        logger.info(`[${req.socket.remoteAddress}]: Request ${path}`);

        if (path.charAt(path.length - 1) === '/'){
            path += 'index.html';
        }

        let h = app.pageRegistry.getHandler(path);
        if (h === null){
            res.statusCode = 404;
            let e404 = app.pageRegistry.getErrorHandler('404');
            if (e404){
                res.setHeader('Content-Type', e404.mime + '; charset=utf-8');
                e404.handle(res, err => err && sendInternalError(res, err));
            }
            else {
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.end(`The requested path ${path} was not found`, 'utf-8');
            }
        }
        else {
            res.setHeader('Content-Type', h.mime + '; charset=utf-8');
            h.handle(res, err => {
                if (err){
                    // ctx.emit('ServerError', err);
                    logger.err(err);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                    res.end(err);
                }
            });
        }
    });
    params = params || {};
    let port = params.port || 8080;
    let addr = params.addr || 'localhost';

    app.cli.register({
        name: 'server',
        async exec(argv){
            app.ext.env = "Server";
            await app.initPages();
            app.pageRegistry.watchFiles();
            server.listen(port, addr, () => {
                logger.info(`Server started at http://${addr}:${port}${app.path('/')}`);
            });
        }
    });
}