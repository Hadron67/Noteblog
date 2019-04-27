'use strict';
const md = require('./markdown.js');
const cp = require('../component.js');
const event = require('events');
const merge = require('../util/merge.js');
const pathd = require('path');
const fs = require('fs');

function changeSuffix(s, suf){
    return s.replace(/\..*$/, suf);
}

function readFile(file){
    return new Promise((resolve, reject) => {
        fs.readFile(file, (err, data) => err ? reject(err) : resolve(data));
    });
}

const escapes = {
    "'": "'",
    '"': '"',
    '\n': '\\n',
    '\t': '\\t',
    '\\': '\\\\'
};

const unescapes = {
    "'": "'",
    '"': '"',
    'n': '\n',
    't': '\t',
    '\\': '\\'
};

function escapeS(s){
    let ret = '';
    for (let i = 0; i < s.length; i++){
        let c = s.charAt(i);
        if (escapes.hasOwnProperty(c))
            ret += escapes[c];
        else
            ret += c;
    }
    return ret;
}

const htmlEscapes = {
    '>': '&gt;',
    '<': '&lt;',
    '&': '&amp;'
};

const regHTMLSpecial = /[<>&]/g;

function escapeHTML(s){
    return s.replace(regHTMLSpecial, c => htmlEscapes[c]);
}

function eat(s, tag){
    let len = 0;
    while (s.charAt(len) === tag.charAt(len)){
        len++;
    }
    return s.substr(len, s.length - len);
}

function addNewLineToEnds(s){
    if (s.charAt(0) !== '\n'){
        s = '\n' + s;
    }
    if (s.charAt(s.length - 1) !== '\n'){
        s += '\n';
    }
    return s;
}

class MarkdownRenderer{
    constructor(ctx, tags) {
        this.mdParser = md.createParser();
        this.ctx = ctx;
        this.customTags = tags;

        this.table = null;
        this.summary = '';
        this.text = '';
        this.article = {};

        this.images = [];
    }
    addImage(node){
        this.images.push({src: node.src, desc: node.alt});
    }
    visitBold(node) { this.text += `<strong>${escapeHTML(node.val)}</strong>`; }
    visitItalic(node) { this.text += `<em>${escapeHTML(node.val)}</em>`; }
    visitCode(node) { this.text += `<code lang="${escapeS(node.lang)}">${escapeHTML(node.val)}</code>`; }
    visitInlineCode(node) { this.text += `<code>${escapeHTML(node.val)}</code>`; }
    visitText(node) { this.text += escapeHTML(node.val); }
    visitStrikeThrough(node){ this.text += `<del>${escapeHTML(node.val)}</del>`; }
    visitLine(node) { this.text += ' '; }
    visitInlineMathjax(node) { this.text += `<script type="math/tex">%<![CDATA[${addNewLineToEnds(node.val)}%]]></script>`; }
    visitBlockMathjax(node) { this.text += `<script type="math/tex; mode=display">%<![CDATA[${addNewLineToEnds(node.val)}%]]></script>`; }
    visitLink(node) { this.text += `<a href="${escapeS(node.href)}">${escapeHTML(node.name)}</a>`; }
    visitImage(node) {
        this.text += `<img src="${escapeS(node.src)}" alt="${escapeS(node.alt)}" />`;
        this.addImage(pathd.join(node.src), node.alt);
    }
    visitListLine(node) { this.text += ' '; }
    visitHR(node) { this.text += '<hr />'; }
    visitHtmlComment(node) {
        if (this.summary === '' && node.outterMost && node.val === 'more')
            this.summary = this.text;
        this.text += `<!--${node.val}-->`; 
    }
    visitHtmlText(node) { this.text += node.val; }

    enterArticle(node) {  }
    leaveArticle(node) {  }
    enterHeading(node) { this.text += `<h${node.val}>`; }
    leaveHeading(node) { this.text += `</h${node.val}>`; }
    enterParagraph(node) { this.text += `<p>`; }
    leaveParagraph(node) { this.text += '</p>'; }
    enterQuoteBlock(node) { this.text += `<blockquote>`; }
    leaveQuoteBlock(node) { this.text += '</blockquote>'; }
    enterList(node) { this.text += node.val ? '<ol>' : '<ul>'; }
    leaveList(node) { this.text += node.val ? '</ol>' : '</ul>'; }
    enterListItem(node) { this.text += '<li>'; }
    leaveListItem(node) { this.text += '</li>'; }
    enterTable(node){ this.text += '<table>'; this.table = node; }
    leaveTable(node){ this.text += '</table>'; this.table = null; }
    enterTableHead(node){ this.text += '<thead>'; }
    leaveTableHead(node){ this.text += '</thead>'; }
    enterTableBody(node){ this.text += '<tbody>'; }
    leaveTableBody(node){ this.text += '</tbody>'; }
    enterTableRow(node){ this.text += '<tr>'; }
    leaveTableRow(node){ this.text += '</tr>'; }
    enterTableCol(node){ this.text += `<td${node.align ? ' style="text-align: ' + node.align + '"' : ''}>`; }
    leaveTableCol(node){ this.text += '</td>'; }
    enterHtmlTag(node) {
        if (this.customTags.hasOwnProperty(node.name)){
            return this.customTags[node.name](this, node);
        }
        else {
            let t = `<${node.name}`;
            for (let name in node.attrs){
                t += ` ${name}="${escapeS(node.attrs[name])}"`;
            }
            this.text += t + '>';
        }
    }
    leaveHtmlTag(node){ this.text += `</${node.name}>`; }

    render(node){
        this.text = '';
        this.table = null;
        this.summary = '';
        this.images = [];
        node.accept(this);
        return this.text;
    }
}

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

class MarkdownContext extends event.EventEmitter {
    constructor(ctx){
        super();
        this.ctx = ctx;
        this.logger = ctx.logger.subTag('Markdown');
        this.mdParser = md.createParser();
        this.renderer = new MarkdownRenderer(ctx, this.customTags = {});

        this.DefaultRenderer = MarkdownRenderer;
        this.NodeType = md.NodeType;

        this.postFilters = [];
    }
    applyFilter(post){
        for (let f of this.postFilters){
            if (f(post)){
                return true;
            }
        }
        return false;
    }
    registerFilter(f){
        this.postFilters.push(f);
    }
    compileMarkdown(file, data, renderer){
        // let renderer = this.renderer;
        let { articleNodes, frontMatter } = this.mdParser.parse(data); // This shouldn't throw exceptions
        for (let n of articleNodes.children){
            n.outterMost = true;
        }
        renderer.render(articleNodes);
        if (frontMatter === ''){
            frontMatter = {};
        }
        else {
            try {
                frontMatter = this.ctx.parseYaml(frontMatter);
            }
            catch(e){
                return e;
            }
        }
        let date = new Date(frontMatter.date);
        if (date.toDateString() === 'Invalid Date'){
            date = new Date();
        }
        let article = frontMatter;
        article.fileName = file.replace(/^.*\//, '');
        article.date = date;
        article.summary = renderer.summary;
        article.content = renderer.text;
        article.images = renderer.images;
        article.tags = article.tags || [];
        if (article.category){
            article.category = article.category.split(/[ ]*\/[ ]*/g);
        }
        else {
            article.category = null;
        }
        for (let name in this.renderer.article){
            article[name] = this.renderer.article[name];
        }

        if (frontMatter.layout){
            if (this.ctx.layouts.hasOwnProperty(frontMatter.layout)){
                article.layout = frontMatter.layout;
            }
            else {
                this.logger.warn(`In file ${file}: Undefined layout "${frontMatter.layout}", using default layout`);
                article.layout = null;
            }
        }
        else {
            article.layout = null;
            this.logger.warn(`In file ${file}: No layout provided, using default layout`);
        }

        article.text = new TextExtractor().render(articleNodes);

        this.emit('post-compile', article, articleNodes);
        return article;
    }
    setRenderer(Renderer){
        this.renderer = new Renderer(this.ctx, this.customTags);
    }
    register(path, inFile, arg = {}, renderer = null){
        let ret = new MarkdownHandler(this.ctx, this, inFile, path, arg, renderer || this.renderer);
        this.ctx.pageRegistry.registerSource(ret);
        return ret;
    }
    dateToPath(pathBase){
        return article => {
            let d = article.date;
            let mouth = d.getMonth() + 1;
            let date = d.getDate();
            mouth = mouth < 10 ? '0' + mouth : mouth;
            date = date < 10 ? '0' + date : date;
            return pathd.join(pathBase, `${d.getFullYear()}/${mouth}/${date}`, changeSuffix(article.fileName, ''), 'index.html');
        }
    }
};

class MarkdownHandler extends event.EventEmitter {
    constructor(ctx, rendererContext, inFile, path, arg, renderer){
        super();
        this.ctx = ctx;
        this.id = ctx.uniqueID();
        this.rendererContext = rendererContext;
        this.file = inFile;
        this.path = null;
        this.getPath = null;
        this.arg = arg;
        this.renderer = renderer;
        this.filtered = false;
        this.template = null;
        this.seo = null;
        
        this.isStatic = false;
        this.mime = 'text/html';

        if (typeof path === 'string'){
            this.getPath = () => path;
        }
        else if (typeof path === 'function'){
            this.getPath = path;
        }
        else
            throw new TypeError(`'path' can only be a string or function`);

        this.article = null;
    }
    update(cb){
        fs.readFile(this.file, (err, data) => {
            data = data.toString('utf-8');
            if (err){
                this.logger.err(`Failed to read markdown file ${this.file}: ${err.toString()}`);
                cb && cb(err, this);
            }
            else if (data === ''){
                this.rendererContext.logger.warn(`Skipping empty markdown file ${this.file}`);
            }
            else {
                let a = this.rendererContext.compileMarkdown(this.file, data, this.renderer);
                if (typeof a === 'string'){
                    let msg = `Failed to parse markdown file ${this.file}: ${err.toString()}`;
                    this.rendererContext.logger.err(msg);
                    cb && cb(msg, this);
                }
                else {
                    this.article = a;
                    if (this.rendererContext.applyFilter(a)){
                        this.filtered = true;
                        if (this.path){
                            this.rendererContext.logger.info(`Unregistering filtered post ${this.file}`);
                            this.ctx.pageRegistry.unregister(this.path);
                            this.path = null;
                            this.emit('remove', this);
                        }
                        else {
                            this.rendererContext.logger.info(`Skipping filtered post ${this.file}`);
                        }
                        // cb && cb('Post filtered', this);
                        cb && cb();
                    }
                    else {
                        this.filtered = false;
                        let path = this.getPath(a);
                        let oldPath = this.path;
                        this.path = path;
                        if (oldPath !== path){
                            if (oldPath)
                                this.ctx.pageRegistry.unregister(oldPath);
                            this.ctx.pageRegistry.register(this);
                        }
    
                        this.emit('update', this);
                        cb && cb(false, this);
                    }
                    // this.emit('compiled', this);
                }
            }
        });
    }
    _getContent(){
        if (this.article.layout && this.ctx.layouts.hasOwnProperty(this.article.layout)){
            this.template = this.ctx.layouts[this.article.layout];
            // return cp.render(this.ctx.layouts[this.article.layout], merge({article: this.article, path: this.path}, this.arg));
        }
        else {
            this.template = () => this.article.content;
            // return this.article.content;
        }

        this.seo = {
            images: this.article.images,
            description: this.article.text.substr(0, 200),
            title: this.article.title,
            type: 'article',
            keywords: this.article.keywords || null
        };

        return this.ctx.render(this);
    }
    handle(os, cb){
        if (this.article === null){
            this.update(err => {
                if (err){
                    cb(err);
                }
                else {
                    os.end(this._getContent());
                    cb();
                }
            });
        }
        else {
            os.end(this._getContent());
            cb();
        }
    }
    isReady(){
        return this.article !== null;
    }
    mergeArg(arg){
        this.arg = merge(this.arg, arg);
    }

    getTitle(){
        return this.article.title;
    }
    getDate(){
        return this.article.date;
    }
    getTags(){
        return this.article.tags;
    }
    getCategory(){
        return this.article.category;
    }
    getSummary(){
        return this.article.summary;
    }
}

exports.MarkdownContext = MarkdownContext;