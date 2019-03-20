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
        while (true){
            let c = ch();
            if (c === void 0) {
                // unclosed front matter, quit
                break;
            }
            else if (c === '-'){
                i++;
                if ((c = ch()) === '-'){
                    i++;
                    if ((c = ch()) === '-'){
                        i++;
                        break;
                    }
                    else
                        frontMatter += '--';
                }
                else 
                    frontMatter += '-';
            }
            else
                frontMatter += c;
        }
    }

    function parseList(listChar){

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
        let c = ch();
        if (c === '-'){
            i++;
            if ((c = ch()) === '-'){
                i++;
                if ((c = ch()) === '-'){
                    i++;
                    parseFrontMatter();
                }
                else
                    parseParagraphOrHeading('--');
            }
            else if (c === ' ') {
                i++;
                parseList();
            }
            else
                parseParagraphOrHeading('-');
        }
        while (ch() !== void 0){
            parseParagraphOrHeading();
        }
    }
}