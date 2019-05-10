
function gen_tree(n) {
    this.c = [];
    this.n = n;
}

gen_tree.prototype.gen = function(na) {
    _n = [...na]
    n = _n.shift();
    c = this.c.find(function(a) { return a.n == n });
    if (c == undefined) {
        c = new gen_tree(n);
        this.c.push(c);
    }
    this.c.sort(function(a, b){
        return ('' + a.n).localeCompare(b.n);
    });
    if (_n.length != 0) {
        gen_tree(c, _n);
    }
}

gen_tree.prototype.html = function(na) {
    c = [];
    for (i in this.c) {
        c.push(this.c[i].html(na));
    }
    return "";
}

function init_repo_tree(b,a) {
    treear = new gen_tree('root')
    for (v in a) {
        n = a[v]['n']
        na = n.split("/");
        if (na[0] == "a") {
            na.shift();
        }
        treear.gen( ['by-repos'].concat(na));
        na = a[v]['path'].split("/");
        treear.gen( ['by-path'].concat(na));
    }
    $(b).append(treear.html());

    console.log(treear)
}
