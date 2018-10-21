
function decodeFn(fn) {
    if (fn in zipdata) {
        var data = zipdata[fn]
        var x = pako.ungzip(atob(data), {to: 'string'})
        return x;
    }
    return "not found: '" + fn + "'";
}

window.onload = function () {
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

function openfn(fn, ln) {
    var x = decodeFn(fn);
    $("#fileview").each(function() {
        $(this).html(x);
    });
    var all = $("span.code").each(function() {
        console.log($(this).text());
    });

    $("#fninfo").text(fn);
    setTimeout(function(){
        var id = '#line'+ln;
        $('#line'+ln).each(function(i) {
            console.log(this);
            $(this).css('background-color', 'powderblue');
            $(this)[0].scrollIntoView();
        });
    }, 500);
}

function openProjElem(fn, ln) {
    if (fn in assignpages) {
        var v = assignpages[fn];
        $("#fileview").each(function() {
            $(this).html(v);
        });
    }
}
