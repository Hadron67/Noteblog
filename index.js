'use strict';

let cp = require('./lib/component.js');

let app = require('./lib/main.js')();

function mainPage(){
    let metaTags = cp.template(
        '<meta charset="utf-8" />',
        '<meta http-equiv="X-UA-Compatible" content="IE=edge" />',
        '<meta viewport="width=device-width, initial-scale=1" />'
    );
    
    let html = cp.template(
        '<html>',
            '<head>',
                '<title>',
                    a => a.config.title,
                '</title>',
                metaTags,
            '</head>',
        '</html>'
    );

    let config = {title: 'Test'};

    return {
        handleRequest(req, res){
            res.setHeader('Content-Type', 'text/html');
            res.write(cp.render(html, {config}));
            res.end();
        },
        generate: () => {

        }
    };
}

app.registerRaw('/index.html', mainPage);

app.startServer(8080);