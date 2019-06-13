/* ----------------------------- */

var register = [];
var shas_hash = {};

function pathvar (r) {
    this.n = r['n'];
    this.attr = {'class' : ['selpathvar']};
    this.path = r.path;
    this.c = [];
}
pathvar.prototype.id = function() {
    return this.n;
};

function repovar (r) {
    this.n = r['n'];
    this.path = r['path'];
    this.gn = r['gid'];
    this.sha = r['sha'];
    this.attr = {'class' : ['selrepovar','sha'+r['sha']]};
    this.c = [];
}
repovar.prototype.id = function() {
    return this.n;
};
repovar.prototype.gid = function() {

    return this.gn;
};

function selpathvar(a,typ,e) {
    var shas = [];
    var a = $("#"+e).find(".selrepovar").each(function(i,v) {
        var c = $(v).attr('class');
        for (var i of c.split(/\s+/)) {
            if (i.startsWith("sha")) {
                shas.push(i.substr(3));
            }
        }
    });
    selShas(shas);
}

var updatejobs = [];
var updatejob_idx = 0;
var updatejob_ongoing = 0;

function updatejob_add(id, path, sha0, sha1) {
    updatejobs.push([id, path, sha0, sha1]);
    if (!updatejob_ongoing)
        updatejob_next();
}

function updatejob_next() {
    if (!updatejobs.length)
        return;
    updatejob_ongoing = 1;
    var e = updatejobs.shift();
    $.ajax({
        dataType: "json",
        url: "/logdiff/" + btoa(e[1]) + "/" + e[2] + "/" +e[3]
    }).done(function(data) {
        console.log(data);
        updatejob_ongoing = 0;
        updatejob_next();
    }).fail(function(jqXHR, textStatus) {
        console.log(jqXHR);
        console.log(textStatus);
        updatejob_ongoing = 0;
        updatejob_next();
    });
}

function selShas(shas) {
    var found = {};
    for (var a of shas) {
        found[a] = 1;
    }
    var diffsets = [];
    for (var a of register) {
        var inset = 0;
        for (var p of a) {
            if (p != undefined) {
                if (p.sha in found)
                    inset = 1;
            }
        }
        if(inset) {
            diffsets.push(a);
        }
    }
    var items = [];
    $.each( diffsets, function( key, val ) {
        var n = "";
        var a = "<td></td>";
        var repodiff = "";
        if (val[0] != undefined) {
            n = val[0].path;
            a = "<td>"+val[0].sha+"</td>";
        }
        var b = "<td> </td>";
        if (val[1] != undefined) {
            n = val[1].path;
            b = "<td>"+val[1].sha+"</td>";
        }
        if (val[0] != undefined && val[1] != undefined && val[0].path == val[1].path) {
            var i = updatejob_idx++;
            repodiff = "<td id=\"update"+i+"\">" + "</td>";
            updatejob_add(i, val[0].path, val[0].sha, val[1].sha);
        }
        items.push("<tr><td>"+n+"</td>" + repodiff + a + b + "</tr>");
    });

    var tablear = items.join("\n");

    $("#repo-list-table").html(tablear);
}

function selrepovar(a,typ,b) {
    var shas = [];
    selpathvar(a,typ,b);
}

/* ----------------------------- */

function threadpath(r, a, p, upto) {
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
            e = new repovar({'n': cn, 'gid': p.n, 'sha': p.sha, 'path': p.path})
            r.push(e);
        }
        r.sort(function(a, b) { return ('' + a.n).localeCompare(b.n); });
    } else {
        e = h[cn];
    }
    if (a.length != 0)
    {
        threadpath(e.c, a, p, upto);
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
        var sha = p['sha'];
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

    var h_d = diffhirarchy(h_a, h_b, [], register);

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
