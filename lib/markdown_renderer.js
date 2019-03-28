'use strict';
const md = require('./markdown.js');
const cp = require('./component.js');

class MarkdownRenderer{
    constructor(ctx) {
        this.mdParser = md.createParser();
        this.ctx = ctx;
        this.imgPathBase = '';
        this.table = null;

        this.summary = '';
        this.text = '';
    }
    visitBold(node) { this.text += `<strong>${node.val}</strong>`; }
    visitItalic(node) { this.text += `<em>${node.val}</em>`; }
    visitCode(node) { this.text += `<code lang="${node.lang}">${node.val}</code>`; }
    visitInlineCode(node) { this.text += `<code>${node.val}</code>`; }
    visitText(node) { this.text += node.val; }
    visitStrikeThrough(node){ this.text += `<del>${node.val}</del>`; }
    visitLine(node) { this.text += '<br />'; }
    visitInlineMathjax(node) { this.text += `<script type="math/tex">${node.val}</script>`; }
    visitBlockMathjax(node) { this.text += `<script type="math/tex; mode=display">${node.val}</script>`; }
    visitLink(node) { this.text += `<a href="${node.href}">${node.name}</a>`; }
    visitImage(node) { this.text += `<img src="${this.imgPathBase}${node.src}" alt="${node.alt}" />`; }
    visitListLine(node) { this.text += ' '; }
    visitHR(node) { this.text += '<hr />'; }
    visitHtmlComment(node) {
        if (this.summary === '' && node.outterMost)
            this.summary = this.text;
        this.text += `<!--${node.val}-->`; 
    }
    visitHtmlText(node) { this.text += node.val; }

    enterArticle(node) { this.text += `<article>`; }
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

    compileMarkdown(file, data, resolve, reject){
        let { articleNodes, frontMatter } = this.mdParser.parse(data);
        for (let n of articleNodes.children){
            n.outterMost = true;
        }
        this.text = '';
        articleNodes.accept(this);
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
        let date = new Date(frontMatter.data);
        if (date.toDateString() === 'Invalid Date'){
            date = new Date();
        }
        let article = frontMatter;
        article.date = date;
        article.summary = this.summary;
        article.content = this.text;

        if (frontMatter.layout){
            if (this.ctx.templates.hasOwnProperty(frontMatter.layout)){
                let param = {
                    config: this.ctx.config,
                    article
                };
                content = cp.render(this.ctx.templates[frontMatter.layout], param);
            }
            else {
                this.ctx.logger.warn(`In file ${file}: Undefined layout "${frontMatter.layout}", using default layout`);
            }
        }
        else
            this.ctx.logger.warn(`In file ${file}: No layout provided, using default layout`);
        
        resolve(article);
    }
    register(inFile, path){
        new MarkdownHandler(this.ctx, this, inFile, path);
    }
}

class MarkdownHandler {
    constructor(ctx, renderer, inFile, path){
        this.ctx = ctx;
        this.renderer = renderer;
        this.isStatic = false;
        this.inFile = inFile;
        this.getPath = null;
        this.first = true;

        if (typeof path === 'string'){
            ctx.registerRaw(path, this);
        }
        else if (typeof path === 'function'){
            this.getPath = path;
        }
        else
            throw new TypeError(`'path' can only be a string or function`);

        this.article = null;
        this.refreshMarkdown();
        ctx.watch(inFile, () => this.refreshMarkdown());
    }
    refreshMarkdown(){
        this.ctx.readFile(this.inFile, (err, data) => {
            if (err){
                this.ctx.logger.err(`Failed to read markdown file ${this.inFile}: ${err.toString()}`);
            }
            else {
                this.renderer.compileMarkdown(this.inFile, data.toString('utf-8'), a => {
                    this.article = a;
                    if (this.getPath){
                        let path = this.getPath(a);
                        if (this.first){
                            this.first = false;
                        }
                        else
                            this.ctx.unregister(path);
                        
                        this.ctx.registerRaw(path, this);
                    }
                }, err => {
                    this.article = null;
                    this.ctx.logger.err(`Failed to parse markdown file ${this.inFile}: ${err.toString()}`);
                });
            }
        });
    }
    handle(resolve, reject){
        this.article === null ? resolve(this.article.content) : reject('No markdown file present');
    }
};

exports.MarkdownRenderer = MarkdownRenderer;