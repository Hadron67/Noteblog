const md = require('../lib/markdown.js');

let parser = md.createParser();
console.log(md.toDefautHTML(parser.parse(`---
hkm
---
# Head

hkm, $*soor*$, *srsr *, _hkm __, $a_0b_2 = c_3$

`).articleNodes));