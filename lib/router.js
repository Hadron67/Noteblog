
'use strict';

class PageRouter {
    constructor(){
        /** @typedef{{handler: FileHandler, subroutes: {[s: string]: RouteNode}}} RouteNode */
        this.root = {handler: null, subroutes: {}};
    }
    _pathToRoute(route){
        if (typeof route === 'string'){
            return route.replace(/^\/|\/$/g, '').split('/');
        }
        else {
            return route;
        }
    }
    addRoute(route, handler){
        route = this._pathToRoute(route);
        let node = this.root;
        for (let n of route){
            if (!node.subroutes.hasOwnProperty(n)){
                node = node.subroutes[n] = {handler: null, subroutes: {}};
            }
            else {
                node = node.subroutes[n];
            }
        }
        if (node.handler){
            throw new Error(`Path /${route.join('/')} already has a handler`);
        }
        node.handler = handler;
    }
    findRoute(route){
        route = this._pathToRoute(route);
        let node = this.root;
        for (let n of route){
            if (node.subroutes.hasOwnProperty(n)){
                node = node.subroutes[n];
            }
            else
                return null;
        }
        return node.handler;
    }
    forEach(cb){
        let stack = [{node: this.root, path: '/'}];
        while (stack.length > 0){
            let top = stack.pop();
            if (cb(top.path, top.node.handler))
                break;
            for (let name in top.node.subroutes){
                let node = top.node.subroutes[name];
                stack.push({node, path: top.path + '/' + name});
            }
        }
    }
}

module.exports = PageRouter;