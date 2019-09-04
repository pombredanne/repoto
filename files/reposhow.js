var shas_hash = {};

function init_repo_tree(b,a) {
    var treear = new gen_tree('root')
    for (var v in a)
    {
        var n = a[v]['n']
        var na = n.split("/");
        a[v]['attr'] = {'class' : ['selsha','sha'+a[v]['sha']]};
        var sha = a[v]['sha'];
        shas_hash[sha] = a[v];
        a[v]['arg1'] = sha;
        if (na[0] == "a")
            na.shift();
        treear.gen( ['by-repos'].concat(na),a[v]);
        na = a[v]['path'].split("/");
        treear.gen( ['by-path'].concat(na),a[v]);
    }
    var p = treear.html();
    $(b).append(p);
    treear.reinstantiate(); // verify instantiation

    console.log(treear)
}

function selsha(e) {
}

function selgroup(e) {
    var shas = [];
    var a = $("#"+e).find(".selsha").each(function(i,v) {
        var c = $(v).attr('class');
        for (var i of c.split(/\s+/)) {
            if (i.startsWith("sha")) {
                shas.push(i.substr(3));
            }
        }
    });
    for (var a of shas) {
        var v = shas_hash[a];

    }
}
