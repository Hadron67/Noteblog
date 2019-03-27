/* eslint-env node, mocha */

'use strict';
const cp = require('../lib/component.js');

let config = {
    username: 'Hadron67',
    repo: 'Hadron67/blog',
    pagePath: '/path/to/page'
};

let commentit = (config => cp.template(
    '<div class="commentit"></div>',
    '<script type="text/javascript">',
        'var commentitUsername = "', () => config.username, '";',
        'var commentitRepo = "', () => config.repo, '";',
        'var commentit = "', () => config.pagePath, '";',
    '</script>'
))(config);

let t = cp.template(
    '<html>',
        '<body>',
            commentit,
        '</body>',
    '</html>'
);

console.log(cp.render(t));