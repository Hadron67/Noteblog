'use strict';

exports.removeFromArray = function removeFromArray(a, item){
    let i = a.indexOf(item);
    for (; i < a.length - 1; i++){
        a[i] = a[i + 1];
    }
    a.pop();
}

exports.addOrdered = function addOrdered(array, item, comp){
    let i;
    for (i = 0; i < array.length; i++){
        if ((i === 0 || comp(item, array[i - 1])) && !comp(item, array[i])){
            break;
        }
    }
    array.push(null);
    for (let j = array.length - 1; j > i; j--){
        array[j] = array[j - 1];
    }
    array[i] = item;
    return array;
}

exports.regulateName = function regulateName(s){
    return s.toLowerCase().replace(/[ ]+/g, '-');
}