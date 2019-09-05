'use strict';
const md = require('../markdown/markdown.js');

class TextExtractor extends md.VisitorBase {
    constructor(){
        super();
        this.text = '';
    }
    visitBold(node)          { this.text += node.val; }
    visitItalic(node)        { this.text += node.val; }
    visitCode(node)          { this.text += node.val + ' '; }
    visitInlineCode(node)    { this.text += node.val; }
    visitText(node)          { this.text += node.val; }
    visitStrikeThrough(node) { this.text += node.val; }
    visitInlineMathjax(node) { this.text += node.val; }
    visitBlockMathjax(node)  { this.text += ' ' + node.val + ' '; }
    visitLink(node)          { this.text += node.name; }
    visitImage(node)         { this.text += ' ' + node.alt + ' '; }
    visitHtmlText(node)      { this.text += node.val; }

    render(node){
        this.text = '';
        node.accept(this);
        return this.text;
    }
}

class Handler {
    constructor(ctx, path){
        this.ctx = ctx;
        this.path = path;

        this.isStatic = false;
        this.mime = 'application/json';
    }
    handle(os, cb){
        let d = this.ctx.extend.blogManager.getPosts();
        d = d.map(p => {
            let a = p.article;
            let content = a.text;
            let date = a.date.toISOString();
            let title = a.title;
            let path = p.path;

            return {
                content,
                date,
                title,
                path
            };
        });
        os.end(JSON.stringify(d));
        cb();
    }
}

module.exports = path => app => {
    // let e = new TextExtractor();
    // app.markdown.on('post-compile', (article, node) => article.text = e.render(node));
    path = app.ext.searchIndex = app.path(path);
    app.on('init-pages', () => app.pageRegistry.register(new Handler(app, path)));
}