'use strict';
const md = require('./markdown.js');
const cp = require('./component.js');
const event = require('events');

function changeSuffix(s, suf){
    return s.replace(/\..*$/, '.' + suf);
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

class MarkdownRenderer{
    constructor(ctx) {
        this.mdParser = md.createParser();
        this.ctx = ctx;
        this.imgPathBase = '';

        this.table = null;
        this.summary = '';
        this.text = '';
    }
    visitBold(node) { this.text += `<strong>${escapeHTML(node.val)}</strong>`; }
    visitItalic(node) { this.text += `<em>${escapeHTML(node.val)}</em>`; }
    visitCode(node) { this.text += `<code lang="${escapeS(node.lang)}">${escapeHTML(node.val)}</code>`; }
    visitInlineCode(node) { this.text += `<code>${escapeHTML(node.val)}</code>`; }
    visitText(node) { this.text += escapeHTML(node.val); }
    visitStrikeThrough(node){ this.text += `<del>${escapeHTML(node.val)}</del>`; }
    visitLine(node) { this.text += ' '; }
    visitInlineMathjax(node) { this.text += `<script type="math/tex">%<![CDATA[\n${node.val}\n%]]></script>`; }
    visitBlockMathjax(node) { this.text += `<script type="math/tex; mode=display">%<![CDATA[${node.val}\n%]]></script>`; }
    visitLink(node) { this.text += `<a href="${escapeS(node.href)}">${escapeHTML(node.name)}</a>`; }
    visitImage(node) { this.text += `<img src="${escapeS(this.imgPathBase + node.src)}" alt="${escapeS(node.alt)}" />`; }
    visitListLine(node) { this.text += ' '; }
    visitHR(node) { this.text += '<hr />'; }
    visitHtmlComment(node) {
        if (this.summary === '' && node.outterMost && node.val === 'more')
            this.summary = eat(this.text, '<article>');
        this.text += `<!--${node.val}-->`; 
    }
    visitHtmlText(node) { this.text += node.val; }

    enterArticle(node) { this.text = `<article>`; }
    leaveArticle(node) { this.text += '</article>'; }
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
    enterTableCol(node){ this.text += `<td${node.align ? ' align="' + node.align + '"' : ''}>`; }
    leaveTableCol(node){ this.text += '</td>'; }
    enterHtmlTag(node) {
        let t = `<${node.name}`;
        for (let name in node.attrs){
            t += ` ${name}="${escapeS(node.attrs[name])}"`;
        }
        this.text += t + '>';
    }
    leaveHtmlTag(node){ this.text += `</${node.name}>`; }

    render(node){
        this.text = '';
        this.table = null;
        this.summary = '';
        node.accept(this);
        return this.text;
    }
}

class MarkdownContext {
    constructor(ctx){
        this.ctx = ctx;
        this.mdParser = md.createParser();
        this.renderer = new MarkdownRenderer(ctx);
    }
    compileMarkdown(file, data, resolve, reject){
        let renderer = this.renderer;
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
                reject(e);
                return;
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

        if (frontMatter.layout){
            if (this.ctx.layouts.hasOwnProperty(frontMatter.layout)){
                article.layout = this.ctx.layouts[frontMatter.layout];
            }
            else {
                article.layout = null;
                this.ctx.logger.warn(`In file ${file}: Undefined layout "${frontMatter.layout}", using default layout`);
            }
        }
        else {
            article.layout = null;
            this.ctx.logger.warn(`In file ${file}: No layout provided, using default layout`);
        }
        
        resolve(article);
    }
    register(path, inFile){
        return new MarkdownHandler(this.ctx, this, inFile, path);
    }
    dateToPath(pathBase){
        return article => {
            let d = article.date;
            let dataPath = `/${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}/${changeSuffix(article.fileName, 'html')}`;
            return pathBase + dataPath;
        }
    }
};

class MarkdownHandler extends event.EventEmitter {
    constructor(ctx, renderer, inFile, path){
        super();
        this.ctx = ctx;
        this.id = ctx.uniqueID();
        this.renderer = renderer;
        this.inFile = inFile;
        this.path = null;
        this.getPath = null;
        
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
        this.refresh();
        ctx.watch(inFile, (event) => event === 'change' && this.refresh());
    }
    refresh(cb){
        this.ctx.readFile(this.inFile, (err, data) => {
            if (err){
                this.ctx.logger.err(`Failed to read markdown file ${this.inFile}: ${err.toString()}`);
                cb && cb(err, this);
            }
            else {
                this.renderer.compileMarkdown(this.inFile, data.toString('utf-8'), a => {
                    this.article = a;
                    this.ctx.logger.verbose(`Markdown file ${this.inFile} compiled`);
                    let path = this.getPath(a);
                    let oldPath = this.path;
                    if (oldPath){
                        this.ctx.unregister(oldPath);
                    }
                    this.ctx.registerRaw(path, this);
                    this.path = path;
                    cb && cb(false, this);
                    this.emit('update', this);
                }, err => {
                    this.article = null;
                    let msg = `Failed to parse markdown file ${this.inFile}: ${err.toString()}`;
                    this.ctx.logger.err(msg);
                    cb && cb(msg, this);
                });
            }
        });
    }
    _getContent(){
        if (this.article.layout){
            return cp.render(this.article.layout, this.article);
        }
        else {
            return this.article.content;
        }
    }
    handle(resolve, reject){
        if (this.article === null){
            this.refresh(err => {
                if (err){
                    reject(err);
                }
                else
                    resolve(this._getContent());
            });
        }
        else {
            resolve(this._getContent());
        }
    }
    isReady(){
        return this.article !== null;
    }
}

exports.MarkdownContext = MarkdownContext;