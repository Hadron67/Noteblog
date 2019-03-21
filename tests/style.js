'use strict';

let c = require('../lib/component.js');
let s = new c.StyleSheet('cl');
let e = c.createElement;

let { classes } = s.load({
    '.btn': {
        'background-color': '#f0f0f0',
        'border': '1px solid',
        '&:hover': {
            'backgroud-color': '#e0e0e0'
        }
    },
    '*': {
        'box-sizing': 'border-box'
    }
});

let html = 
e('html', { lang: 'en' },
    e('head', null, 
        e('title', null, 'Test'),
        e('meta', { charset: 'utf-8' }),
        e('meta', { 'http-equiv': 'X-UA-Compatible', content: 'IE=edge' }),
        e('style', null, s)
    ),
    e('body', null, 
        e('div', null, 
            e('button', { className: classes.btn, id: 'btn1' }, 'click me'),
        ),
        e('script', null, `(function(){ document.getElementById('btn1').addEventListener('click', function(){while(1){allert("soor")}}); })();`)
    )
);

// console.log(s.toString());
// console.log(classes.btn);
console.log(html.toString());