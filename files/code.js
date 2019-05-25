
function gen_tree(n) {
    this.c = [];
    this.n = n;
    this.e = {};
}

gen_tree.prototype.gen = function(na,e) {
    var _n = [...na]
    var n = _n.shift();
    var c = this.c.find(function(a) { return a.n == n });
    if (c == undefined) {
        c = new gen_tree(n);
        this.c.push(c);
    }
    this.c.sort(
        function(a, b) { return ('' + a.n).localeCompare(b.n); });
    if (_n.length != 0) {
        c.gen(_n,e);
    } else {
        c.e = e;
    }
}

gen_tree.prototype.html = function(na) {
    var c = [];
    for (var i in this.c) {
        var e = this.c[i];
        c.push(e.html(na));
    }
    var func = 'noop'; var arg0 = ""; var arg1 = "file";
    var a = ['expanded'];
    if ('attr' in this.e &&
        'class' in this.e['attr']) {
        var toadd = this.e['attr']['class'];
        func = toadd[0];
        if ('dir' in toadd) {
            arg1 = 'dir';
        }
        arg0 = this.e['path'];
        a = a.concat(toadd);
    }
    var l = c.join("\n");
    var args = [arg0, arg1].map(function(a) { return "\""+a+"\""; }).join(",");
    return "<li><span class=\""+a.join(" ")+"\"><a onclick='"+func+"("+args+")' >" + this.n + "</a></span><ul> " + l + "</ul></li>";
}

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

    console.log(treear)
}

function init_diff_tree(b,a) {
    var treear = new gen_tree('root')
    for (var v in a)
    {
        na = a[v]['path'].split("/");
        treear.gen(na, a[v]);
    }
    var p = treear.html();
    $(b).append(p);

    console.log(treear)
}
