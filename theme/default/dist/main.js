(function (factory) {
    typeof define === 'function' && define.amd ? define(factory) :
    factory();
}(function () { 'use strict';

    // A minimum jQuery-like library

    function Element(elems){
        if (typeof elems === 'string'){
            var sub = elems.substr(1, elems.length - 1);
            if (elems.charAt(0) === '.'){
                this.elems = document.getElementsByClassName(sub);
            }
            else if (elems.charAt(0) === '#'){
                this.elems = [document.getElementById(sub)];
            }
            else {
                this.elems = document.getElementsByTagName(elems);
            }
        }
        else if (elems.length !== void 0){
            this.elems = elems;
        }
        else {
            this.elems = [elems];
        }
    }
    Element.prototype.forEach = function(cb){
        for (var i = 0, _a = this.elems; i < _a.length; i++){
            if (cb(_a[i], i)){
                return;
            }
        }
    };
    Element.prototype.addEventListener = function(event, s){
        this.forEach(function(e){
            e.addEventListener(event, s);
        });
        return this;
    };
    Element.prototype.click = function(s){
        return this.addEventListener('click', s);
    };
    Element.prototype.scroll = function(s){
        return this.addEventListener('scroll', s);
    };
    Element.prototype.load = function(s){
        return this.addEventListener('load', s);
    };
    Element.prototype.input = function(s){
        return this.addEventListener('input', s);
    };
    Element.prototype.hasClass = function(c){
        for (var i = 0, _a = this.elems; i < _a.length; i++){
            if (_a[i].classList.contains(c)){
                return true;
            }
        }
        return false;
    };
    Element.prototype.addClass = function(c){
        this.forEach(function(n){
            n.classList.add(c);
        });
    };
    Element.prototype.removeClass = function(c){
        this.forEach(function(n){
            n.classList.remove(c);
        });
    };
    Element.prototype.html = function(c){
        if (c === void 0){
            if (this.elems.length === 1){
                return this.elems[0].innerHTML;
            }
            else {
                ret = [];
                this.forEach(function(e){
                    ret.push(e.innerHTML);
                });
                return ret;
            }
        }
        else {
            this.forEach(function(e){
                e.innerHTML = c;
            });
        }
    };

    function fn(s){
        return new Element(s);
    }

    fn.ajax = function(arg){
        // var xhr = getXMLHttpRequest();
        var xhr = new XMLHttpRequest();
        xhr.open(arg.method || 'GET', arg.url, true);
        xhr.responseType = 'json';
        xhr.addEventListener('readystatechange', function(){
            if (xhr.readyState === XMLHttpRequest.DONE){
                if (xhr.status === 200 && arg.success){
                    arg.success(xhr.response);
                }
                else {
                    throw new Error(arg.url + ' responsed with ' + xhr.status + ' status');
                }
            }
            
        });
        xhr.send(null);
    };

    function getScrollPos(){
        return document.documentElement.scrollTop || document.body.scrollTop;
    }

    var totop = fn('#totop');

    function scrollToTop(pos){
        var div = 10, i = 0;
        var dh = pos / div;
        var interval = setInterval(function(){
            if (i >= div){
                clearInterval(interval);
            }
            window.scrollTo(0, Math.ceil(pos - dh * i++) | 0);
        }, 20);
    }

    totop.click(function(){
        scrollToTop(getScrollPos());
    });

    function getPos(t){
        var ret = t.offsetTop;
        while (t.offsetParent){
            t = t.offsetParent;
            ret += t.offsetTop;
        }
        return ret;
    }

    function fixHeading(pos){
        if (pos > navPos){
            nav.addClass('fixed');
        }
        else {
            nav.removeClass('fixed');
            navPos = getPos(nav.elems[0]);
        }
    }

    var nav = fn('#main-nav');

    var navPos = getPos(nav.elems[0]);

    function check(){
        var pos = getScrollPos();
        fixHeading(pos);
        // Schmitt trigger
        if (pos > 200 && !totop.hasClass('show')){
            totop.addClass('show');
        }
        if (pos < 150 && totop.hasClass('show')){
            totop.removeClass('show');
        }
    }
    fn(document).scroll(check).load(check);

    var overlay = fn('.overlay');

    var overlay$1 = {
        $: overlay,
        show: function(){
            overlay.addClass('show');
        },
        hide: function(){
            overlay.removeClass('show');
        },
        isShowing: function(){
            overlay.hasClass('show');
        }
    };

    var collapseBtn =  fn('#btn-collapse');
    var collapseList = fn('#main-nav-list');
    var btnCloseMenu = fn('#btn-close-menu');

    var menu = {
        show: function(){
            collapseList.addClass('show');
            overlay$1.show();
        },
        hide: function(){
            collapseList.removeClass('show');
            overlay$1.hide();
        },
        isShowing: function(){
            return collapseList.hasClass('show');
        }
    };

    collapseBtn.click(function(){
        menu.show();
    });
    btnCloseMenu.click(function(){
        menu.hide();
    });
    overlay$1.$.click(function(){
        if (menu.isShowing()){
            menu.hide();
        }
    });

    var searchPanel = fn('#search-panel');
    var btnSearch = fn('#btn-search');
    var input = fn('#search-input');
    var result = fn('#search-result');

    var search = {
        hide: function(){
            searchPanel.removeClass('show');
            overlay$1.hide();
        },
        show: function(){
            searchPanel.addClass('show');
            overlay$1.show();
        },
        isShowing: function(){
            return searchPanel.hasClass('show');
        }
    };
    overlay$1.$.click(function(){
        if (search.isShowing()){
            search.hide();
        }
    });
    btnSearch.click(function(){
        search.show();
    });

    var content = null;

    function doSearch(str, cb){
        if (content){
            str = new RegExp(str.replace(/[ ]+/g, '|'), 'gmi');
            var ret = [];
            for (var i = 0; i < content.length; i++){
                if (str.test(content[i].content)){
                    ret.push(content[i]);
                }
            }
            cb(ret);
        }
        else {
            fn.ajax({
                url: '/search/content.json',
                success: function(data){
                    content = data;
                    doSearch(str, cb);
                }
            });
        }
    }

    input.input(function(){
        var str = this.value.trim();
        if (str.length > 0){
            doSearch(str, function(r){
                var s = '';
                for (var i = 0; i < r.length; i++){
                    s += [
                        '<li>',
                            '<a href="' + r[i].path + '" class="search-result-entry">',
                                r[i].title,
                            '</a>',
                        '</li>'
                    ].join('');
                }
                result.html(s);
            });
        }
        else {
            result.html('');
        }
    });

    // var pwd = '/static/js/';
    // function load(src, cb){
    //     var node = A.createElement('script');
    //     node.async = true;
    //     node.src = src;
    //     cb && node.addEventListener('load', cb);
    //     A.body.appendChild(node);
    // }

    // load(pwd + 'search.js');
    // $.document.click();

    // var collapseBtn = A.getElementById('btn-collapse');
    // var collapseList = A.getElementById('main-nav-list');
    // var btnCloseMenu = A.getElementById('btn-close-menu');
    // var overlays = A.getElementsByClassName('overlay');
    // var btnSearch = A.getElementById('btn-search');
    // var totop = A.getElementById('totop');

    // var search = A.getElementById('search-panel');

    // function showOverlay(){
    //     for (var i = 0, _a = overlays; i < _a.length; i++){
    //         _a[i].classList.add('show');
    //     }
    // }

    // function hideOverlay(){
    //     for (var i = 0, _a = overlays; i < _a.length; i++){
    //         _a[i].classList.remove('show');
    //     }
    // }

    // function showMenu(){
    //     collapseList.classList.add('show');
    //     showOverlay();
    // }

    // function hideMenu(){
    //     collapseList.classList.remove('show');
    //     hideOverlay();
    // }

    // function isMenuShowing(){
    //     return collapseList.classList.contains('show');
    // }

    // function isSearchShowing(){
    //     return search.classList.contains('show');
    // }

    // function getPos(t){
    //     var ret = t.offsetTop;
    //     while (t.offsetParent){
    //         t = t.offsetParent;
    //         ret += t.offsetTop;
    //     }
    //     return ret;
    // }

    // collapseBtn.addEventListener('click', function(){
    //     showMenu();
    // });
    // btnCloseMenu.addEventListener('click', function(){
    //     hideMenu();
    // });

    // for (var i = 0, _a = overlays; i < _a.length; i++){
    //     _a[i].addEventListener('click', function(){
    //         if (isMenuShowing()){
    //             hideMenu();
    //         }
    //         if (isSearchShowing()){
    //             hideOverlay();
    //             search.classList.remove('show');
    //         }
    //     });
    // }

    // btnSearch.addEventListener('click', function(){
    //     search.classList.add('show');
    //     showOverlay();
    // });

    // var nav = A.getElementById('main-nav');
    // var navPos = getPos(nav);

    // function fixHeading(pos){
    //     if (pos > navPos){
    //         nav.classList.add('fixed');
    //     }
    //     else {
    //         nav.classList.remove('fixed');
    //         navPos = getPos(nav);
    //     }
    // }

    // function scrollToTop(pos){
    //     var div = 10, i = 0;
    //     var dh = pos / div;
    //     var interval = setInterval(function(){
    //         if (i >= div){
    //             clearInterval(interval);
    //         }
    //         window.scrollTo(0, Math.ceil(pos - dh * i++) | 0);
    //     }, 20);
    // }

    // A.addEventListener('scroll', function(e){
    //     var pos = A.documentElement.scrollTop || A.body.scrollTop;
    //     fixHeading(pos);
    //     // Schmitt trigger
    //     if (pos > 200 && !totop.classList.contains('show')){
    //         totop.classList.add('show');
    //     }
    //     if (pos < 150 && totop.classList.contains('show')){
    //         totop.classList.remove('show');
    //     }
    // });
    // A.addEventListener('load', function(){
    //     fixHeading();
    // });
    // totop.addEventListener('click', function(){
    //     var pos = A.documentElement.scrollTop || A.body.scrollTop;
    //     scrollToTop(pos);
    // });

    // fixHeading();

}));
