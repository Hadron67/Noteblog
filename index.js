'use strict';

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