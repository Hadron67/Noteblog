'use strict';

module.exports = (...objs) => {
    let ret = {};
    for (let obj of objs){
        if (obj){
            for (let k in obj){
                ret[k] = obj[k];
            }
        }
    }
    return ret;
}