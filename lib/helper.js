'use strict';
const fs = require('fs');

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

module.exports = ctx => {
    ctx.helper = {
        escapeS,
        escapeHTML
    };

    ctx.helper.registerModule = function(src){
        return new Promise((resolve, reject) => {
            ctx.registerModule(src, ctx => resolve());
        });
    }
    ctx.helper.readFiles = function(dir){
        return new Promise((resolve, reject) => {
            fs.readdir(dir, (err, files) => {
                if (err){
                    reject(err);
                    return;
                }
                let ret = [];
                let count = 0;
                for (let file of files){
                    fs.stat(dir + '/' + file, (err, stat) => {
                        count++;
                        if (!err && stat.isFile()){
                            ret.push(file);
                            if (count === files.length){
                                resolve(ret);
                            }
                        }
                    });
                }
            });
        });
    }

    function regulateName(s){
        return s.toLowerCase().replace(/[ ]+/g, '-');
    };

    ctx.helper.regulateName = regulateName;;

    class Paginator {
        constructor(pages, template, pathTemplate, pagesPerPage, arg){
            this.pages = pages;
            this.template = template;
            this.pathTemplate = pathTemplate;
            this.pagesPerPage = pagesPerPage;
            this.arg = arg;

            this._lastPaths = [];// Paths integral? (tao
        }
        update(){
            let pageCount = Math.ceil(this.pages.length / this.pagesPerPage) | 0;
            while (this._lastPaths.length < pageCount){
                let i = this._lastPaths.length;
                let path = this.pathTemplate(i + 1);
                this._lastPaths.push(path);
                let pages = this.pages.slice(i * this.pagesPerPage, (i + 1) * this.pagesPerPage);
                // let start = i * this.pagesPerPage;
                // let end = (i + 1) * this.pagesPerPage;
                ctx.registerTemplate(path, this.template, {pages: this.pages, arg: this.arg});
            }
            while (this._lastPaths.length > pageCount){
                ctx.unregister(this._lastPaths.pop());
            }
        }
    }

    ctx.helper.Paginator = Paginator;

    /* 
        {
            "654189871a9871d987c1d": [
                "General relativity",
                "Differential geometry"
            ]
        }
    */

    function appendPathTemplate(base, temp){
        return i => base + temp(i);
    }

    function nonNegative(a){
        if (a < 0){
            throw new Error('This argument shoud be non-negative');
        }
        return a;
    }

    function removeFromArray(a, item){
        let i = a.indexOf(item);
        for (; i < a.length - 1; i++){
            a[i] = a[i + 1];
        }
        a.pop();
    }

    function addOrdered(array, item, comp){
        let i;
        for (i = 0; i < array.length; i++){
            if ((i === 0 || comp(item, array[i - 1])) && !comp(item, array[i])){
                break;
            }
        }
        array.push(null);
        for (let j = array.length - 1; j > i; j--){
            array[j] = array[j - 1];
        }
        array[i] = item;
        return array;
    }

    class Categorizer {
        constructor(pathBase, template, pathTemplate, comp, pagesPerPage, arg){
            /** @type{{[s: string]: string[]}} */
            this.categoryOfPages = {};
            this.categories = {};

            this.pathBase = pathBase;
            this.template = template;
            this.pathTemplate = pathTemplate;
            this.pagesPerPage = pagesPerPage;
            this.comp = comp;
            this.arg = arg;

            this._pendingUpdates = [];
        }
        _diffCategory(pageID, categories){
            let added = [], deleted = [];
            let old;
            if (this.categoryOfPages.hasOwnProperty(pageID)){
                old = this.categoryOfPages[pageID];
            }
            else {
                old = [];
            }
            for (let p1 of old){
                if (categories.indexOf(p1) === -1){
                    deleted.push(p1);
                }
            }
            for (let p1 of categories){
                if (old.indexOf(p1) === -1){
                    added.push(p1);
                }
            }
            return { added, deleted };
        }
        update(page, categories){
            let { added, deleted } = this._diffCategory(page.id, categories);
            let pageCategories;
            if (this.categoryOfPages.hasOwnProperty(page.id)){
                pageCategories = this.categoryOfPages[page.id];
            }
            else {
                pageCategories = this.categoryOfPages[page.id] = [];
            }
            for (let c of added){
                if (this.categories.hasOwnProperty(c)){
                    let ct = this.categories[c];
                    addOrdered(ct.pages, page, this.comp);
                    this._pendingUpdates.push(ct.paginator);
                }
                else {
                    let pages = [page];
                    let paginator = new Paginator(
                        pages, 
                        this.template, 
                        appendPathTemplate(this.pathBase + `/${regulateName(c)}`, this.pathTemplate), 
                        this.pagesPerPage, 
                        this.arg
                    );
                    this.categories[c] = { pages, paginator };
                    this._pendingUpdates.push(paginator);
                }
                pageCategories.push(c);
            }
            for (let c of deleted){
                let ct = this.categories[c];
                removeFromArray(ct.pages, page);
                this._pendingUpdates.push(ct.paginator);

                removeFromArray(pageCategories, c);
            }
        }
        commitUpdate(){
            for (let c of this._pendingUpdates){
                c.update();
            }
            this._pendingUpdates.length = 0;
        }
    }

    ctx.helper.Categorizer = Categorizer;
}
