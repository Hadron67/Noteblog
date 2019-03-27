/* eslint-env node, mocha */

'use strict';

let c = require('../lib/component.js');
let s = new c.StyleSheet();

s.load({
    '$clearFix::before,$clearFix::after': {
        content: '""',
        clear: 'both'
    },
    'div.$btn': {
        backgroundColor: '#f0f0f0',
        width: '30px',
        '$$:hover': {
            backgroundColor: '#e0e0e0'
        }
    },
    '@media(max-width: 30px)': {
        '.$btn': {
            width: '100%'
        }
    }
});

console.log(s.toString());