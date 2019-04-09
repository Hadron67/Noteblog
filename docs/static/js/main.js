(function(A, E){
    'use strict';
    var pwd = '/static/js/';
    var collapseBtn = A.getElementById('btn-collapse');
    var collapseList = A.getElementById('main-nav-list');
    var btnCloseMenu = A.getElementById('btn-close-menu');
    collapseBtn.addEventListener('click', function(){
        collapseList.classList.contains('show') ? collapseList.classList.remove('show') : collapseList.classList.add('show');
    });
    btnCloseMenu.addEventListener('click', function(){
        collapseList.classList.remove('show');
    });
    A.addEventListener('scroll', function(){

    });
})(document, window);