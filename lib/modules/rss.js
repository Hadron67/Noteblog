'use strict';

const pathd = require('path');

function attrToString(attrs){
    let attrText = '';
    if (attrs){
        for (let name in attrs){
            attrText += ` ${name}="${attrs[name]}"`;
        }
    }
    return attrText;
}
class XMLWriter {
    constructor(){
        this.s = '';
        this.tagStack = [];
    }
    push(tag, attrs){
        this.tagStack.push(tag);
        this.s += `<${tag}${attrToString(attrs)}>`;
        return this;
    }
    pop(){
        this.s += `</${this.tagStack.pop()}>`;
        return this;
    }
    leaf(tag, attrs){
        this.s += `<${tag}${attrToString(attrs)} />`;
        return this;
    }
    text(t){
        this.s += t;
        return this;
    }
    cdata(s){
        this.s += `<![CDATA[${s}]]>`;
        return this;
    }
}

const escapes = {
    '>': '&gt;',
    '<': '&lt;',
    '&': '&amp;'
};

function escapeHTML(s){
    return s.replace(/[<>&]/g, c => escapes[c]);
}

class Handler {
    constructor(ctx, path, limit){
        this.ctx = ctx;
        this.path = path;
        this.mime = 'application/xml';
        this.isStatic = false;
        this.limit = limit;

        this.writer = new XMLWriter();
    }
    handle(os, cb){
        let app = this.ctx;
        let completeURL = app.helper.completeURL;
        let d = this.writer;
        d.s = '';
        d.push('feed', {xmlns: 'http://www.w3.org/2005/Atom'});

        d.push('title').text(app.config.title).pop();
        d.leaf('link', {href: this.path, rel: 'self'});
        d.leaf('link', {href: app.config.domain});
        app.config.author && (d.push('author').push('name').text(app.config.author).pop().pop());
        d.push('generator', {uri: 'https://github.com/Hadron67/Noteblog'}).text('Noteblog').pop();

        let count = 0;
        for (let page of app.extend.blogManager.getPosts()){
            d.push('entry');
            d.push('title').text(page.getTitle()).pop();
            d.leaf('link', {href: page.path});
            d.push('published').text(page.getDate().toISOString()).pop();
            d.push('summary', {type: 'html'}).text(escapeHTML(page.getSummary())).pop();
            
            page.getTags().forEach(t => d.leaf('category', {scheme: completeURL(pathd.join(app.ext.tags, app.helper.regulateName(t), '/')), term: t}));
            let ct = page.getCategory();
            if (ct){
                let categoryPath = page.getCategory().join('/');
                categoryPath && d.leaf('category', {scheme: completeURL(pathd.join(app.ext.category, app.helper.regulateName(categoryPath), '/')), term: categoryPath});
            }
            
            d.pop();
            count++;
            if (this.limit > 0 && count >= this.limit){
                break;
            }
        }
        d.pop();

        os.end(d.s);
        d.s = '';
        cb();
    }
}

module.exports = params => app => {
    params.path = app.path(params.path);
    params.limit === void 0 && (params.limit = -1);
    app.ext.rssPath = params.path;
    app.on('init-pages', () => {
        app.pageRegistry.register(new Handler(app, params.path, params.limit));
    });
}