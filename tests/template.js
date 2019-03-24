'use strict';
const cp = require('../lib/component.js');

let metaList = cp.template(
    '<meta charset="utf-8" />',
    '<meta http-equiv="X-UA-Compatible" content="IE=edge" />',
    '<meta viewport="width=device-width, initial-scale=1" />'
);

function f(){

}

let t = cp.template(
    '<html>',
        '<head>',
            '<title>',
                a => a.title,
            '</title>',
            metaList,
        '</head>',
        '<body>',
            '<ul>',
                cp._forOf(["rfnj", "hkm", "soor"], t => 
                    cp.template(
                        '<li>',
                            cp._forOf(["a", "b", "c"], t => 
                                `<em>${t}</em>`
                            ),
                        '</li>'
                    )
                ),
            '</ul>',
            '<p>',
                cp._for({ start: 0, end: 30 }, i => 
                    `level ${i}, `
                ),
            '</p>',
        '</body>',
    '</html>'
);

let post = cp.template(
    '<article class="post">',
        '<header class="post-header">',
            '<h1 class="post-title">',
                a => escapeHTML(a.page.title),
            '</h1>',
        '</header>',

        '<div class="post-content">',
            a => a.content,
        '</div>',
    '</article>'
);
/*
<article class="post">

  <header class="post-header">
    <h1 class="post-title">{{ page.title | escape }}</h1>
  </header>

  <div class="post-content">
    {{ content }}
  </div>

</article>


*/

cp.template(
    'a {', 

    '}'
);


console.log(cp.render(t, { title: 'Blog de CFY' }));