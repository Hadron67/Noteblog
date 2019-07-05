'use strict';

module.exports = () => app => {
    app.on('init-pages', () => {
        app.pageRegistry.register({
            path: app.path('/CNAME'),
            isStatic: false,
            handle(os, cb){
                os.end(app.config.domain.replace(/^https?:\/\//, ''));
                cb();
            }
        });
    });
}