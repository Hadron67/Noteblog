const {removeFromArray, addOrdered} = require('./funcs.js');
const merge = require('./merge.js');

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
    constructor(ctx, comp, template, pathTemplate, pagesPerPage, pathBase, arg){
        this.ctx = ctx;
        this.pages = [];
        this.template = template;
        this.pathTemplate = pathTemplate;
        this.pagesPerPage = pagesPerPage;
        this.pathBase = pathBase;
        this.arg = arg;

        this.hasOtherContent = false;

        this.comp = comp;

        this._lastPaths = [];// Paths integral? (tao
    }
    register(path, pages){
        this.ctx.registerTemplate(path, this.template, merge({pages, path}, this.arg));
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
            let path = this.pathBase + this.pathTemplate(i + 1);
            this._lastPaths.push(path);
            this.register(path, new PagesFragment(this._lastPaths, i, this.pages, i * this.pagesPerPage, (i + 1) * this.pagesPerPage));
        }
        while (this._lastPaths.length > pageCount){
            this.ctx.unregister(this._lastPaths.pop());
        }

        return this;
    }
    size(){ return this.pages.length; }
}

module.exports = Paginator;

// module.exports = ctx => {
//     let ret = ctx.helper;

   
//     ret.Paginator = Paginator;
// };