
function gen_tree(a, na) {
    _n = [...na]
    n = _n.shift();
    c = a.c.find(function(a) { return a.n == n });
    if (c == undefined) {
        c = { n: n, c : [] };
        a.c.push(c);
    }
    a.c.sort(function(a, b){
        return ('' + a.n).localeCompare(b.n);
    });
    if (_n.length != 0) {
        gen_tree(c, _n);
    }
}


function init_repo_tree(a) {
    treear = { c:[] }
    for (v in a) {
        n = a[v]['n']
        na = n.split("/");
        if (na[0] == "a") {
            na.shift();
        }
        gen_tree(treear, na);
    }
    console.log(treear)
}
