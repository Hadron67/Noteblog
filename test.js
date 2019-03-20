'use strict';

let c = require('./lib/component.js');
let s = new c.StyleSheet('cl');
s.globalSetMap.sets({
    div: {
        'backgroud-color': '#f0f0f0',
        'position': 'relative'
    }
});
s.globalSetMap.cl({
    'backgroud-color': '#303030',
    '!:hover': {
        'backgroup-color': '#505050'
    }
});

console.log(s.toString());