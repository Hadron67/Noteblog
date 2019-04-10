(function(A, E){
    'use strict';
    var pwd = '/static/js/';
    function load(src, cb){
        var node = A.createElement('script');
        node.async = true;
        node.src = src;
        cb && node.addEventListener('load', cb);
        A.body.appendChild(node);
    }

    load(pwd + 'search.js');

    var collapseBtn = A.getElementById('btn-collapse');
    var collapseList = A.getElementById('main-nav-list');
    var btnCloseMenu = A.getElementById('btn-close-menu');
    var overlay = A.getElementById('overlay');
    var btnSearch = A.getElementById('btn-search');

    var search = A.getElementById('search-panel');

    function showMenu(){
        collapseList.classList.add('show');
        overlay.classList.add('show');
    }

    function hideMenu(){
        collapseList.classList.remove('show');
        overlay.classList.remove('show');
    }

    function isMenuShowing(){
        return collapseList.classList.contains('show');
    }

    function isSearchShowing(){
        return search.classList.contains('show');
    }

    function getPos(t){
        var ret = t.offsetTop;
        while (t.offsetParent){
            t = t.offsetParent;
            ret += t.offsetTop;
        }
        return ret;
    }

    collapseBtn.addEventListener('click', function(){
        showMenu();
    });
    btnCloseMenu.addEventListener('click', function(){
        hideMenu();
    });

    overlay.addEventListener('click', function(){
        if (isMenuShowing()){
            hideMenu();
        }
        if (isSearchShowing()){
            overlay.classList.remove('show');
            search.classList.remove('show');
        }
    });

    btnSearch.addEventListener('click', function(){
        search.classList.add('show');
        overlay.classList.add('show');
    });

    var nav = A.getElementById('main-nav');
    var navPos = getPos(nav);

    function fixHeading(){
        var pos = A.documentElement.scrollTop || A.body.scrollTop;
        if (pos > navPos){
            nav.classList.add('fixed');
        }
        else {
            nav.classList.remove('fixed');
            navPos = getPos(nav);
        }
    }

    A.addEventListener('scroll', function(e){
        fixHeading();
    });
    A.addEventListener('load', function(){
        fixHeading();
    });
})(document, window);