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
                        }
                    }
                }
                else {
                    this.pageMap[page.id] = page;
                }
                this.emit('update', this, page);
            });
        }
        if (this.pageCount === pages.length){
            this.ready = true;
            this.emit('update', this);
        }
        return this;
    }
    sortPages(comp){
        this.pages.length = 0;
        for (let id in this.pageMap){
            this.pages.push(this.pageMap[id]);
        }
        this.pages.sort(comp);
    }
    getPages(){
        return this.pages;
    }
}

module.exports = PageGroup;