'use strict';
const fs = require('fs');
const Router = require('./router.js');
const event = require('events');

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

    ctx.helper.regulateName = regulateName;

    class PageGroup {
        constructor(onUpdate){
            this.onUpdate = onUpdate;
            this.pagesByID = {};
        }
        update(page){
            this.onUpdate(page, !this.pagesByID.hasOwnProperty(page.id));
            this.pagesByID[page.id] = page;
        }
    }

    ctx.helper.PageGroup = PageGroup;

    class PagesFragment {
        constructor(pages, start, end){
            this.pages = pages;
            this.start = start;
            this.end = end;
        }
        getPages(){
            return this.pages.slice(this.start, this.end);
        }
    }

    class Paginator {
        constructor(comp, template, pathTemplate, pagesPerPage, arg){
            this.pages = [];
            this.template = template;
            this.pathTemplate = pathTemplate;
            this.pagesPerPage = pagesPerPage;
            this.arg = arg;

            this.comp = comp;

            this._lastPaths = [];// Paths integral? (tao
        }
        register(path, pages){
            ctx.registerTemplate(path, this.template, {pages, arg: this.arg});
            return this;
        }
        add(page){
            addOrdered(this.pages, page, this.comp);
            return this;
        }
        remove(page){
            removeFromArray(this.pages, page);
            return this;
        }
        update(){
            let pageCount = Math.ceil(this.pages.length / this.pagesPerPage) | 0;
            while (this._lastPaths.length < pageCount){
                let i = this._lastPaths.length;
                let path = this.pathTemplate(i + 1);
                this._lastPaths.push(path);
                // let pages = this.pages.slice(i * this.pagesPerPage, (i + 1) * this.pagesPerPage);
                this.register(path, new PagesFragment(this.pages, i * this.pagesPerPage, (i + 1) * this.pagesPerPage));
            }
            while (this._lastPaths.length > pageCount){
                ctx.unregister(this._lastPaths.pop());
            }

            return this;
        }
    }

    ctx.helper.Paginator = Paginator;

    function appendPathTemplate(base, temp){
        return i => base + temp(i);
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

    class Tags {
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

            // this._pendingUpdates = [];
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
                    this.categories[c].add(page).update();
                    // this._pendingUpdates.push(ct.paginator);
                }
                else {
                    let paginator = new Paginator(
                        this.comp,
                        this.template, 
                        appendPathTemplate(this.pathBase + `/${regulateName(c)}`, this.pathTemplate), 
                        this.pagesPerPage, 
                        this.arg
                    );
                    paginator.add(page).update();
                    this.categories[c] = paginator;
                    // this._pendingUpdates.push(paginator);
                }
                pageCategories.push(c);
            }
            for (let c of deleted){
                let ct = this.categories[c];
                this.categories[c].remove(page).update();
                // this._pendingUpdates.push(ct.paginator);

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

    class Categorizer {
        constructor(pathBase, template, pathTemplate, comp, pagesPerPage, arg){
            this.categoryOfPages = {};

            this.pathBase = pathBase;
            this.template = template;
            this.pathTemplate = pathTemplate;
            this.comp = comp;
            this.pagesPerPage = pagesPerPage;
            this.arg = arg;

            let pages = [];
            let paginator = new Paginator(pages, template, pathTemplate, comp, arg);
            this.categories = {pages, paginator, subCategories: {}};
        }
        _createCategory(){
            let pages = [];
            let paginator = new Paginator(pages, template, pathTemplate, comp, arg);
            this.categories = {pages, paginator, subCategories: {}};
        }
        _categoryChanged(id, categoryPath){
            if (this.categoryOfPages.hasOwnProperty(id)){
                for (let i = 0, _a = this.categoryOfPages[id]; i < _a.length; i++){
                    if (categoryPath[i] !== _a[i]){
                        return true;
                    }
                }
            }
            else
                return true;
            return false;
        }
        _removePageFromCategory(){

        }
        update(page, categoryPath){
            if (this._categoryChanged(page.id, categoryPath)){
                // TODO: remove previously registered path
            }
            

        }
    };

    ctx.helper.Tags = Tags;
}
