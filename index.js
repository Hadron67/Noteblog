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