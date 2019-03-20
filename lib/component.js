'use strict';

function createElement(name, attrs){
    let ret = new HTMLTag(name, attrs);
    for (let i = 0, _a = arguments; i < _a.length; i++){
        this.append(_a[i]);
    }
    return ret;
}
function HTMLTag(name, attrs){
    this.parent = null;
    this.name = name;
    this.classList = [];
    this.attrs = attrs || {};
    this.children = [];
    for (let i = 0, _a = arguments; i < _a.length; i++){
        this.append(_a[i]);
    }
}
/**
 * Append child element
 */
HTMLTag.prototype.append = function(el){
    this.children.push(el);
    if (el instanceof HTMLTag)
        el.parent = this;
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

HTMLTag.prototype.end = function(){
    return this.parent;
}
HTMLTag.prototype.toString = function(){
    let attr = '', first = true;
    if (this.classList.length > 0){
        attr += `class="${this.classList.join(' ')}"`;
        first = false;
    }
    for (let name in this.attrs){
        if (!first) {
            attr += ' ';
        }
        else
            first = false;
        attr += `${name}="${this.attrs[name].toString()}"`;
    }
    if (this.children.length > 0){
        let child = '';
        for (let i = 0, _a = this.children; i < _a.length; i++){
            child += _a[i].toString();
        }
        return `<${this.name} ${attr}>${child}</${this.name}>`;
    }
    else 
        return `<${this.name} ${attr} />`;
}


let cssPropertyMacros = {};

function StyleSheet(classPrefix, keyFramePrefix){
    this.classCount = 0;
    this.classPrefix = classPrefix || 'class';

    this.keyFramePrefix = keyFramePrefix || 'keyframe';

    this.global = new CSSRuleSetMap(this);
    this.keyFrames = [];
    this.conditionals = [];
}
StyleSheet.prototype.toString = function(){
    let ret = '';
    ret += this.global.toString();
    for (let i = 0, _a = this.keyFrames; i < _a.length; i++){
        let c = `${this.keyFramePrefix}-${i}{${_a[i].toString()}}`;
        ret += `@keyframes ${c}`;
        ret += `@-webkit-keyframes ${c}`;
        ret += `@-moz-keyframes ${c}`;
    }
    for (let c of this.conditionals){
        ret += `@${c.head}{${c.ruleSets}}`;
    }
    return ret;
}
StyleSheet.prototype.g = function(){ return this.global; }
StyleSheet.prototype.at = function(head){
    if (head === 'keyframes'){
        let keyFrames = new KeyFrames();
        let name = `${this.keyFramePrefix}-${this.keyFrames.length}`;
        this.keyFrames.push(keyFrames);
        return { name, keyFrames };
    }
    else {
        let ruleSets = new CSSRuleSetMap(this);
        this.conditionals.push({ head, ruleSets });
        return ruleSets;
    }
}

function KeyFrames(){
    this.keyFrames = [];
}
KeyFrames.prototype.toString = function(){
    let ret = '';
    for (let k of this.keyFrames){
        ret += k.content.toString(k.head);
    }
    return ret;
}
KeyFrames.prototype.load = function(fr){
    for (let head in fr){
        this.keyFrames.push({ head, content: new CSSRuleSet().load(fr[head]) });
    }
}

function CSSRuleSetMap(sheet){
    this.sheet = sheet;
    this.ruleSets = [];
}
CSSRuleSetMap.prototype.load = function(sets){
    for (let selector in sets){
        this.ruleSets.push({ selector, ruleSet: new CSSRuleSet().load(sets[selector]) });
    }
    return this;
}
/**
 * Create a rule set with class selector
 */
CSSRuleSetMap.prototype.cl = function(rules){
    let className = `.${this.sheet.classPrefix}-${this.sheet.classCount++}`;
    rules = this.se(className, rules);
    return { className, rules };
}
/**
 * Create a rule set with the given selector
 */
CSSRuleSetMap.prototype.se = function(selector, rules){
    let ruleSet = new CSSRuleSet().load(rules);
    this.ruleSets.push({ selector, ruleSet });
    return ruleSet;
}
CSSRuleSetMap.prototype.toString = function(){
    let ret = '';
    for (let l of this.ruleSets){
        ret += l.ruleSet.toString(l.selector);
    }
    return ret;
}

function CSSRuleSet(parent){
    this.rules = {};
    this.parent = parent || null;
    this.ref = false;
    this.subRules = {};

    this.inMacro = false;
}
CSSRuleSet.prototype.loadRule = function(name, val){
    if (!this.inMacro && cssPropertyMacros.hasOwnProperty(name)) {
        this.inMacro = true;
        cssPropertyMacros[name](this, name, val);
        this.inMacro = false;
    }
    else if (name === '!extends'){
        this.parent = val;
    }
    else if (name.charAt(0) === '!'){
        this.subRules[name.substr(1, name.length - 1)] = new CSSRuleSet(this).load(val);
    }
    else
        this.rules[name] = val.toString();
    return this;
}
CSSRuleSet.prototype.load = function(rules){
    for (let name in rules){
        this.loadRule(name, rules[name]);
    }
    return this;
}
CSSRuleSet.prototype.ruleText = function(){
    let r = this, ret = '';
    while (r){
        for (let name in r.rules){
            ret += `${name}:${r.rules[name]};`;
        }
        r = r.parent;
    }
    return ret;
}
CSSRuleSet.prototype.toString = function(selectorName){
    if (selectorName === void 0) selectorName = '.default';
    let ret = `${selectorName}{${this.ruleText()}}`;
    for (let name in this.subRules){
        ret += this.subRules[name].toString(selectorName + name);
    }
    return ret;
}

exports.createElement = createElement;
exports.StyleSheet = StyleSheet;
exports.defineCSSMacro = function(name, cb){
    cssPropertyMacros[name] = cb;
}

/*

    {
        'div': {
            '&:hover': {
                
            }
        }
    }
*/