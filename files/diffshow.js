
function diffremain(fn, typ) {
    var p = "";
    if (fn in zipdata['diffhistory']) {
        var a = zipdata['diffhistory'][fn];
        if (a.length) {
            a = pako.ungzip(atob(a), {to: 'string'})
            a = JSON.parse(a)['d'];
            for (var k in a) {
                var v = a[k];
                var c = ["diffline"];
                if (v.startsWith("+++")) {
                    c.push("diffpossrc");
                } else if (v.startsWith("@@")) {
                    c.push("diffpos");
                } else if (v.startsWith("---")) {
                    c.push("diffposdst");
                } else if (v.startsWith("+")) {
                    c.push("diffadd");
                } else if (v.startsWith("-")) {
                    c.push("diffdel");
                }
                c = c.join(" ");
                p += "<span class=\""+c+"\">"+v+"</span>";
            }
        }
    }
    $("#fileview").html(p);
}

function diffremoved(fn, typ) {
}

function diffnew(fn, typ) {

}

function init_diff_tree(b,a) {
    var treear = new gen_tree('root')
    for (var v in a)
    {
        var e = a[v];
        na = e['path'].split("/");
        e.color = 0;
        if (ismember(e.attr.class,'diffnew')) {
            e.color = 0x4;
        } else if (ismember(e.attr.class,'diffremainchanged')) {
            e.color = 0x2;
        } else if (ismember(e.attr.class,'diffremoved')) {
            e.color = 0x1;
        }
        treear.gen(na, e);
    }
    var p = treear.html();
    $(b).append(p);
    treear.e.path = p;
    treear.reinstantiate(); // verify instantiation

    $(".diffnew").each(function(i,e) {
        propagate(e,0,0x10,0);
    });
    $(".diffremoved").each(function(i,e) {
        propagate(e,0x10,0,0);
    });
    $(".diffremainchanged").each(function(i,e) {
        propagate(e,0x10,0x10,0x10);
    });
    console.log(treear)
}
