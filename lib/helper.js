'use strict';
const fs = require('fs');
const merge = require('./util/merge.js');


module.exports = ctx => {
    let ret = ctx.helper = {
        escapeS,
        escapeHTML
    };

   

   

    ret.Tags = Tags;
    ret.Categorizer = Categorizer;
}
