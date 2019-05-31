
function idify(a) {
    var r = [];
    for (var i of a) {
        var j = h(i);
        r.push(j);
    }
}

function unidify(d, a, b) {
    var a_i = 0;
    var b_i = 0;
    var r = [];
    for (i of d) {
        if (i.added && ! i.removed) {
            r.push([b[b_i++], undefined]);
        } else if (!i.added &&i.removed) {
            r.push([undefined,a[a_i++]]);
        } else if  (!i.added && !i.removed) {
            r.push([b[b_i++],a[a_i++]]);
        } else {
            throw Error("Undef");
        }
    }
    return r;
}

function initrc_diff_tree(e, a, b) {
    var treear = new gen_tree('root');
    var seq = {}

    for (var i of [ 'early-boot', 'boot', 'init' ]) {


        seq[i] = {};
        a_v = extract(i, a);
        b_v = extract(i, b);
        seq[i]['a'] = a_v;
        seq[i]['b'] = b_v;
        a_i = idify(a_v);
        b_i = idify(a_v);
        d = diff(a.id(), b.id());
        d_i = unidify(d, a_i, b_i);



    }





    /*for (var v in a)
    {
        var e = a[v];
        treear.gen(na, e);
    }*/
    var p = treear.html();
    $(e).append(p);
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
