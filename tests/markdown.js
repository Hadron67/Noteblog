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

    function dtestParse(dest, input, ...expect){
        it (dest, function(){
            debugger;
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

    testParse("Headings", `
    # Heading1
    `,
        '<article>',
            '<h1>Heading1</h1>',
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

    testParse('Quote block', `
    > hkm, soor
    `,
        '<article>',
            '<blockquote>',
                '<p>hkm, soor</p>',
            '</blockquote>',
        '</article>'
    );

    testParse('Nested quote blocks', `
    > ergewrg
    >> werghieu
    >>> soor
    >
    > hkm
    soor

    rfnj

    `,
        '<article>',
            '<blockquote>',
                '<p>ergewrg</p>',
                '<blockquote>',
                    '<p>werghieu</p>',
                    '<blockquote>',
                        '<p>soor</p>',
                    '</blockquote>',
                '</blockquote>',
                '<p>hkm<br />soor</p>',
            '</blockquote>',
            '<p>rfnj</p>',
        '</article>'
    );

    testParse("Headings within quote block", `
    # Heading within quote block
    > # Quote
    > hkm
    ## Subhead
    `,
        '<article>',
            '<h1>Heading within quote block</h1>',
            '<blockquote>',
                '<h1>Quote</h1>',
                '<p>hkm</p>',
            '</blockquote>',
            '<h2>Subhead</h2>',
        '</article>'
    );

    testParse("Lists", `
    * hkm, soor
    * rfnj
    # head
    `, 
        '<article>',
            '<ul>',
                '<li>hkm, soor</li>',
                '<li>rfnj</li>',
            '</ul>',
            '<h1>head</h1>',
        '</article>'
    );

    testParse("Nested lists", `
    * A
    * * B
    * * C
    * D
    > hkm
    `, 
        '<article>',
            '<ul>',
                '<li>A</li>',
                '<ul>',
                    '<li>B</li>',
                    '<li>C</li>',
                '</ul>',
                '<li>D</li>',
            '</ul>',
            '<blockquote>',
                '<p>hkm</p>',
            '</blockquote>',
        '</article>'
    );

    testParse("Lists within quote blocks", `
    > * hkm,
    > * soor
    # rfnj
    `, 
        '<article>',
            '<blockquote>',
                '<ul>',
                    '<li>hkm,</li>',
                    '<li>soor</li>',
                '</ul>',
            '</blockquote>',
            '<h1>rfnj</h1>',
        '</article>'
    );

    testParse("A bit more complicated nested lists and quote blocks", `
    * > * > * hkm
      >   > * rfnj
      soor

      hkm
    `,
        '<article>',
            '<ul>',
                '<li>',
                    '<blockquote>',
                        '<ul>',
                            '<li>',
                                '<blockquote>',
                                    '<ul>',
                                        '<li>hkm</li>',
                                        '<li>rfnj soor</li>',
                                    '</ul>',
                                '</blockquote>',
                            '</li>',
                        '</ul>',
                    '</blockquote>',
                '</li>',
            '</ul>',
            '<p>hkm</p>',
        '</article>'
    );
});