'use strict';

const regCapital = /[A-Z]/g;
class CSSRuleSet {
    constructor(){
        /** @type{{name: string, val: string}[]} */
        this.rules = [];
    }
    toString(){
        let ret = '';
        for (let r of this.rules){
            ret += `${r.name}:${r.val};`;
        }
        return ret;
    }
    addRule(name, val){
        name = name.replace(regCapital, s => '-' + s.toLowerCase());
        this.rules.push({ name, val });
    }
}

const regVar = /\$[a-zA-Z-_$]+/g;
const regPar = /\$\$/g;

class CSSStyleSheetSection { // Cross section? Of what? e^+e^- \to n\gamma ?
    constructor(sheet){
        /** @type{{selector: string, rule: CSSRuleSet}[]} */
        this.rules = [];
        /** @type{StyleSheet} */
        this.sheet = sheet;
    }
    toString(){
        let ret = '';
        for (let r of this.rules){
            ret += `${r.selector}{${r.rule.toString()}}`;
        }
        return ret;
    }

    addRule(selector, rules){
        let rs = new CSSRuleSet();
        selector = this.sheet._replaceWithVars(selector);
        this.rules.push({selector, rule: rs});
        for (let name in rules){
            let val = rules[name];
            if (typeof val === 'string'){
                rs.addRule(name, this.sheet._replaceWithVars(val));
            }
            else if (typeof val === 'object'){
                this.addRule(name.replace(regPar, selector), val);
            }
        }
        return rs;
    }
    loadRules(ruleObj){
        let ret = void 0;
        for (let name in ruleObj){
            let r = this.addRule(this.sheet._replaceWithVars(name), ruleObj[name]);
            if (ret === void 0){
                ret = r;
            }
            else if (ret !== null){
                ret = null;
            }
        }
        return ret;
    }
}

class StyleSheet {
    constructor(prefix = 'm4-css-var-'){
        this.varCounter = 0;
        this.prefix = prefix;

        /** @type{{[s: string]: number}[]} */
        this.vars = [{}];

        this.global = new CSSStyleSheetSection(this);
        /** @type{{head: string, ruleSection: CSSStyleSheetSection}[]} */
        this.environments = [];
    }
    toString(){
        let ret = this.global.toString();
        for (let e of this.environments){
            ret += `${e.head}{${e.ruleSection.toString()}}`;
        }
        return ret;
    }
    /**
     * @param {string} s 
     */
    _replaceWithVars(s){
        return s.replace(regVar, s => this.getVar(s.substr(1, s.length - 1)));
    }
    getVar(name){
        for (let _a = this.vars, i = _a.length - 1; i < _a.length; i++){
            if (_a[i].hasOwnProperty(name)){
                return _a[i][name];
            }
        }
        let last = this.vars[this.vars.length - 1];
        return last[name] = `${this.prefix}${this.varCounter++}`;
    }
    enterScope(){
        this.vars.push({});
    }
    leaveScope(){
        return { vars: this.vars.pop() };
    }
    newEnvironment(head){
        head = this._replaceWithVars(head);
        let ruleSection = new CSSStyleSheetSection(this);
        this.environments.push({head, ruleSection});
        return ruleSection;
    }
    load(sheetObj){
        for (let name in sheetObj){
            if (name.charAt(0) === '@'){
                this.newEnvironment(name).loadRules(sheetObj[name]);
            }
            else {
                this.global.addRule(name, sheetObj[name]);
            }
        }
    }
}

exports.StyleSheet = StyleSheet;

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