'use strict';
const merge = require('./merge.js');
const {regulateName} = require('./funcs.js');
const Paginator = require('./paginator.js');

class CategoryNode{
    constructor(c, name, parent){
        this.name = name;
        this.parent = parent;
        this.subCategories = {};

        let path = c.pathBase;
        if (this.parent){
            path += this.getPath().map(p => regulateName(p.name)).join('/') + '/';
        }
        
        let arg = merge({node: this, pathBase: c.pathBase}, c.arg);
        this.paginator = new Paginator(
            c.ctx,
            c.comp, 
            c.template, 
            c.pathTemplate, 
            c.pagesPerPage, 
            path,
            arg
        );
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
    constructor(ctx, pathBase, template, pathTemplate, comp, pagesPerPage, arg){
        this.ctx = ctx;
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
    remove(page){
        if (this.categoryOfPages.hasOwnProperty(page.id)){
            this._removePageFromCategory(page, this.categoryOfPages[page.id]);
            delete this.categoryOfPages[page.id];
        }
    }
}


module.exports = Categorizer;