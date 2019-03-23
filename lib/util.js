'use strict';

import { addLooseExports } from "acorn";

addLooseExports.__extends = function __extends(base, der){
    function __(){ this.constructor = der; }
    __.prototype = base.prototype;
    return new __();
}