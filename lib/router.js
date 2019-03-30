
'use strict';

function pathToRoute(route){
    if (typeof route === 'string'){
        return route.replace(/^\/|\/$/g, '').split('/');
    }
    else {
        return route;
    }
}
/** @typedef{{handler: FileHandler, subroutes: {[s: string]: RouteNode}}} RouteNode */

class PageRouter {
    constructor(){
        this.root = {handler: null, subroutes: {}};
    }
    addRoute(route, handler){
        route = pathToRoute(route);
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
        node.handler = null;
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
        return node.handler;
    }
    forEach(cb){
        let stack = [{node: this.root, path: []}];
        while (stack.length > 0){
            let top = stack.pop();
            if (top.node.handler && cb(top.path, top.node.handler))
                break;
            for (let name in top.node.subroutes){
                let node = top.node.subroutes[name];
                stack.push({node, path: top.path.concat([name])});
            }
        }
    }
}

module.exports = PageRouter;