import $ from './tool';
import overlay from './overlay';

var searchPanel = $('#search-panel');
var btnSearch = $('#btn-search');
var input = $('#search-input');
var result = $('#search-result');

var search = {
    hide: function(){
        searchPanel.removeClass('show');
        overlay.hide();
    },
    show: function(){
        searchPanel.addClass('show');
        overlay.show();
    },
    isShowing: function(){
        return searchPanel.hasClass('show');
    }
};
overlay.$.click(function(){
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
        $.ajax({
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