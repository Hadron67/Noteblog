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
        INLINE_MATHJAX: i++,
        BLOCK_MATHJAX: i++,
    
        ARTICLE: i++,
        PARAGRAPH: i++,
        LIST: i++,
        LIST_ITEM: i++,
        HR: i++,
        HEADING: i++,
        QUOTE_BLOCK: i++
    };
})();

function Node(type, val){
    this.type = type;
    this.children = [];
    this.val = val;
    for (let i = 2, _a = arguments; i < _a.length; i++){
        this.append(_a[i]);
    }
}
Node.prototype.append = function(){
    for (let n of arguments){
        this.children.push(n);
    }
    return this;
}
Node.prototype.appendAll = function(children){
    for (let n of children){
        this.append(n);
    }
    return this;
}
Node.prototype.accept = function(visitor){
    switch (this.type){
        case NodeType.BOLD: return visitor.visitBold(this);
        case NodeType.ITALIC: return visitor.visitItalic(this);
        case NodeType.TEXT: return visitor.visitText(this);
        case NodeType.INLINE_CODE: return visitor.visitInlineCode(this);
        case NodeType.CODE: return visitor.visitCode(this);
        case NodeType.LINE: return visitor.visitLine(this);
        case NodeType.INLINE_MATHJAX: return visitor.visitInlineMathjax(this);
        case NodeType.BLOCK_MATHJAX: return visitor.visitBlockMathjax(this);
        case NodeType.HEADING:
            if (visitor.enterHeading(this))
                return this;
            this.acceptAll(visitor);
            return visitor.leaveHeading(this);
        case NodeType.PARAGRAPH:
            if(visitor.enterParagraph(this))
                return this;
            this.acceptAll(visitor);
            return visitor.leaveParagraph(this);
        case NodeType.LIST:
            if(visitor.enterList(this))
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
Node.prototype.acceptAll = function(visitor){
    for (let i = 0, _a = this.children; i < _a.length; i++){
        let n = _a[i].accept(visitor);
        if (n !== null)
            _a[i] = n;
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

    let T = (function(){
        let i = 0;
        return {

        };
    })();

    const regHTMLName = /[a-zA-Z-_$]/;
    const regWhiteSpace = /[ \t]/;

    // token data
    let token, tokenText = '';
    let quoteLevel = 0;

    return {
        parse
    };

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
                                return new Node(NodeType.BOLD, content)
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
                        return new Node(NodeType.ITALIC, content);
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
                            return new Node(NodeType.ITALIC, content);
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
                return content;
            }
            else if (token === '\n'){
                processNewLine();
                content += '\n';
            }
            else if (token === '$' && tryConsume('$$')){
                return new Node(NodeType.BLOCK_MATHJAX, content);
            }
            else
                content += token;
            token = next();
        }
    }

    function parseInlineMathjaxRest(){
        let content = '';
        while (true){
            if (token === ''){
                // ER: unclosed inline mathjax
                return content;
            }
            else if (token === '\n'){
                // Allow new lines in inline mathjax, since it is so in TeX.
                processNewLine();
                content += '\n';
            }
            else if (token === '$'){
                next();
                return new Node(NodeType.INLINE_MATHJAX, content);
            }
            content += token;
            token = next();
        }
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
                ret.push(new Node(NodeType.TEXT, s));
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
            else {
                let content = '';
                while (token !== '*' && token !== '_' && token !== '\n' && token !== '' && token !== '$'){
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
                return new Node(NodeType.HEADING, level).appendAll(parseLineElements());
            }
            else {
                // ER: no space between heading symbol and content
                return false;
            }
        });
    }

    /**
     * 
     */
    function parseArticleElements(){
        let ret = [];
        let lineElements = [];
        function emitParagraph(){
            if (lineElements.length > 0)
                ret.push(new Node(NodeType.PARAGRAPH).appendAll(lineElements));
            lineElements.length = 0;
        }
        while (true){
            let h;
            skipWhiteSpace();
            while (token === '\n'){
                processNewLine();
                skipWhiteSpace();
            }
            if (token === ''){
                emitParagraph();
                break;
            }
            if (token === '#' && (h = parseHeading()) !== false){
                emitParagraph();
                ret.push(h);
            }
            else if (token === '>'){
                next();
                quoteLevel++;
                let q = new Node(NodeType.QUOTE_BLOCK).append(parseArticleElements());
                quoteLevel--;
                emitParagraph();
                ret.push(q);
            }
            // TODO: parse list, quote block
            else {
                for (let n of parseLineElements()){
                    lineElements.push(n);
                }
                if (token === '\n')
                    lineElements.push(new Node(NodeType.LINE));
            }

            if (token === '\n'){
                processNewLine();
                skipWhiteSpace();
                if (token === '\n'){
                    processNewLine();
                    emitParagraph();
                    break;
                }
            }
            else if (token !== '')
                throw new Error(`Unexpected token "${token}"`);
        }
        return ret;
    }

    function parseMarkdown(){
        token = ch();
        let frontMatter = parseFrontMatter() || '';
        
        let articleNodes = new Node(NodeType.ARTICLE);
        while (token !== '')
            articleNodes.appendAll(parseArticleElements());
        return { frontMatter, articleNodes };
    }

    function tryConsume(str){
        return tryParse(() => {
            for (let j = 0; j < str.length; j++){
                if (str.charAt(j) !== token)
                    return false;
                token = next();
            }
            return true;
        });
    }

    // Thanks to the parser source code of typescript
    function tryParse(cb, rollback){
        rollback = !!rollback;
        
        // Save environmental variables
        let check = i;
        let quoteLevel2 = quoteLevel;
        let token2 = token;

        let ret = cb();
        if (rollback || ret === false) {
            // Restoring
            i = check;
            quoteLevel = quoteLevel2;
            token = token2;
        }
        return ret;
    }
}

exports.createParser = createParser;
exports.toDefautHTML = function(ast){
    let c = new HTMLConverter();
    ast.accept(c);
    return c.text;
}