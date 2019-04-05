
'use strict';

function pathToRoute(route){
    if (typeof route === 'string'){
        return route.replace(/^\/|\/$/g, '').split('/');
    }
    else {
        return route;
    }
}
/** @typedef{{name: string, data: FileHandler, subroutes: {[s: string]: RouteNode}}} RouteNode */

class PageRouter {
    constructor(){
        this.root = {name: '', data: null, subroutes: {}};
    }
    addRoute(route, data){
        route = pathToRoute(route);
        let node = this.root;
        for (let n of route){
            if (!node.subroutes.hasOwnProperty(n)){
                node = node.subroutes[n] = {name: n, data: null, subroutes: {}};
            }
            else {
                node = node.subroutes[n];
            }
        }
        if (node.data){
            throw new Error(`Path /${route.join('/')} already exists`);
        }
        node.data = data;
    }
    removeRoute(route){
        route = pathToRoute(route);
        /** @type{RouteNode[]} */
        let stack = [];
        let node = this.root;
        for (let n of route){
            if (!node.subroutes.hasOwnProperty(n)){
                return false;
            }
            else {
                stack.push(node);
                node = node.subroutes[n];
            }
        }
        node.data = null;
        while (stack.length > 0 && Object.keys(node.subroutes).length === 0){
            node = stack.pop();
            delete node.subroutes[route[stack.length]];
        }
        return true;
    }
    findRoute(route){
        route = pathToRoute(route);
        let node = this.root;
        for (let n of route){
            if (node.subroutes.hasOwnProperty(n)){
                node = node.subroutes[n];
            }
            else
                return null;
        }
        return node.data;
    }
    forEach(cb){
        let stack = [{node: this.root, path: []}];
        while (stack.length > 0){
            let top = stack.pop();
            if (top.node.data && cb(top.path, top.node.data))
                break;
            for (let name in top.node.subroutes){
                let node = top.node.subroutes[name];
                stack.push({node, path: top.path.concat([name])});
            }
        }
    }
}

module.exports = PageRouter;