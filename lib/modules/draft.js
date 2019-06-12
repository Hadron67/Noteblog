'use strict';

module.exports = () => app => {
    app.ext.allowDraft = true;
    app.markdown.registerFilter(post => post.disabled || (post.draft && !app.ext.allowDraft));
}