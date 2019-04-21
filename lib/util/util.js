'use strict';
const fs = require('fs');
const Tags = require('./tags.js');
const Categorizer = require('./categorizer.js');
const Paginator = require('./paginator.js');
const {escapeHTML, escapeS} = require('./escape.js');
const {regulateName} = require('./funcs.js');


class PageGroup {
    constructor(ctx, onUpdate){
        this.ctx = ctx;
        this.onUpdate = onUpdate;
        this.pagesByID = {};
    }
    update(page){
        this.onUpdate(page, !this.pagesByID.hasOwnProperty(page.id));
        this.pagesByID[page.id] = page;
    }
    remove(page){
        delete this.pagesByID[page.id];
    }
    registerTemplate(path, template, arg){
        this.ctx.registerTemplate(path, template, merge({pages: this.pages}, arg));
    }
}

module.exports = ctx => {
    let ret = ctx.helper = {};

    ret.regulateName = regulateName;
    ret.escapeHTML = escapeHTML;
    ret.escapeS = escapeS;
    ret.createPaginator = (comp, template, pathTemplate, pagesPerPage, pathBase, arg) => new Paginator(ctx, comp, template, pathTemplate, pagesPerPage, pathBase, arg);
    ret.createTags = (pathBase, template, pathTemplate, comp, pagesPerPage, arg) => new Tags(ctx, pathBase, template, pathTemplate, comp, pagesPerPage, arg);
    ret.createCategorizer = (pathBase, template, pathTemplate, comp, pagesPerPage, arg) => new Categorizer(ctx, pathBase, template, pathTemplate, comp, pagesPerPage, arg);
    ret.createPageGroup = onUpdate => new PageGroup(ctx, onUpdate);

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

    ret.PageGroup = PageGroup;
}
