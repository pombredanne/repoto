
function init_repo_tree(b,a) {
    var treear = new gen_tree('root')
    for (var v in a)
    {
        n = a[v]['n']
        na = n.split("/");
        if (na[0] == "a")
        {
            na.shift();
        }
        treear.gen( ['by-repos'].concat(na));
        na = a[v]['path'].split("/");
        treear.gen( ['by-path'].concat(na));
    }
    var p = treear.html();
    $(b).append(p);
    treear.reinstantiate(); // verify instantiation

    console.log(treear)
}


