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
    var overlays = A.getElementsByClassName('overlay');
    var btnSearch = A.getElementById('btn-search');
    var totop = A.getElementById('totop');

    var search = A.getElementById('search-panel');

    function showOverlay(){
        for (var i = 0, _a = overlays; i < _a.length; i++){
            _a[i].classList.add('show');
        }
    }

    function hideOverlay(){
        for (var i = 0, _a = overlays; i < _a.length; i++){
            _a[i].classList.remove('show');
        }
    }

    function showMenu(){
        collapseList.classList.add('show');
        showOverlay();
    }

    function hideMenu(){
        collapseList.classList.remove('show');
        hideOverlay();
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

    for (var i = 0, _a = overlays; i < _a.length; i++){
        _a[i].addEventListener('click', function(){
            if (isMenuShowing()){
                hideMenu();
            }
            if (isSearchShowing()){
                hideOverlay();
                search.classList.remove('show');
            }
        });
    }

    btnSearch.addEventListener('click', function(){
        search.classList.add('show');
        showOverlay();
    });

    var nav = A.getElementById('main-nav');
    var navPos = getPos(nav);

    function fixHeading(pos){
        if (pos > navPos){
            nav.classList.add('fixed');
        }
        else {
            nav.classList.remove('fixed');
            navPos = getPos(nav);
        }
    }

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

    A.addEventListener('scroll', function(e){
        var pos = A.documentElement.scrollTop || A.body.scrollTop;
        fixHeading(pos);
        // Schmitt trigger
        if (pos > 200 && !totop.classList.contains('show')){
            totop.classList.add('show');
        }
        if (pos < 150 && totop.classList.contains('show')){
            totop.classList.remove('show');
        }
    });
    A.addEventListener('load', function(){
        fixHeading();
    });
    totop.addEventListener('click', function(){
        var pos = A.documentElement.scrollTop || A.body.scrollTop;
        scrollToTop(pos);
    });

    fixHeading();
})(document, window);