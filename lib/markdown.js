'use strict';

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

const NodeType = (function(){
    let i = 0;
    return {
        BOLD: i++,
        ITALIC: i++,
        STRIKE_THROUGH: i++,
        TEXT: i++,
        CODE: i++,
        INLINE_CODE: i++,
        LINE: i++,
        LIST_LINE: i++,
        INLINE_MATHJAX: i++,
        BLOCK_MATHJAX: i++,
        LINK: i++,
        IMAGE: i++,
    
        ARTICLE: i++,
        PARAGRAPH: i++,
        LIST: i++,
        LIST_ITEM: i++,
        HR: i++,
        HEADING: i++,
        QUOTE_BLOCK: i++,
        TABLE: i++,

        TABLE_HEAD: i++,
        TABLE_BODY: i++,
        TABLE_ROW: i++,
        TABLE_COL: i++,

        HTML_TAG: i++,
        HTML_TEXT: i++,
        HTML_COMMENT: i++
    };
})();

class Node {
    constructor(type, ...children) {
        this.type = type;
        this.children = [];
        this.appendAll(children);
    }
    static makeValNode(type, val, ...children){
        let ret = new Node(type, ...children);
        ret.val = val;
        return ret;
    }
    static makeLinkNode(name, href){
        let ret = new Node(NodeType.LINK);
        ret.href = href;
        ret.name = name;
        return ret;
    }
    static makeImageNode(alt, src){
        let ret = new Node(NodeType.IMAGE);
        ret.alt = alt;
        ret.src = src;
        return ret;
    }
    static makeCodeNode(lang, content){
        let ret = new Node(NodeType.CODE);
        ret.lang = lang;
        ret.val = content;
        return ret;
    }
    static makeTableCol(align){
        let ret = new Node(NodeType.TABLE_COL);
        ret.align = align;
        return ret;
    }
    static makeHtmlTag(name, closed, attrs){
        let ret = new Node(NodeType.HTML_TAG);
        ret.name = name;
        ret.closed = closed;
        ret.attrs = attrs;
        return ret;
    }
    append(...children) {
        this.appendAll(children);
        return this;
    }
    appendAll(children) {
        for (let n of children) {
            if (!(n instanceof Node))
                throw new TypeError('Node expected');
            this.children.push(n);
        }
        return this;
    }
    size(){ return this.children.length; }
    forEach(cb){
        for (let c of this.children){
            cb(c);
        }
    }
    accept(visitor) {
        switch (this.type) {
            case NodeType.BOLD: return visitor.visitBold(this);
            case NodeType.ITALIC: return visitor.visitItalic(this);
            case NodeType.TEXT: return visitor.visitText(this);
            case NodeType.STRIKE_THROUGH: return visitor.visitStrikeThrough(this);
            case NodeType.INLINE_CODE: return visitor.visitInlineCode(this);
            case NodeType.CODE: return visitor.visitCode(this);
            case NodeType.LINE: return visitor.visitLine(this);
            case NodeType.INLINE_MATHJAX: return visitor.visitInlineMathjax(this);
            case NodeType.BLOCK_MATHJAX: return visitor.visitBlockMathjax(this);
            case NodeType.LINK: return visitor.visitLink(this);
            case NodeType.IMAGE: return visitor.visitImage(this);
            case NodeType.LIST_LINE: return visitor.visitListLine(this);
            case NodeType.HR: return visitor.visitHR(this);
            case NodeType.HTML_COMMENT: return visitor.visitHtmlComment(this);
            case NodeType.HTML_TEXT: return visitor.visitHtmlText(this);
            case NodeType.HEADING:
                if (visitor.enterHeading(this))
                    return this;
                this.acceptAll(visitor);
                return visitor.leaveHeading(this);
            case NodeType.PARAGRAPH:
                if (visitor.enterParagraph(this))
                    return this;
                this.acceptAll(visitor);
                return visitor.leaveParagraph(this);
            case NodeType.LIST:
                if (visitor.enterList(this))
                    return this;
                this.acceptAll(visitor);
                return visitor.leaveList(this);
            case NodeType.LIST_ITEM:
                if (visitor.enterListItem(this))
                    return this;
                this.acceptAll(visitor);
                return visitor.leaveListItem(this);
            case NodeType.ARTICLE:
                if (visitor.enterArticle(this))
                    return this;
                this.acceptAll(visitor);
                return visitor.leaveArticle(this);
            case NodeType.QUOTE_BLOCK:
                if (visitor.enterQuoteBlock(this))
                    return this;
                this.acceptAll(visitor);
                return visitor.leaveQuoteBlock(this);
            case NodeType.TABLE:
                if (visitor.enterTable(this))
                    return this;
                this.acceptAll(visitor);
                return visitor.leaveTable(this);
            case NodeType.TABLE_HEAD:
                if (visitor.enterTableHead(this))
                    return this;
                this.acceptAll(visitor);
                return visitor.leaveTableHead(this);
            case NodeType.TABLE_BODY:
                if (visitor.enterTableBody(this))
                    return this;
                this.acceptAll(visitor);
                return visitor.leaveTableBody(this);
            case NodeType.TABLE_ROW:
                if (visitor.enterTableRow(this))
                    return this;
                this.acceptAll(visitor);
                return visitor.leaveTableRow(this);
            case NodeType.TABLE_COL:
                if (visitor.enterTableCol(this))
                    return this;
                this.acceptAll(visitor);
                return visitor.leaveTableCol(this);
            case NodeType.HTML_TAG:
                if (visitor.enterHtmlTag(this))
                    return this;
                this.acceptAll(visitor);
                return visitor.leaveHtmlTag(this);
            default: throw new Error(`Unknown type ${this.type}`);
        }
    }
    acceptAll(visitor){
        for (let i = 0, _a = this.children; i < _a.length; i++){
            let n = _a[i].accept(visitor);
            if (n)
                _a[i] = n;
        }
    }
}

class VisitorBase {
    defaultVisit(node){}
    defaultEnter(ndoe){}
    defaultLeave(node){}
    
    visitBold(node) { return this.defaultVisit(node); }
    visitItalic(node) { return this.defaultVisit(node); }
    visitCode(node) { return this.defaultVisit(node); }
    visitInlineCode(node) { return this.defaultVisit(node); }
    visitText(node) { return this.defaultVisit(node); }
    visitStrikeThrough(node){ return this.defaultVisit(node); }
    visitLine(node) { return this.defaultVisit(node); }
    visitInlineMathjax(node) { return this.defaultVisit(node); }
    visitBlockMathjax(node) { return this.defaultVisit(node); }
    visitLink(node) { return this.defaultVisit(node); }
    visitImage(node) { return this.defaultVisit(node); }
    visitListLine(node) { return this.defaultVisit(node); }
    visitHR(node) { return this.defaultVisit(node); }
    visitHtmlComment(node) { return this.defaultVisit(node); }
    visitHtmlText(node) { return this.defaultVisit(node); }

    enterArticle(node) { this.defaultEnter(node); }
    leaveArticle(node) { this.defaultLeave(node); }
    enterHeading(node) { this.defaultEnter(node); }
    leaveHeading(node) { this.defaultLeave(node); }
    enterParagraph(node) { this.defaultEnter(node); }
    leaveParagraph(node) { this.defaultLeave(node); }
    enterQuoteBlock(node) { this.defaultEnter(node); }
    leaveQuoteBlock(node) { this.defaultLeave(node); }
    enterList(node) { this.defaultEnter(node); }
    leaveList(node) { this.defaultLeave(node); }
    enterListItem(node) { this.defaultEnter(node); }
    leaveListItem(node) { this.defaultLeave(node); }
    enterTable(node){ this.defaultEnter(node); }
    leaveTable(node){ this.defaultLeave(node); }
    enterTableHead(node){ this.defaultEnter(node); }
    leaveTableHead(node){ this.defaultLeave(node); }
    enterTableBody(node){ this.defaultEnter(node); }
    leaveTableBody(node){ this.defaultLeave(node); }
    enterTableRow(node){ this.defaultEnter(node); }
    leaveTableRow(node){ this.defaultLeave(node); }
    enterTableCol(node){ this.defaultEnter(node); }
    leaveTableCol(node){ this.defaultLeave(node); }
    enterHtmlTag(node) { this.defaultEnter(node); }
    leaveHtmlTag(node){ this.defaultLeave(node); }
}
class HTMLConverter {
    constructor(classes) {
        this.text = '';
        this.table = null;
        this.classes = classes || {};
    }
    visitBold(node) { this.text += `<strong>${node.val}</strong>`; }
    visitItalic(node) { this.text += `<em>${node.val}</em>`; }
    visitCode(node) { this.text += `<code lang="${node.lang}">${node.val}</code>`; }
    visitInlineCode(node) { this.text += `<code>${node.val}</code>`; }
    visitText(node) { this.text += node.val; }
    visitStrikeThrough(node){ this.text += `<del>${node.val}</del>`; }
    visitLine(node) { this.text += '<br />'; }
    visitInlineMathjax(node) { this.text += `<script type="math/tex">${node.val}</script>`; }
    visitBlockMathjax(node) { this.text += `<script type="math/tex" mode="display">${node.val}</script>`; }
    visitLink(node) { this.text += `<a href="${node.href}">${node.name}</a>`; }
    visitImage(node) { this.text += `<img src="${node.src}" alt="${node.alt}" />`; }
    visitListLine(node) { this.text += ' '; }
    visitHR(node) { this.text += '<hr />'; }
    visitHtmlComment(node) { this.text += `<!--${node.val}-->`; }
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
}

/**
 * This Markdown parser takes care about contents like `$...$` and `$$...$$`,
 * Yeah, that's great
 * @param {*} opt 
 */
function createParser(opt){
    let text, i = 0;

    const Syntax = (() => {
        let i = 0;
        return {
            UNKNOWN: i++,

            HR: i++,
            HEADING: i++,
            LIST: i++
        };
    })();

    const regHTMLName = /[a-zA-Z-_$]/;
    const regWhiteSpace = /[ \t]/;
    const regLineSpecial = /[~`*_\n$![]/;
    const regSelfClosedTag = /^(img|br|meta|link|input)$/;

    // token data
    let token;
    let quoteLevel = 0, curLevel = 0;
    let peekSyntaxType = Syntax.UNKNOWN;
    

    function ch(){
        // read \n, \r\n, \r all as \n
        let c = text.charAt(i);
        if (c === '\r'){
            c = '\n';
            if (text.charAt(i + 1) === '\n'){
                i++;
            }
        }
        return token = c;
    }

    function next(){
        i++;
        peekSyntaxType = Syntax.UNKNOWN;
        return ch();
    }

    function skipWhiteSpace(){
        while (regWhiteSpace.test(token))
            token = next();
    }

    /**
     * @returns {number} How many quote level left
     */
    function processNewLine(){
        token = next();
        let count = 0;
        while (count < quoteLevel){
            skipWhiteSpace();
            if (token === '>'){
                token = next();
                count++;
            }
            else
                break;
        }
        // Only skip one white space
        if (count > 0 && regWhiteSpace.test(token))
            token = next();
        curLevel = count;
        return quoteLevel - count;
    }

    function parse(input){
        text = input;
        i = 0;
        return parseMarkdown();
    }

    function parseFrontMatter(){
        return tryParse(() => {
            let ret = '';
            if (tryConsume('---')){
                while (true){
                    if (token === '') {
                        // ER: unclosed front matter
                        break;
                    }
                    else if (token === '\n'){
                        if (next() === '-' && tryConsume('---'))
                            break;
                        else {
                            ret += '\n';
                        }
                    }
                    else {
                        ret += token;
                        token = next();
                    }
                }
                return ret;
            }
            return false;
        });
    }

    function parseItalicOrStrong(){
        return tryParse(parseItalicOrStrongWorker);
    }

    function parseItalicOrStrongWorker(){
        if (token === '*'){
            if (next() === '*'){
                if ((token = next()) !== '*' && !regWhiteSpace.test(token) && token !== '\n' && token !== ''){
                    let content = '';
                    let lastSpace = false;
                    while (true){
                        if (token === '\n' || token === ''){
                            // ER: unclosed bold text
                            return false;
                        }
                        else if (!lastSpace && token === '*'){
                            if ((token = next()) === '*'){
                                next();
                                return Node.makeValNode(NodeType.BOLD, content);
                            }
                        }
                        content += token;
                        lastSpace = regWhiteSpace.test(token);
                        token = next();
                    }
                }
            }
            else if (!regWhiteSpace.test(token) && token !== '' && token !== '\n'){
                let content = '';
                let lastSpace = false;
                while (true){
                    if (token === '\n' || token === ''){
                        // ER: unclosed italic text
                        return false;
                    }
                    else if (!lastSpace && token === '*'){
                        next();
                        return Node.makeValNode(NodeType.ITALIC, content);
                    }
                    content += token;
                    lastSpace = regWhiteSpace.test(token);
                    token = next();
                }
            }
        }
        return false;
    }

    function parseUnderscoreItalic(){
        return tryParse(() => {
            if (token === '_'){
                token = next();
                if (!regWhiteSpace.test(token) && token !== '_' && token !== ''){
                    let content = '';
                    let lastSpace = false;
                    while (true){
                        if (token === '\n' || token === ''){
                            // ER: unclosed italic text
                            return false;
                        }
                        else if (!lastSpace && token === '_'){
                            next();
                            return Node.makeValNode(NodeType.ITALIC, content);
                        }
                        content += token;
                        lastSpace = regWhiteSpace.test(token);
                        token = next();
                    }
                }
            }
            return false;
        });
    }

    function parseStrikeThrough(){
        return tryParse(() => {
            let content = '';
            token = next();
            if (token === '~'){
                token = next();
                if (!regWhiteSpace.test(token) && token !== '' && token !== '\n' && token !== '~'){
                    let lastSpace = false;
                    while (true){
                        if (token === '' || token === '\n'){
                            // ER: unclosed striked through text
                            break;
                        }
                        else if (!lastSpace && token === '~' && tryConsume('~~')){
                            break;
                        }
                        lastSpace = regWhiteSpace.test(token);
                        content += token;
                        token = next();
                    }
                    return Node.makeValNode(NodeType.STRIKE_THROUGH, content);
                }
            }
            return false;
        });
    }

    function parseMathjaxBlockRest(){
        let content = '';
        while (true){
            if (token === ''){
                // ER: unclosed mathjax block
                break;
            }
            else if (token === '\n'){
                processNewLine();
                content += '\n';
            }
            else if (token === '$' && tryConsume('$$')){
                break;
            }
            else {
                content += token;
                token = next();
            }
        }
        return Node.makeValNode(NodeType.BLOCK_MATHJAX, content);
    }

    function parseInlineMathjaxRest(){
        let content = '';
        while (true){
            if (token === ''){
                // ER: unclosed inline mathjax
                break;
            }
            else if (token === '\n'){
                // Allow new lines in inline mathjax, since it is so in TeX.
                processNewLine();
                content += '\n';
            }
            else if (token === '$'){
                next();
                break;
            }
            content += token;
            token = next();
        }
        return Node.makeValNode(NodeType.INLINE_MATHJAX, content);
    }

    function parseImageRestOrLink(image){
        return tryParse(() => {
            if (token === '['){
                token = next();
                skipWhiteSpace();
                let desc = '';
                while (true){
                    if (token === ']'){
                        token = next();
                        break;
                    }
                    else if (token === ''){
                        // ER: Invalid image/link description text
                        return false;
                    }
                    else if (token === '\n'){
                        processNewLine();
                        skipWhiteSpace();
                        if (token === '\n'){
                            // ER: Invalid image/link description text
                            return false;
                        }
                        else
                            desc += ' ';
                    }
                    else {
                        desc += token;
                        token = next();
                    }
                }
                skipWhiteSpace();
                if (token === '('){
                    token = next();
                    skipWhiteSpace();
                    let src = '';
                    while (true){
                        if (token === ')'){
                            token = next();
                            break;
                        }
                        else if (token === '' || token === '\n'){
                            // ER: Invalid image/link source
                            return false;
                        }
                        else {
                            src += token;
                            token = next();
                        }
                    }
                    return image ? Node.makeImageNode(desc, src) : Node.makeLinkNode(desc, src);
                }
            }
            return false;
        });
    }

    function parseCodeBlock(){
        let content = '', lang = '';
        if (tryConsume('```')){
            skipWhiteSpace();
            while (true){
                if (token === '\n'){
                    processNewLine();
                    break;
                }
                else if (token === ''){
                    // ER: terminated code block
                    break;
                }
                else {
                    lang += token;
                    token = next();
                }
            }
            while (true){
                if (token === '\n'){
                    processNewLine();
                    content += '\n';
                    if (token === '`' && tryConsume('```')){
                        break;
                    }
                }
                else if (token === ''){
                    // ER: unclosed code block
                    break;
                }
                else {
                    content += token;
                    token = next();
                }
            }
            return Node.makeCodeNode(lang, content);
        }
    }

    function parseInlineCode(){
        let content = '';
        if (tryConsume('```')){
            return tryParse(() => {
                while (true){
                    if (token === '\n'){
                        processNewLine();
                        content += '\n';
                        if (token === '`' && tryConsume('```')){
                            break;
                        }
                    }
                    else if (token === ''){
                        // ER: unclosed inline code block
                        return false;
                    }
                    else {
                        content += token;
                        token = next();
                    }
                }
                return Node.makeValNode(NodeType.INLINE_CODE, content);
            });
        }
        else {
            return tryParse(() => {
                token = next();
                while (true){
                    if (token === '\n' || token === ''){
                        // ER: unclosed inline code
                        return false;
                    }
                    else if (token === '`'){
                        next();
                        break;
                    }
                    else {
                        content += token;
                        token = next();
                    }
                }
                return Node.makeValNode(NodeType.INLINE_CODE, content);
            });
        }
    }

    
    /**
     * Text, italic text, bold text, inline mathjax
     */
    function parseLineElements(inTable = false, noHtml = false){
        let ret = [];
        function emitString(s){
            let last = ret[ret.length - 1];
            if (ret.length > 0 && last.type === NodeType.TEXT){
                last.val += s;
            }
            else {
                ret.push(Node.makeValNode(NodeType.TEXT, s));
            }
        }
        while (true){
            if (token === '' || token === '\n' || (inTable && token === '|'))
                break;
            else if (token === '*'){
                let italic = parseItalicOrStrong();
                if (italic === false){
                    emitString('*');
                    token = next();
                }
                else
                    ret.push(italic);
            }
            else if (token === '_'){
                let it = parseUnderscoreItalic();
                if (it === false){
                    emitString('_');
                    token = next();
                }
                else
                    ret.push(it);
            }
            else if (token === '$'){
                if ((token = next()) !== '$'){
                    ret.push(parseInlineMathjaxRest());
                }
                else {
                    token = next();
                    emitString('$$');
                }
            }
            else if (token === '!'){
                let img;
                if ((token = next()) === '[' && (img = parseImageRestOrLink(true)) !== false){
                    ret.push(img);
                }
                else {
                    emitString('!');
                }
            }
            else if (token === '['){
                let link = parseImageRestOrLink(false);
                if (link === false){
                    emitString('[');
                    token = next();
                }
                else
                    ret.push(link);
            }
            else if (token === '`'){
                let c = parseInlineCode();
                if (c === false){
                    emitString('`');
                    token = next();
                }
                else
                    ret.push(c);
            }
            else if (token === '~'){
                let c = parseStrikeThrough();
                if (c === false){
                    emitString('~');
                    token = next();
                }
                else
                    ret.push(c);
            }
            else if (token === '<' && !noHtml){
                let t = parseHtmlTag();
                if (t === false){
                    emitString('<');
                    token = next();
                }
                else
                    ret.push(t);
            }
            else {
                let content = '';
                while (token !== '' && (token !== '<' || noHtml) && !regLineSpecial.test(token) && (!inTable || token !== '|')){
                    if (token === '\\'){
                        if ((token = next()) !== '' && token !== '\n'){
                            content += token;
                        }
                        else
                            content += '\\';
                    }
                    else {
                        content += token;
                        token = next();
                    }
                }
                emitString(content);
            }
        }
        return ret;
    }

    function parseTableRow(){
        token = next();
        let ret = new Node(NodeType.TABLE_ROW);
        while (true){
            skipWhiteSpace();
            if (token === ''){
                break;
            }
            else if (token === '\n'){
                processNewLine();
                break;
            }
            else if (token === '|'){
                token = next();
                ret.append(new Node(NodeType.TABLE_COL));
            }
            else {
                let col = new Node(NodeType.TABLE_COL);
                for (let n of parseLineElements(true)){
                    col.append(n);
                }
                ret.append(col);
                if (token === '|'){
                    token = next();
                }
            }
        }
        return ret;
    }

    const regLeftAlign = /^:-+$/;
    const regRightAlign = /^-+:$/;
    const regCenterAlign = /^:-+:$/;

    function isHeadingRow(row){
        for (let td of row.children){
            if (td.size() === 1){
                let c = td.children[0].val;
                if (regLeftAlign.test(c)){
                    td.align = 'left';
                }
                else if (regRightAlign.test(c)){
                    td.align = 'right';
                }
                else if (regCenterAlign.test(c)){
                    td.align = 'center';
                }
                else
                    return false;
            }
            else
                return false;
        }
        return true;
    }

    function clearAlign(row){
        for (let td of row.children){
            td.align = '';
        }
    }

    function copyAlignFrom(head, row){
        for (let i = 0, _a = head.children, _b = row.children; i < _a.length; i++){
            _a[i].align = _b[i].align;
        }
    }

    function syncTableRowLength(row, len){
        if (row.size() > len){
            row.children.length = len;
        }
        else {
            while (row.size() < len){
                row.append(new Node(NodeType.TABLE_COL));
            }
        }
    }

    function parseTable(){
        let table = new Node(NodeType.TABLE);
        let head = parseTableRow();
        skipWhiteSpace();
        if (token === '|'){
            let headCenter = parseTableRow();
            let tbody = new Node(NodeType.TABLE_BODY);
            if (headCenter.size() === head.size()){
                if (isHeadingRow(headCenter)){
                    copyAlignFrom(head, headCenter);
                    table.append(new Node(NodeType.TABLE_HEAD, head));
                }
                else {
                    clearAlign(headCenter);
                    tbody.append(head);
                    tbody.append(headCenter);
                }
            }
            else {
                syncTableRowLength(headCenter, head.size());
                tbody.append(head);
                tbody.append(headCenter);
            }
            table.append(tbody);

            while (true){
                skipWhiteSpace();
                if (token === '|'){
                    let row = parseTableRow();
                    syncTableRowLength(row, head.size());
                    tbody.append(row);
                }
                else
                    break;
            }
        }
        else {
            table.append(new Node(NodeType.TABLE_BODY, head));
        }
        return table;
    }

    function skipHtmlWhiteSpace(){
        while (true){
            if (token === '\n'){
                processNewLine();
            }
            else if (!regWhiteSpace.test(token)){
                break;
            }
            else {
                token = next();
            }
        }
    }

    function isSelfClosingTag(name){
        return regSelfClosedTag.test(name);
    }

    

    function parseHtmlAttrVal(){
        let val = '';
        if (token === '"' || token === "'"){
            let t = token;
            token = next();
            while (true){
                if (token === t){
                    token = next();
                    break;
                }
                else if (token === '' || token === '\n'){
                    // ER: unclosed property value
                    return void 0;
                }
                else if (token === '\\'){
                    token = next();
                    if (token !== void 0){
                        token = next();
                        if (unescapes.hasOwnProperty(token)){
                            val += unescapes[token];
                        }
                        else 
                            val += '\\' + token;
                    }
                    else
                        val += '\\';
                }
                else {
                    val += token;
                    token = next();
                }
            }
        }
        else {
            while (!regWhiteSpace.test(token) && token !== '\n' && token !== '>'){
                val += token;
                token = next();
            }
        }
        return val;
    }

    function parseHtmlAttrList(){
        let closed = false, attrs = {};
        while (true){
            skipHtmlWhiteSpace();
            if (token === '>'){
                token = next();
                break;
            }
            else if (token === '/' && tryConsume('/>')){
                closed = true;
                break;
            }
            else if (regHTMLName.test(token)){
                let name = '', val = void 0;
                while (regHTMLName.test(token)){
                    name += token;
                    token = next();
                }
                skipHtmlWhiteSpace();
                if (token === '='){
                    token = next();
                    skipHtmlWhiteSpace();
                    val = parseHtmlAttrVal();
                    if (val === void 0){
                        return false;
                    }
                }
                attrs[name] = val;
            }
            else {
                // ER: malfomed attribute list
                return false;
            }
        }
        return { attrs, closed };
    }

    function parseHtmlTag(){
        let closed = false;
        let head = tryParse(() => {
            token = next();
            if (token === '!'){
                if (consume('!--')){
                    skipHtmlWhiteSpace();
                    return Node.makeValNode(NodeType.HTML_COMMENT, '');
                }
                else {
                    return false;
                }
            }
            else if (regHTMLName.test(token)){
                let name = '';
                while (regHTMLName.test(token)){
                    name += token;
                    token = next();
                }
                let l = parseHtmlAttrList();
                if (l === false) {
                    return false;
                }
                else {
                    closed = l.closed;
                    return Node.makeHtmlTag(name, false, l.attrs);
                }
            }
            return false;
        });
        if (head === false){
            return false;
        }
        
        if (head.type === NodeType.HTML_TAG){
            if (!closed && !isSelfClosingTag(head.name)){
                head.appendAll(parseHtmlContent(head.name));
            }
            return head;
        }
        else if (head.type === NodeType.HTML_COMMENT){
            skipHtmlWhiteSpace();
            let content = '';
            while (true){
                if (token === '') {
                    // ER: unclosed html comment
                    break;
                }
                if (token === '\n'){
                    processNewLine();
                    content += '\n';
                }
                else if (token === '-' && tryConsume('-->')){
                    break;
                }
                else {
                    content += token;
                    token = next();
                }
            }
            head.val = content.trim();
            return head;
        }
        else
            throw new Error(`Unexpected node type ${head.type}, which shoudn't happen!`);
    }

    function tryConsumeCloseTag(tagName){
        return tryParse(() => {
            token = next();
            if (token === '/'){
                token = next();
                let name = '';
                while (regHTMLName.test(token)){
                    name += token;
                    token = next();
                }
                skipHtmlWhiteSpace();
                if (token === '>'){
                    token = next();
                    return tagName === name;
                }
            }
            return false;
        });
    }

    function parseHtmlContent(tagName){
        let ret = [];
        function emitString(s){
            let last = ret[ret.length - 1];
            if (ret.length > 0 && last.type === NodeType.HTML_TEXT){
                last.val += s;
            }
            else {
                ret.push(Node.makeValNode(NodeType.HTML_TEXT, s));
            }
        }
        function trim(){
            let last = ret[ret.length - 1];
            if (last && last.type === NodeType.HTML_TEXT){
                let s = last.val, len = s.length;
                let c = s.charAt(len - 1);
                while (len > 0 && (regWhiteSpace.test(c) || c === '\n')){
                    len--;
                    c = s.charAt(len - 1);
                }
                if (len === 0){
                    ret.pop();
                }
                else {
                    last.val = s.substr(0, len);
                }
            }
        }

        skipHtmlWhiteSpace();
        while (true){
            if (token === '<'){
                let t;
                if (tryConsumeCloseTag(tagName)){
                    trim();
                    break;
                }
                else if ((t = parseHtmlTag()) !== false){
                    skipHtmlWhiteSpace();
                    trim();
                    ret.push(t);
                }
                else {
                    emitString('<');
                    token = next();
                }
            }
            else {
                let content = '';
                while (token !== '<' && token !== ''){
                    if (token === '\n'){
                        processNewLine();
                        content += '\n';
                    }
                    else {
                        content += token;
                        token = next();
                    }
                }
                emitString(content);
            }
        }
        return ret;
    }

    function parseHeading(){
        return tryParse(() => {
            let level = 1;
            token = next();
            while (token === '#'){
                level++;
                token = next();
            }
            if (regWhiteSpace.test(token)){
                skipWhiteSpace();
                return Node.makeValNode(NodeType.HEADING, level).appendAll(parseLineElements());
            }
            else {
                // ER: no space between heading symbol and content
                return false;
            }
        });
    }

    function isParagraphEnd(){
        skipWhiteSpace();
        if (token === '' || token === '\n' || token === '>'){
            return true;
        }
        else if (token === '#'){
            return tryParse(() => {
                token = next();
                while (token === '#'){
                    token = next();
                }
                let ret = regWhiteSpace.test(token);
                if (ret)
                    peekSyntaxType = Syntax.HEADING;
                return ret;
            }, true);
        }
        else if (token === '*'){
            return tryParse(() => {
                token = next();
                if (token === '*' && next() === '*'){
                    token = next();
                    skipWhiteSpace();
                    if (token === '\n' || token === ''){
                        peekSyntaxType = Syntax.HR;
                        return true;
                    }
                }
                else if (regWhiteSpace.test(token)){
                    peekSyntaxType = Syntax.LIST;
                    return true;
                }
                return false;
            }, true);
        }
        else if (token === '$'){
            return tryParse(() => next() === '$', true);
        }
        else if (token === '`'){
            return tryConsume('```', true);
        }
        return false;
    }

    function isListOrHrStart(){
        if (peekSyntaxType === Syntax.HR || peekSyntaxType === Syntax.LIST){
            return true;
        }
        return tryParse(() => {
            if (token === '*'){
                if (regWhiteSpace.test(token = next())){
                    peekSyntaxType = Syntax.LIST;
                    return true;
                }
                else if (next() === '*'){
                    peekSyntaxType = Syntax.HR;
                    return true;
                }
            }
            return false;
        }, true);
    }

    function readListHead(){
        let count = 0;
        skipWhiteSpace();
        while (true){
            if (token === '*' && tryParse(() => regWhiteSpace.test(next()))){
                skipWhiteSpace();
                count++;
            }
            else
                break;
        }
        return count;
    }

    function parseList(){
        let level = readListHead();
        let listStack = [new Node(NodeType.LIST)];
        function syncLevel(){
            while (level < listStack.length){
                listStack.pop();
            }
            while (level > listStack.length){
                let n = new Node(NodeType.LIST);
                listStack[listStack.length - 1].append(n);
                listStack.push(n);
            }
        }
        while (true){
            let b = parseBlock(true);
            if (b.type !== NodeType.LIST_ITEM){
                b = new Node(NodeType.LIST_ITEM, b);
            }
            syncLevel();
            listStack[listStack.length - 1].append(b);
            if (token === '\n'){
                processNewLine();
                skipWhiteSpace();
                break;
            }
            else if (!isListOrHrStart() || peekSyntaxType !== Syntax.LIST){
                break;
            }
            else {
                level = readListHead();
            }
        }
        return listStack[0];
    }

    function skipLines(){
        skipWhiteSpace();
        while (token === '\n'){
            processNewLine();
            skipWhiteSpace();
        }
    }

    function parseBlock(isList = false){
        let a;
        skipLines();

        if (token === '#' && (a = parseHeading()) !== false){
            if (token === '\n'){
                processNewLine();
                skipWhiteSpace();
            }
            return a;
        }
        else if (token === '>'){
            token = next();
            curLevel++;
            quoteLevel++;
            return new Node(NodeType.QUOTE_BLOCK).appendAll(parseBlockSet());
        }
        else if (token === '`'){
            let ret = parseCodeBlock();
            skipLines();
            return ret;
        }
        else if (token === '*' && isListOrHrStart()){
            if (peekSyntaxType === Syntax.HR){
                next(); next(); next();
                return new Node(NodeType.HR);
            }
            else {
                let ret = parseList();
                skipLines();
                return ret;
            }
        }
        else if (token === '|'){
            let ret = parseTable();
            skipLines();
            return ret;
        }
        else if (token === '$' && tryConsume('$$')){
            let ret = parseMathjaxBlockRest();
            skipLines();
            return ret;
        }
        else if (token === '<' && (a = parseHtmlTag()) !== false){
            skipLines();
            return a;
        }
        else {
            let noHtml = token === '<';
            let p = new Node(isList ? NodeType.LIST_ITEM : NodeType.PARAGRAPH);
            while (true){
                for (let n of parseLineElements(false, noHtml)){
                    p.append(n);
                }
                noHtml = false;
                if (token === ''){
                    break;
                }
                else if (token === '\n'){
                    processNewLine();
                    skipWhiteSpace();
                    if (isParagraphEnd()){
                        if (token === '\n' && !isList){
                            processNewLine();
                            skipWhiteSpace();
                        }
                        break;
                    }
                    else
                        p.append(new Node(isList ? NodeType.LIST_LINE : NodeType.LINE));
                }
            }
            return p;
        }
    }

    function parseBlockSet(){
        let ret = [];
        while (true){
            if (curLevel < quoteLevel){
                quoteLevel--;
                break;
            }
            else if (token === ''){
                break;
            }
            ret.push(parseBlock());
        }
        return ret;
    }

    function parseMarkdown(){
        token = ch();
        let frontMatter = parseFrontMatter() || '';
        
        let articleNodes = new Node(NodeType.ARTICLE);
        while (token !== '')
            articleNodes.appendAll(parseBlockSet());
        return { frontMatter, articleNodes };
    }

    function consume(str){
        for (let j = 0; j < str.length; j++){
            if (str.charAt(j) !== token){
                return false;
            }
            token = next();
        }
        return true;
    }

    function tryConsume(str, rollback = false){
        return tryParse(() => {
            for (let j = 0; j < str.length; j++){
                if (str.charAt(j) !== token)
                    return false;
                token = next();
            }
            return true;
        }, rollback);
    }

    // Thanks to the parser source code of typescript
    function tryParse(cb, rollback = false){
        
        // Save environmental variables
        let check = i;
        let quoteLevel2 = quoteLevel;
        let token2 = token;
        let curLevel2 = curLevel;

        let ret = cb();
        if (rollback || ret === false) {
            // Restoring
            i = check;
            quoteLevel = quoteLevel2;
            token = token2;
            curLevel = curLevel2;
        }
        return ret;
    }

    return {
        parse
    };
}

exports.createParser = createParser;
exports.toDefautHTML = function(ast){
    let c = new HTMLConverter();
    ast.accept(c);
    return c.text;
}
exports.VisitorBase = VisitorBase;
exports.NodeType = NodeType;