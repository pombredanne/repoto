
function decodeFn(fn) {
    fn = fn + ".html";
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

function openfn_(elem, statuselem, fn, ln) {
    var x = decodeFn(fn);
    $("#"+elem).each(function() {
        $(this).html(x);
    });
    var all = $("span.code").each(function() {
        console.log($(this).text());
    });
    if (statuselem !== undefined) {
        $("#"+statuselem).text(fn);
    }
    setTimeout(function(){
        var id = '#line'+ln;
        $('#line'+ln).each(function(i) {
            console.log(this);
            $(this).css('background-color', 'powderblue');
            $(this)[0].scrollIntoView({block: "center"});
        });
    }, 500);
}

function openfn(fn, ln) {
    openfn_("fileview", "fninfo", fn, ln);
}

var stackframetmp = {}
var stackframetmpidx = 1;

function openStackFrame(fn, ln) {
    if (fn in stackmap) {
        fn = stackmap[fn];
    }
    openfn_("detailfileview", "detailfninfo", fn, ln);
}

function selectStackFrame(fn, ln) {
    if (fn in stackmap) {
        fn = stackmap[fn];
    }
    openfn_("detailfileview", undefined, fn, ln);
}

function openStackFrameBt(fn, ln, backtrace) {
    openStackFrame(fn, ln);
    if (fn in stackmap) {
        fn = "<strong>"+stackmap[fn]+"</strong>";
    }
    if (backtrace in stackframetmp) {
        var b = stackframetmp[backtrace];
        var b_ = b.slice();
        b_.unshift(fn);
        var v = b_.join("<br>");
        $("#detailfninfo").html(v);
    }
}

function sub_links(e) {
    var reright = /^(.*) : (.*)$/m;
    var p = "";
    do {
        m = reright.exec(e);
        if (m) {
            p += "<span class='assign'>";
            var bk = m[1].trim().split(/\s+/);
            var b = [];
            for (var j in bk) {
                var i = bk[j];
                var n = i.split(":");
                if (n.length == 3) {
                    fid = n[0]; //parseInt(m[1],10);
                    if (fid in stackmap) {
                        fid = stackmap[fid];
                    }
                    var ctx = ""
                    if (n[2] in ctxmap) {
                        ctx = ctxmap[n[2]];
                    }
                    fnr = n[1]; //parseInt(m[2],10);
                    p += "<a onClick='openStackFrameBt("+n[0]+","+fnr+","+stackframetmpidx+")'>" + i + "</a> ";
                    if (ctx.length > 128) {
                        ctx = ctx.substr(0,128) + "...";
                    }
                    b.push("<a onClick='selectStackFrame("+n[0]+","+fnr+")'>" + fid + ":" + fnr + ":" + ctx + "</a> ");
                }
            }
            stackframetmp[stackframetmpidx++] = b;

            ln = m[2]; //parseInt(m[1],10);
            p += " : ";
            p += "<code onClick='valueTable(this)'>" + m[2] + "</code>";
            p += "</span>";
            e = e.substr(m.index+m[0].length);
        }
    } while (m);

    return p+e;
}

function openProjElem(fn, ln) {
    if (fn in assignpages) {
        var v = assignpages[fn];
        v = sub_links(v);
        $("#fileview").each(function() {
            $(this).html(v);
        });
    }
}

function valueTable(e) {
    v = $(e).text();
    console.log(v);
    a = v.split(/\s+/);
    v = a.sort().join("<br>");
    $("#detailfileview").html(v);
}
