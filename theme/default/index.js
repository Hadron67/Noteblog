'use strict';
const getMyRenderer = require('./renderer.js');

const pwd = __dirname + '/';
const _ = p => pwd + p;

module.exports = params => async (app) => {
    app.scss.register('/css/main.css', (await app.helper.readFiles(_('css/'), 'main.scss')).map(f => _('css/') + f));
    app.file.register('/js/main.js', _('dist/main.js'));

    app.markdown.setRenderer(getMyRenderer(app));
    
    await app.helper.registerModule(_('templates/templates.js'));
};