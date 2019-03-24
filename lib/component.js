'use strict';

function createElement(name, attrs){
    let ret = new HTMLTag(name, attrs);
    for (let i = 2, _a = arguments; i < _a.length; i++){
        if (typeof _a[i] === 'function')
            _a[i](ret);
        else
            ret.append(_a[i]);
    }
    return ret;
}

const propNameTransforms = {
    'className': 'class'
};

function HTMLTag(name, attrs){
    this.name = name;
    this.classList = [];
    this.children = [];
    this.attrs = {};
    if (attrs){
        for (let name in attrs){
            let n = name;
            if (propNameTransforms.hasOwnProperty(n)){
                n = propNameTransforms[n];
            }
            this.attrs[n] = attrs[name];
        }
    }
}
/**
 * Append child element
 */
HTMLTag.prototype.append = function(el){
    this.children.push(el);
    return this;
}
/**
 * Create element and append as a child, return that child
 */
HTMLTag.prototype.e = function(name, attrs){
    let ret = new HTMLTag(name, attrs);
    for (let i = 0, _a = arguments; i < _a.length; i++){
        ret.append(_a[i]);
    }
    this.append(ret);
    return ret;
}
/**
 * Create element and append as a child, return `this`
 */
HTMLTag.prototype.l = function(name, attrs){
    let ret = new HTMLTag(name, attrs);
    for (let i = 0, _a = arguments; i < _a.length; i++){
        ret.append(_a[i]);
    }
    this.append(ret);
    return this;
}
HTMLTag.prototype.style = function(cname){
    this.classList.push(cname);
    return this;
}
HTMLTag.prototype.toString = function(){
    let attr = '', first = true;
    if (this.classList.length > 0){
        attr += ` class="${this.classList.join(' ')}"`;
    }
    for (let name in this.attrs){
        attr += ` ${name}="${this.attrs[name].toString()}"`;
    }
    if (this.children.length > 0){
        let child = '';
        for (let i = 0, _a = this.children; i < _a.length; i++){
            child += _a[i].toString();
        }
        return `<${this.name}${attr}>${child}</${this.name}>`;
    }
    else 
        return `<${this.name}${attr} />`;
}
function HTMLTagGenerator(){
    this.children = [];
}



function StyleSheet(classPrefix){
    this.classPrefix = classPrefix;
    this.classCount = 0;

    this.placeHolderRules = {};

    this.global = {};
    this.conditionals = [];
}
StyleSheet.prototype.toString = function(){
    let ret = '';
    function convertRule(selector, rule){
        let ret = '';
        for (let name in rule.rules){
            ret += `${name}:${rule.rules[name]};`;
        }
        ret = `${selector}{${ret}}`;
        for (let name in rule.subRules){
            ret += convertRule(name.replace('&', selector), rule.subRules[name]);
        }
        return ret;
    }
    function convertRuleList(list){
        let ret = '';
        for (let name in list){
            ret += convertRule(name, list[name]);
        }
        return ret;
    }
    ret += convertRuleList(this.global);
    for (let n of this.conditionals){
        ret += `${n.head}{${convertRuleList(n.rules)}}`;
    }
    return ret;
}
/*
    {
        '.hkm': {
            'width': '100px',
            'backgroud-color': '#c0c0c0',
            '&:hover': {
                'backgroud-color': '#f0f0f0'
            }
        },
        '@media (max-width: 500px)': {
            '.hkm': {
                width: '100%'
            }
        }
    }
*/
StyleSheet.prototype.load = function(sheet){
    let cela = this;
    let classes = {};
    let keyFrames = {};
    let placeHolders = {};
    let postActions = [];

    function convertToRule(rule){
        let ret = { rules: {}, subRules: {} };
        for (let name in rule){
            let v = rule[name];
            if (typeof v === 'string'){
                ret.rules[name] = v;
            }
            else {
                ret.subRules[name] = convertToRule(v);
            }
        }
        return ret;
    }

    function loadRules(ruleList, rules, top){
        for (let selector in rules){
            let c = selector.charAt(0);
            if (c === '.'){
                let className = selector.substr(1, selector.length - 1);
                let cl;
                if (classes.hasOwnProperty(className))
                    cl = classes[className];
                else
                    cl = classes[className] = `${cela.classPrefix}-${cela.classCount++}`;
                ruleList['.' + cl] = convertToRule(rules[selector]);
            }
            else if (c === '@'){
                if (!top)
                    throw new Error(`Selectors begin with @ can only appear in the outermost scope`);
                
            }
            else {
                ruleList[selector] = convertToRule(rules[selector]);
            }
        }
    }

    loadRules(this.global, sheet, true);

    return { classes };
}

function forEachNode(){
    this.children = [];
    
}

exports.StyleSheet = StyleSheet;
exports.spread = function(){
    let c = arguments;
    return elem => {
        for (let l of c){
            elem.append(l);
        }
    }
}
exports.createElement = createElement;
/*
{
    'div.{btn}': {
        '$1:hover': {
            '%flatten': 1
        }
    },
    '.{btn}': {

    },
    '@keyframes {f1}': {

    }
}
*/

function template(...list){
    let ret = [];

    function visit(array){
        for (let n of array){
            if (typeof n === 'function'){
                ret.push(n);
            }
            else if (!Array.isArray(n)){
                let last = ret[ret.length - 1];
                if (ret.length > 0 && typeof last === 'string'){
                    ret[ret.length - 1] += n.toString();
                }
                else
                    ret.push(n);
            }
            else
                visit(n);
        }
    }

    visit(list);
    return ret;
}

function render(list, args){
    if (typeof list === 'function'){
        return list(args);
    }
    else if (Array.isArray(list)){
        let ret = '';
        for (let n of list){
            if (typeof n === 'string'){
                ret += n;
            }
            else
                ret += n(args);
        }
        return ret;
    }
    else
        return list.toString();
}

function _for(opt, cb){
    let start = opt.start;
    let end = opt.end;
    let step = opt.step || 1;
    return arg => {
        let ret = '';
        for (let i = start; i < end; i += step){
            ret += render(cb(i), arg);
        }
        return ret;
    }
}

function _forOf(it, cb){
    return arg => {
        let ret = '';
        for (let i of it){
            ret += render(cb(i), arg);
        }
        return ret;
    }
}

function _forIn(obj, cb){
    return arg => {
        let ret = '';
        for (let k in obj){
            ret += render(cb(k, obj[k]), arg);
        }
    };
}



exports.template = template;
exports.render = render;
exports._for = _for;
exports._forIn = _forIn;
exports._forOf = _forOf;