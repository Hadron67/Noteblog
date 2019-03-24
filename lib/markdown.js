'use strict';

const NodeType = (function(){
    let i = 0;
    return {
        BOLD: i++,
        ITALIC: i++,
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
        QUOTE_BLOCK: i++
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
    accept(visitor) {
        switch (this.type) {
            case NodeType.BOLD: return visitor.visitBold(this);
            case NodeType.ITALIC: return visitor.visitItalic(this);
            case NodeType.TEXT: return visitor.visitText(this);
            case NodeType.INLINE_CODE: return visitor.visitInlineCode(this);
            case NodeType.CODE: return visitor.visitCode(this);
            case NodeType.LINE: return visitor.visitLine(this);
            case NodeType.INLINE_MATHJAX: return visitor.visitInlineMathjax(this);
            case NodeType.BLOCK_MATHJAX: return visitor.visitBlockMathjax(this);
            case NodeType.LINK: return visitor.visitLink(this);
            case NodeType.IMAGE: return visitor.visitImage(this);
            case NodeType.LIST_LINE: return visitor.visitListLine(this);
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


function HTMLConverter(classes){
    this.text = '';
    this.classes =  classes || {};
}
HTMLConverter.prototype.getClass = function(c){
    if (this.classes.hasOwnProperty(c)){
        return ` class="${this.classes[c]}"`;
    }
    else
        return '';
}
HTMLConverter.prototype.visitBold = function(node){ this.text += `<strong>${node.val}</strong>`; }
HTMLConverter.prototype.visitItalic = function(node){ this.text += `<em>${node.val}</em>`; }
HTMLConverter.prototype.visitCode = function(node){ this.text += `<code>${node.val}</code>`; }
HTMLConverter.prototype.visitInlineCode = function(node){ this.text += `<code>${node.val}</code>`; }
HTMLConverter.prototype.visitText = function(node){ this.text += node.val; }
HTMLConverter.prototype.visitLine = function(node){ this.text += '<br />'; }
HTMLConverter.prototype.visitInlineMathjax = function(node){ this.text += `$${node.val}$`; }
HTMLConverter.prototype.visitBlockMathjax = function(node){ this.text += `$$${node.val}$$`; }
HTMLConverter.prototype.visitLink = function(node){ this.text += `<a href="${node.href}">${node.name}</a>`; }
HTMLConverter.prototype.visitImage = function(node){ this.text += `<img src="${node.src}" alt="${node.alt}" />`; }
HTMLConverter.prototype.visitListLine = function(node){ this.text += ' '; }
HTMLConverter.prototype.enterArticle = function(node){ this.text += `<article>`; }
HTMLConverter.prototype.leaveArticle = function(node){ this.text += '</article>'; }
HTMLConverter.prototype.enterHeading = function(node){ this.text += `<h${node.val}>`; }
HTMLConverter.prototype.leaveHeading = function(node){ this.text += `</h${node.val}>`; }
HTMLConverter.prototype.enterParagraph = function(node){ this.text += `<p>`; }
HTMLConverter.prototype.leaveParagraph = function(node){ this.text += '</p>'; }
HTMLConverter.prototype.enterQuoteBlock = function(node){ this.text += `<blockquote>`; }
HTMLConverter.prototype.leaveQuoteBlock = function(node){ this.text += '</blockquote>'; }
HTMLConverter.prototype.enterList = function(node){ this.text += node.val ? '<ol>' : '<ul>'; }
HTMLConverter.prototype.leaveList = function(node){ this.text += node.val ? '</ol>' : '</ul>'; }
HTMLConverter.prototype.enterListItem = function(node){ this.text += '<li>'; }
HTMLConverter.prototype.leaveListItem = function(node){ this.text += '</li>'; }

/**
 * This Markdown parser takes care about contents like `$...$` and `$$...$$`,
 * Yeah, that's great
 * @param {*} opt 
 */
function createParser(opt){
    let text, i = 0;

    let frontMatter;

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
    const regLineSpecial = /[`\*_\n\$!\[]/;

    // token data
    let token, tokenText = '';
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
        console.assert(token === '\n');
        token = next();
        let count = 0;
        while (count < quoteLevel){
            skipWhiteSpace();
            if (token === '>'){
                token = next;
                count++;
            }
            else
                break;
        }
        skipWhiteSpace();
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

    }

    function parseInlineCode(){

    }

    
    /**
     * Text, italic text, bold text, inline mathjax
     */
    function parseLineElements(){
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
            if (token === '' || token === '\n')
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
                if ((token = next()) === '$'){
                    next();
                    // TODO: Move to parseArticleElements
                    ret.push(parseMathjaxBlockRest());
                }
                else {
                    ret.push(parseInlineMathjaxRest());
                }
            }
            else if (token === '!'){
                let img;
                if ((token = next()) === '[' && (img = parseImageRestOrLink(true)) !== false){
                    ret.push(img);
                }
                else
                    emitString('!');
            }
            else if (token === '['){
                let link = parseImageRestOrLink(false);
                if (link === false){
                    emitString('[');
                }
                else
                    ret.push(link);
            }
            else {
                let content = '';
                while (token !== '' && !regLineSpecial.test(token)){
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

    function parseTable(){
        
    }

    function isListStart(){
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
                if ((token = next()) === '*' && next() === '*'){
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
            if (!isListOrHrStart() || peekSyntaxType !== Syntax.LIST){
                break;
            }
            else {
                level = readListHead();
            }
        }
        return listStack[0];
    }

    function parseBlock(isList = false){
        let a;
        skipWhiteSpace();
        while (token === '\n'){
            processNewLine();
            skipWhiteSpace();
        }

        if (token === '#' && (a = parseHeading()) !== false){
            if (token === '\n'){
                processNewLine();
            }
            return a;
        }
        else if (token === '>'){
            token = next();
            curLevel++;
            quoteLevel++;
            return new Node(NodeType.QUOTE_BLOCK).appendAll(parseBlockSet());
        }
        else if (token === '*' && isListOrHrStart()){
            if (peekSyntaxType === Syntax.HR){
                next(); next(); next();
                return new Node(NodeType.HR);
            }
            else {
                return parseList();
            }
        }
        else {
            let p = new Node(isList ? NodeType.LIST_ITEM : NodeType.PARAGRAPH);
            while (true){
                for (let n of parseLineElements()){
                    p.append(n);
                }
                if (token === ''){
                    break;
                }
                else if (token === '\n'){
                    processNewLine();
                    // p.append(new Node(isList ? NodeType.LIST_LINE : NodeType.LINE));
                    if (isParagraphEnd()){
                        if (token === '\n')
                            processNewLine();
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

    // function parseArticleElements(inList = false){
    //     let ret = [];
    //     let overRead = null;
    //     let lineElements = [];
    //     function emitParagraph(n){
    //         if (lineElements.length > 0)
    //             ret.push(new Node(NodeType.PARAGRAPH).appendAll(lineElements));
    //         lineElements.length = 0;
    //         if (n !== void 0)
    //         ret.push(n);
    //     }
    //     while (true){
    //         let h;
    //         skipWhiteSpace();
    //         while (token === '\n'){
    //             processNewLine();
    //             skipWhiteSpace();
    //         }
    //         if (token === ''){
    //             break;
    //         }
    //         if (token === '#' && (h = parseHeading()) !== false){
    //             if (quoteLevel > curLevel){
    //                 break;
    //             }
    //             else
    //                 emitParagraph(h);
    //         }
    //         else if (token === '>'){
    //             next();
    //             curLevel++;
    //             quoteLevel++;
    //             let q = new Node(NodeType.QUOTE_BLOCK).appendAll(parseArticleElements());
    //             emitParagraph(q);
    //             if (curLevel < quoteLevel){
    //                 quoteLevel--;
    //                 break;
    //             }
    //             else
    //                 continue;
    //         }
    //         // TODO: parse list, quote block
    //         else {
    //             for (let n of parseLineElements()){
    //                 lineElements.push(n);
    //             }
    //             if (token === '\n')
    //                 lineElements.push(new Node(NodeType.LINE));
    //         }

    //         if (token === '\n'){
    //             processNewLine();
    //             skipWhiteSpace();
    //             if (token === '\n'){
    //                 processNewLine();
    //                 if (curLevel < quoteLevel)
    //                     quoteLevel--;
    //                 break;
    //             }
    //         }
    //         else if (token !== '')
    //             throw new Error(`Unexpected token "${token}"`);
    //     }
    //     emitParagraph();
    //     return ret;
    // }

    function parseMarkdown(){
        token = ch();
        let frontMatter = parseFrontMatter() || '';
        
        let articleNodes = new Node(NodeType.ARTICLE);
        while (token !== '')
            // articleNodes.appendAll(parseArticleElements());
            articleNodes.appendAll(parseBlockSet());
        return { frontMatter, articleNodes };
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
    function tryParse(cb, rollback){
        rollback = !!rollback;
        
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