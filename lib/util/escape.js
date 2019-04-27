'use strict';

const escapes = {
    '"': '&quot;',
    '\n': '\\n',
    '\t': '\\t',
    // '\\': '\\\\'
};

// const unescapes = {
//     "'": "'",
//     '"': '"',
//     'n': '\n',
//     't': '\t',
//     '\\': '\\'
// };

function escapeS(s){
    let ret = '';
    for (let i = 0; i < s.length; i++){
        let c = s.charAt(i);
        if (escapes.hasOwnProperty(c))
            ret += escapes[c];
        else
            ret += c;
    }
    return ret;
}

const htmlEscapes = {
    '>': '&gt;',
    '<': '&lt;',
    '&': '&amp;'
};

const regHTMLSpecial = /[<>&]/g;

function escapeHTML(s){
    return s.replace(regHTMLSpecial, c => htmlEscapes[c]);
}

exports.escapeS = escapeS;
exports.escapeHTML = escapeHTML;