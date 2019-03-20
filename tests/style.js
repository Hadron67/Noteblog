'use strict';

let c = require('../lib/component.js');
let s = new c.StyleSheet('cl');

c.defineCSSMacro('user-selection', (set, name, val) => {
    set.load({
        'user-selection': val,
        '-moz-user-selection': val,
        '-webkit-user-selection': val,
        '-ms-user-selection': val
    });
});

s.global.load({
    div: {
        'backgroud-color': '#f0f0f0',
        'position': 'relative'
    }
});
let t = s.g().cl({
    'user-selection': 'none'
}).className;
s.global.cl({
    'backgroud-color': '#303030',
    '!:hover': {
        '!extends': t,
        'backgroup-color': '#505050'
    }
});
s.at('media(max-width: 1024px)').load({
    body: {
        padding: '20px'
    }
});
let kn = s.at('keyframes');
kn.keyFrames.load({
    '0%': { opacity: 0 },
    '100%': { opacity: 1 }
});

console.log(s.toString());