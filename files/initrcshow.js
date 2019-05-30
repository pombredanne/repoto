
function init_diff_tree(b, a) {

    var treear = new gen_tree('root')
    /*for (var v in a)
    {
        var e = a[v];
        treear.gen(na, e);
    }*/
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
