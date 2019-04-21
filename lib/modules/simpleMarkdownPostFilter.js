'use strict';

module.exports = () => app => {
    app.markdown.registerFilter(post => post.disabled);
}