'use strict';

let component = require('./lib/component.js');

let metaTags = component.template(
    '<meta charset="utf-8" />',
    '<meta http-equiv="X-UA-Compatible" content="IE=edge" />',
    '<meta viewport="width=device-width, initial-scale=1" />'
);

let html = component.template(
    '<html>',
        '<head>',
            '<title>',
                a => a.config.title,
            '</title>',
            metaTags,
        '</head>',
    '</html>'
);

function headTag(e){
    return e('head')
        .l('title', null, 'Blog de cfy')
        .l('meta', { charset:'utf-8' })
        .l('meta', { 'http-equiv': 'X-UA-Compatible', content: 'IE=edge' })
        .l('viewport', { content: 'width=device-width, initial-scale=1' });
}

function footer(e){
    return e('footer');
}

module.exports = app => {
    let c = app.component;
    let e = c.createElement;
    let ret = e('html', null, 
        headTag(e),
    );
}