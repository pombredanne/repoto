function decodeFn(fn) {
    fn = fn + ".html";
    if (fn in zipdata) {
        var data = zipdata[fn]
        var x = data;
        //var x = pako.ungzip(atob(data), {to: 'string'})
        return x;
    }
    return "not found: '" + fn + "'";
}

window.onload = function () {
    collapseAll();
    $.fx.off = true;
    $(function() {
        // Find list items representing folders and
        // style them accordingly.  Also, turn them
        // into links that can expand/collapse the
        // tree leaf.
        $('.menu-tree li > ul').each(function(i) {
            // Find this list's parent list item.
            var parent_li = $(this).parent('li');

            // Temporarily remove the list from the
            // parent list item, wrap the remaining
            // text in an anchor, then reattach it.
            var sub_ul = $(this).remove();
            parent_li.wrapInner('<a/>').find('a').click(function() {
                // Make the anchor toggle the leaf display.
                sub_ul.toggle(300);

                //Add class to change folder image when clicked on
                $(this).find('span:first-child').toggleClass('expanded');

            });
            parent_li.append(sub_ul);
        });
        // Hide all lists except the outermost.
        //$('.menu-tree ul ul').hide();
    });
    //$("#browser").resizable();
}

function expandAll(fn, ln) {
    $('.menu-tree li > ul').each(function(i) {
        $(this).show();
    });
    $(".menu-tree").find("span").addClass("expanded");
}

function collapseAll(fn, ln) {
    $('.menu-tree li > ul').each(function(i) {
        $(this).hide();
    });
    $(".menu-tree").find("span").removeClass("expanded");
}

function openfn_(elem, statuselem, fn, ln) {
    var x = "<hr>" + decodeFn(fn);
    $("#"+elem).each(function() {
        $(this).html(x);
    });
    var all = $("span.code").each(function() {
        //console.log($(this).text());
    });
    if (statuselem !== undefined) {
        $("#"+statuselem).text(fn);
    }
    setTimeout(function(){
        var id = '#line'+ln;
        $('#line'+ln).each(function(i) {
            //console.log(this);
            $(this).css('background-color', 'powderblue');
            $(this)[0].scrollIntoView({block: "center"});
        });
    }, 500);
}

function openfn_append(elem, fn) {
    var x = decodeFn(fn);
    $("#"+elem).each(function() {
        $(this).append("<br><hr>");
        $(this).append(x);
    });
    var all = $("span.code").each(function() {
        //console.log($(this).text());
    });
}

function  openoption(fn, option, arg2)
{
    if (!(fn in options && option in options[fn])) {
        return
    }
    var params = options[fn][option];
    console.log(params)
    var m = "<strong>"+option+" </strong><table>";
    for (i in params) {
        m += "<tr><td>"+i+ "</td><td>" + params[i] + "</td></tr>";
    }
    m += "</table>";
    $("#detailfninfo").html(m);
}

function openfn(fn, ln) {
    openfn_("fileview", "fninfo", fn, ln);
}

function osnippet(snippet, fn, ln) {
    openfn_("fileview", "fninfo", fn, ln);
    openfn_("detailfileview", "detailfileinfo", snippet, ln);
    setTimeout(function(){
        var id = '#line'+ln;
        $('#line'+ln).each(function(i) {
            //console.log(this);
            $(this).css('background-color', 'powderblue');
            $(this)[0].scrollIntoView({block: "center"});
        });
    }, 500);
    openoption(fn,ln);
}

function opensearch(tag, dstfile) {
    openfn_("detailfileview", "detailfileinfo", "searchpage_"+tag, "");

    openfn_append("detailfileview", dstfile);
}

function opencopyfile(fn,opt,cf,tag,nln,dstfile) {
    openfn_("fileview", "fninfo", fn, opt);
    openoption(cf, opt, "");
    opensearch(tag, dstfile)
}

function openSearchResult(fn,fnr) {
    openfn_("fileview", "fninfo", fn, fnr);
}


