'use strict';
const fs = require('fs');
const Router = require('./router.js');
const event = require('events');
const merge = require('./merge.js');

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
    let ret = ctx.helper = {
        escapeS,
        escapeHTML
    };

    ret.registerModule = function(src){
        return new Promise((resolve, reject) => {
            ctx.registerModule(src, ctx => resolve());
        });
    }
    ret.readFiles = function(dir, firstFile = ''){
        return new Promise((resolve, reject) => {
            fs.readdir(dir, (err, files) => {
                if (err){
                    reject(err);
                    return;
                }
                let ret = [];
                if (files.length === 0){
                    resolve(ret);
                }
                let count = 0;
                for (let file of files){
                    fs.stat(dir + '/' + file, (err, stat) => {
                        count++;
                        if (!err && stat.isFile()){
                            ret.push(file);
                            if (count === files.length){
                                let i = ret.indexOf(firstFile);
                                if (i !== -1 && i !== 0){
                                    let t = ret[i];
                                    ret[i] = ret[0];
                                    ret[0] = t;
                                }
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

    ret.regulateName = regulateName;

    class PageGroup {
        constructor(onUpdate){
            this.onUpdate = onUpdate;
            this.pagesByID = {};
        }
        update(page){
            this.onUpdate(page, !this.pagesByID.hasOwnProperty(page.id));
            this.pagesByID[page.id] = page;
        }
        registerTemplate(path, template, arg){
            ctx.registerTemplate(path, template, merge({pages: this.pages}, arg));
        }
    }

    ret.PageGroup = PageGroup;

    class PagesFragment {
        constructor(pagePaths, index, pages, start, end){
            this.pagePaths = pagePaths;
            this.index = index;
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

            this.hasOtherContent = false;

            this.comp = comp;

            this._lastPaths = [];// Paths integral? (tao
        }
        register(path, pages){
            ctx.registerTemplate(path, this.template, merge({pages, path}, this.arg));
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
            if (this.hasOtherContent && pageCount === 0){
                pageCount = 1;
            }
            while (this._lastPaths.length < pageCount){
                let i = this._lastPaths.length;
                let path = this.pathTemplate(i + 1);
                this._lastPaths.push(path);
                this.register(path, new PagesFragment(this._lastPaths, i, this.pages, i * this.pagesPerPage, (i + 1) * this.pagesPerPage));
            }
            while (this._lastPaths.length > pageCount){
                ctx.unregister(this._lastPaths.pop());
            }

            return this;
        }
        size(){ return this.pages.length; }
    }

    ret.Paginator = Paginator;

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
                        appendPathTemplate(this.pathBase + `${regulateName(c)}/`, this.pathTemplate), 
                        this.pagesPerPage, 
                        merge(this.arg, {tag: c})
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
        registerTemplate(path, temp, arg){
            ctx.registerTemplate(path, temp, merge({tags: this.categories}, arg));
        }
    }

    class CategoryNode{
        constructor(c, name, parent){
            this.name = name;
            this.parent = parent;
            this.subCategories = {};

            let path = c.pathBase;
            // if (parent && parent.parent){
            //     path += '/' + parent.getPath().map(p => regulateName(p.name)).join('/');
            // }
            // if (name)
            //     path += '/' + regulateName(name);
            if (this.parent){
                path += this.getPath().map(p => regulateName(p.name)).join('/') + '/';
            }
            
            let arg = merge({node: this, pathBase: c.pathBase}, c.arg);
            this.paginator = new Paginator(c.comp, c.template, appendPathTemplate(path, c.pathTemplate), c.pagesPerPage, arg);
            this.paginator.hasOtherContent = true;
            this.paginator.update();
        }
        getPages(){
            return this.paginator.pages;
        }
        getPath(){
            let ret = [];
            let n = this;
            while (n.parent){
                ret.unshift(n);
                n = n.parent;
            }
            return ret;
        }
        getSubcategories(){
            return Object.keys(this.subCategories);
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

            this.categorieyRoot = this._createCategory(null, null);
        }
        _createCategory(name, parent){
            return new CategoryNode(this, name, parent);
        }
        _categoryChanged(id, categoryPath){
            if (!categoryPath){
                return true;
            }
            if (this.categoryOfPages.hasOwnProperty(id)){
                let orig = this.categoryOfPages[id];
                if (orig.length !== categoryPath.length){
                    return true;
                }
                for (let i = 0, _a = orig; i < _a.length; i++){
                    if (categoryPath[i] !== _a[i]){
                        return true;
                    }
                }
            }
            else
                return true;
            return false;
        }
        _removePageFromCategory(page, categoryPath){
            let n = this.categorieyRoot;
            for (let c of categoryPath){
                if (n.subCategories.hasOwnProperty(c)){
                    n = n.subCategories[c];
                }
                else {
                    throw new Error(`Category ${categoryPath.join('/')} not found, which shouldn't happen!`);
                }
            }
            n.paginator.remove(page).update();
            while (n.paginator.size() === 0 && Object.keys(n.subCategories).length === 0 && n !== this.categorieyRoot){
                let name = n.name;
                n.paginator.hasOtherContent = false;
                n.paginator.update();
                n = n.parent;
                delete n.subCategories[name];
            }
        }
        _addPage(page, categoryPath){
            let n = this.categorieyRoot;
            for (let c of categoryPath){
                if (n.subCategories.hasOwnProperty(c)){
                    n = n.subCategories[c];
                }
                else {
                    n = n.subCategories[c] = this._createCategory(c, n);
                }
            }
            n.paginator.add(page).update();
        }
        update(page, categoryPath){
            if (this._categoryChanged(page.id, categoryPath)){
                if (this.categoryOfPages.hasOwnProperty(page.id)){
                    this._removePageFromCategory(page, this.categoryOfPages[page.id]);
                }
                categoryPath && this._addPage(page, categoryPath);
            }
            if (categoryPath){
                this.categoryOfPages[page.id] = categoryPath;
            }
            else {
                delete this.categoryOfPages[page.id];
            }
        }
    }

    ret.Tags = Tags;
    ret.Categorizer = Categorizer;
}
