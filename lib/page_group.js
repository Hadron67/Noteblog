'use strict';
const event = require('events');

function changeSuffix(s, suf){
    return s.replace(/\..*$/, '.' + suf);
}

class PageGroup extends event.EventEmitter {
    constructor(ctx, pathBase){
        super();
        this.ctx = ctx;
        this.pathBase = pathBase;
        this.pageMap = {};
        this.pages = [];
        this.pageCount = 0;
        this.ready = false;

        this.comp = null;
    }
    registerAll(pages){
        for (let page of pages){
            if (page.isReady()){
                this.pageCount++;
                this.pageMap[page.id] = page;
            }
            page.on('update', page => {
                if (!this.pageMap.hasOwnProperty(page.id)){
                    this.pageMap[page.id] = page;
                    this.pageCount++;
                    if (!this.ready){
                        if (this.pageCount === pages.length){
                            this.ready = true;
                            this.emit('load', this);
                        }
                    }
                    else {
                        this.emit('update', this, page);
                    }
                }
                else {
                    this.pageMap[page.id] = page;
                    this.emit('update', this, page);
                }
            });
        }
        if (this.pageCount === pages.length){
            this.ready = true;
            this.emit('load', this);
        }
        return this;
    }
    doWhenReady(cb){
        if (this.ready){
            cb();
        }
        else
            this.once('load', cb);
    }
    _sortPages(comp){
        this.pages.length = 0;
        for (let id in this.pageMap){
            this.pages.push(this.pageMap[id]);
        }
        this.pages.sort(comp);
    }
    paginate(template, pathTemplate, comp, pagesPerPage){
        this.doWhenReady(() => {
            this._sortPages(comp);
            let page = 0, pageBase = 0;
            while (pageBase < this.pages.length){
                let pages = this.pages.slice(pageBase, pageBase + pagesPerPage);
                this.ctx.registerTemplate(pathTemplate(page + 1), template, pages);
                page++;
                pageBase += pagesPerPage;
            }
        });
        this.on('update', () => this._sortPages(comp));

        return this;
    }
}

module.exports = PageGroup;