
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
