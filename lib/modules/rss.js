'use strict';

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
        this.text = '';
        this.tagStack = [];
    }
    push(tag, attrs){
        this.tagStack.push(tag);
        this.text += `<${tag}${attrToString(attrs)}>`;
        return this;
    }
    pop(){
        this.text += `</${this.tagStack.pop()}>`;
        return this;
    }
    leaf(tag, attrs){
        this.text += `<${tag}${attrToString(attrs)} />`;
        return this;
    }
    text(t){
        this.text += t;
        return this;
    }
    cdata(s){
        this.text += `<![CDATA[${s}]]>`;
        return this;
    }
}

class Handler {
    constructor(ctx, path){
        this.ctx = ctx;
        this.path = path;
        this.mime = 'application/xml';
        this.isStatic = false;

        this.writer = new XMLWriter();
    }
    handle(os, cb){
        let app = this.ctx;
        let d = this.writer;
        d.text = '';
        d.push('feed', {xmlns: 'http://www.w3.org/2005/Atom'});

        d.push('title').text(app.config.title).pop();
        d.leaf('link', {href: this.path, rel: 'self'});
        d.leaf('link', {href: app.config.domain});
        app.config.author && (d.push('author').push('name').text(app.config.author).pop().pop());
        d.push('generator', {uri: 'https://github.com/Hadron67/Noteblog'}).text('Noteblog').pop();
        

        d.pop();
    }
}

module.exports = params => app => {
    app.register(params.path, new Handler(app, params.path));
    app.ext.rssPath = params.path;
}