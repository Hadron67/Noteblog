const md = require('../lib/markdown.js');
const assert = require('assert');

let parser = md.createParser();

function t(...arg){
    return arg.join('');
}

describe("Parse markdown file into HTML", function(){
    function testParse(dest, input, ...expect){
        it (dest, function(){
            assert.strictEqual(md.toDefautHTML(parser.parse(input).articleNodes), expect.join(''));
        });
    }

    testParse('Single line input with bold and italic text', "Hi, *there*! Can **you** here me?",
        "<article>",
            "<p>",
                "Hi, <em>there</em>! Can <strong>you</strong> here me?",
            "</p>",
        "</article>"
    );
    
    testParse('Image and links', "My blog: [click me](//localhost), and my portrait: ![portrait](/image/portrait)",
        '<article>',
            '<p>',
                'My blog: <a href="//localhost">click me</a>, ',
                'and my portrait: <img src="/image/portrait" alt="portrait" />',
            '</p>',
        '</article>'
    );

    testParse('Mathjax', "The $a_0b_2$, a_0b_2",
        '<article>',
            '<p>',
                'The $a_0b_2$, a<em>0b</em>2',
            '</p>',
        '</article>'
    );

    testParse('Malformed italic and bold text', 'iureh**gc*\nh*n\ntr**rt *',
        '<article>',
            '<p>',
                'iureh*<em>gc</em><br />',
                'h*n<br />',
                'tr**rt *',
            '</p>',
        '</article>'
    );
});