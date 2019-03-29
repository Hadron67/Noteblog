'use strict';

let cp = require('./lib/component.js');

let app = require('./lib/main.js')();

let metaTags = cp.template(
    '<meta charset="utf-8" />',
    '<meta http-equiv="X-UA-Compatible" content="IE=edge" />',
    '<meta viewport="width=device-width, initial-scale=1" />'
);

class TestTemplate {
    constructor(content){
        
    }
};

let html = cp.template(
    '<html>',
        '<head>',
            '<title>',
                a => a.config.title,
            '</title>',
            metaTags,
            '<link href="css/main.css" rel="stylesheet">',
        '</head>',
        '<body>',
            
        '</body>',
    '</html>'
);
function mainPage(){

    let config = {title: 'Test'};

    return {
        handle(resolve, reject){
            resolve(cp.render(html, {config}));
        },
        isStatic: false,
        mime: 'text/html'
    };
}

app.registerRaw('/index.html', mainPage());

app.markdown.register('src/posts/test.md', '/article/test.html');
app.scss.register('/css/main.css', 'src/sass/main.scss');

app.startServer(8080);