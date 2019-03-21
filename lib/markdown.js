'use strict';

const component = require('./component.js');

/**
 * This Markdown parser takes care about contents like `$...$` and `$$...$$`,
 * Yeah, that's great
 * @param {*} opt 
 */
function createParser(opt){
    let text, i = 0;
    let classes = opt.classes;

    let frontMatter, elements = [];

    let cc = 1;
    let T_QUOTE = cc++;
    let T_DEQUOTE = cc++;

    const regHTMLName = /[a-zA-Z-_$]/;

    let allowQuote = false, inHTML = false;
    // token data
    let token, tokenText = '';
    // additional token data

    let quoteLevel = 0, curLevel = 0;

    return {
        load,
        parse
    };

    function ch(){
        // read \n, \r\n, \r all as \n
        let c = text.charAt(i);
        if (c === '\r'){
            if (text.charAt(i + 1) === '\n'){
                i++;
                return '\n';
            }
            else
                return '\n';
        }
        return c;
    }

    function readQuoteSymbs(){
        let c;
        let count = 0;
        while (true){
            while ((c = text.charAt(i)) === ' '){
                i++;
            }
            if (c === '>'){
                i++;
                count++;
            }
            else
                return count;
        }
    }

    function makeStrong(){

    }

    function makeItalic(){

    }

    function parse(){
        parseMarkdown();
        return { frontMatter, elements };
    }

    function load(input){
        text = input;
        elements.length = 0;
        i = 0;
    }

    function parseFrontMatter(){
        if (tryConsume('---')){
            while (true){
                if (c === void 0) {
                    // ER: unclosed front matter
                    break;
                }
                else if (c === '-' && tryConsume('---')){
                    break;
                }
                else
                    frontMatter += c;
            }
            return true;
        }
        return false;
    }

    function readListHead(){
        let count = 0;
        while (true){
            let c = ch();
            if (c === '-' || c === '*'){
                i++;
                if ((c = ch()) === ' '){
                    i++;
                    count++;
                }
                else {
                    i--;
                    break;
                }
            }
            else 
                break;
        }
        return count;
    }

    function parseList(){

    }

    function parseItalicOrStrong(){
        let content = '';
        let space = false;
        let c = ch();
        if (c === '*'){
            i++;
            if ((c = ch()) === '*'){
                i++;
                if ((c = ch()) !== ' ' && c !== '*' && c !== '\n' && c !== void 0){
                    let content = '';
                    let lastSpace = false;
                    while (true){
                        if (c === '\n' || c === void 0){
                            // ER: unclosed bold text
                            return false;
                        }
                        else if (!lastSpace && c === '*'){
                            i++;
                            if ((c = ch()) === '*'){
                                i++;
                                return makeStrong(content);
                            }
                        }
                        content += c;
                        lastSpace = c === '\n';
                        i++;
                        c = ch();
                    }
                }
            }
            else if (c !== ' ' && c !== void 0 && c !== '\n'){
                let content = '';
                let lastSpace = false;
                while (true){
                    if (c === '\n' || c === void 0){
                        // ER: unclosed bold text
                        return false;
                    }
                    else if (!lastSpace && c === '*'){
                        i++;
                        return makeItalic(content);
                    }
                    content += c;
                    lastSpace = c === '\n';
                    i++;
                    c = ch();
                }
            }
        }
        return false;
    }

    function parseMathjaxBlock(){
        let content = '$$';
        while (true){
            if ((c = ch()) === void 0){
                // ER: unclosed mathjax block
                return content;
            }
            else if (c === '$' && tryConsume('$$')){
                return content + '$$';
            }
            else
                content += c;
        }
    }

    function parseInlineMathjax(){
        while (true){
            if ((c = ch()) === void 0){
                // ER: unclosed inline mathjax
                return content;
            }
            else if (c === '$'){
                i++;
                return content + '$';
            }
        }
    }

    function parseCodeBlock(){

    }

    function parseInlineCode(){

    }

    function parseLineElements(){
        let ret = [];
        let c;
        while (true){
            if ((c = ch()) === '\n')
                break;
            else if (c === '*' && (italic = tryParse(parseItalicOrStrong))){
                ret.push(italic);
            }
            else if (c === '$'){
                i++;
                if ((c = ch()) === '$'){
                    i++;
                    ret.push(parseMathjaxBlock());
                }
                else {
                    ret.push(parseInlineMathjax());
                }
            }
            else {
                let content = '';
                while ((c = ch()) !== '*' && c !== '\n' && c !== void 0 && c !== '$'){
                    content += c;
                    i++;
                }
                let last = ret[ret.length - 1];
                if (typeof last === 'string'){
                    last += content;
                }
                else {
                    ret.push(content);
                }
            }
        }
        return ret;
    }

    function parseTable(){
        
    }

    function isListStart(){
        let c = ch();
    }

    function parseLine(){
        let c;
        if ((c = ch()) === '*'){

        }
        else
            return parseLineElements();
    }

    function parseParagraphOrHeading(prefix){
        while (true){
            let c = ch();
            let content = prefix | '';
            if (c === '\n'){
                i++;
                if ((c = ch()) === '\n'){
                    i++;
                    emitParagraph(content);
                }
            }
        }
    }

    function parseMarkdown(){
        tryParse(parseFrontMatter);
        allowQuote = true;
        while (ch() !== void 0){
            parseParagraphOrHeading();
        }
    }

    function tryConsume(str){
        let c = ch();
        tryParse(() => {
            for (let j = 0; j < str.length; j++){
                if (str.charAt(j) !== ch())
                    return false;
                i++;
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
        let allowQuote2 = allowQuote;
        let inHTML2 = inHTML;
        let token2 = token;
        let curLevel2 = curLevel;

        let ret = cb();
        if (ret === false) {
            // Restoring
            i = check;
            quoteLevel = quoteLevel2;
            allowQuote = allowQuote2;
            inHTML = inHTML2;
            token = token2;
            curLevel = curLevel2;
        }
        return ret;
    }
}