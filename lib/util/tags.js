const {removeFromArray, regulateName} = require('./funcs.js');
const merge = require('./merge.js');
const Paginator = require('./paginator.js');
const pathd = require('path');

class Tags {
    constructor(ctx, pathBase, template, pathTemplate, comp, pagesPerPage, arg){
        /** @type{{[s: string]: string[]}} */
        this.ctx = ctx;
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
    remove(page){
        if (this.categoryOfPages.hasOwnProperty(page.id)){
            let pageCategories = this.categoryOfPages[page.id];
            for (let c of pageCategories){
                this.removePageFromTag(page, c);
            }
            delete this.categoryOfPages[page.id];
        }
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
            }
            else {
                let paginator = new Paginator(
                    this.ctx,
                    this.comp,
                    this.template, 
                    this.pathTemplate, 
                    this.pagesPerPage, 
                    // this.pathBase + `${regulateName(c)}/`,
                    pathd.join(this.pathBase, regulateName(c), '/'),
                    merge(this.arg, {tag: c})
                );
                paginator.add(page).update();
                this.categories[c] = paginator;
            }
            pageCategories.push(c);
        }
        for (let c of deleted){
            removeFromArray(pageCategories, c);
            this.removePageFromTag(page, c);
        }
    }
    removePageFromTag(page, tag){
        let ct = this.categories[tag];
        ct.remove(page).update();
        if (ct.size() === 0){
            delete this.categories[tag];
        }

        // removeFromArray(pageCategories, tag); 
    }
    registerTemplate(path, temp, arg){
        this.ctx.pageRegistry.registerTemplate(path, temp, merge({tags: this.categories}, arg));
    }
}

module.exports = Tags;