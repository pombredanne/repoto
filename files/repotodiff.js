/* ----------------------------- */

function pathvar (r) {
    this.n = r['n'];
    this.attr = {'class' : ['pathvar']};
    this.path = r.path;
    this.c = [];
}
pathvar.prototype.id = function() {
    return this.n;
};

function repovar (r) {
    this.n = r['n'];
    this.attr = {'class' : ['repovar']};
    this.c = [];
}
repovar.prototype.id = function() {
    return this.n;
};

/* ----------------------------- */

function threadpath(r, a, e, upto) {
    var h = {};
    for (var idx in r) {
        h[r[idx].n] = r[idx];
    }
    var cn = a.shift();
    upto.push(cn);
    var e = undefined;
    if (!(cn in h)) {
        if (a.length != 0) {
            e = new pathvar({'n': cn, path: upto.join("/")});
            r.push(e);
        } else {
            e = new repovar({'n': cn})
            r.push(e);
        }
        r.sort(function(a, b) { return ('' + a.n).localeCompare(b.n); });
    } else {
        e = h[cn];
    }
    if (a.length != 0)
    {
        threadpath(e.c, a, e, upto);
    }
}

function createprojhirarchy(projects) {
    var root = [
        new pathvar({'n':'by-name','path':'by-name',
                     'c':[]}),
        new pathvar({'n':'by-proj','path':'by-proj',
                     'c':[]})
    ];
    for (var p of projects) {
        var n = p['n'];
        var path = p['path'];
        var na = n.split("/");
        var patha = path.split("/");
        threadpath(root[0].c,na,   Object.assign({}, p),['by-name']);
        threadpath(root[1].c,patha,Object.assign({}, p),['by-proj']);
    }
    return root;
}

function repotodiff_tree(a, d_a, d_b) {
    var h_a = createprojhirarchy(d_a['d']);
    var h_b = createprojhirarchy(d_b['d']);

    var h_d = diffhirarchy(h_a, h_b, []);

    var treear = new gen_tree('root');
    treear.genar(h_d);
    var p = treear.html();
    $("#"+a).empty();
    $("#"+a).append(p);
    treeCodeClickSetup();
}


function processDiffManifests(a,b) {
    $.ajax({
        dataType: "json",
        url: "/projlist/" + btoa(a) + "/" + btoa(b)
    }).done(function(data) {
        console.log(data);
        repotodiff_tree("browser", {d:data.d[0].projects},{d:data.d[1].projects});
    });
}
