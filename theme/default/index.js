'use strict';
const getMyRenderer = require('./renderer.js');

const pwd = __dirname + '/';
const _ = p => pwd + p;

module.exports = params => async (app) => {
    app.markdown.setRenderer(getMyRenderer(app));
    
    app.on('load', async () => {
        app.scss.register('/css/main.css', (await app.helper.readFiles(_('css/'), 'main.scss')).map(f => _('css/') + f));
        app.file.register('/js/main.js', _('dist/main.js'));
    
        await app.helper.registerModule(_('templates/templates.js'));
    });
};