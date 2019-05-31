
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

function createhirarchy(rules) {
    var trig_event = {};
    var trig_prop = {}; // listener
    var trig_set = {}; // setter

    for (var r of rules) {
        r['done'] = 0 ;
        r['n'] = r.line;
        r['attr'] = {'class' : ['processaction']};
        r['c'] = [];
        for (var k in r['trig_prop']) {
            if (!(k in trig_prop)) {
                trig_prop[k] = []
            }
            trig_prop[k].push({'e':r, 'v': r['trig_prop'][k]});
        }
        for (var k in r['set']) {
            if (!(k in trig_set)) {
                trig_set[k] = []
            }
            trig_set[k].push({'e':r, 'v': r['set'][k]});
        }
    }

    // sort in main events
    for (var r of rules) {
        if (r['done'])
            continue;
        for (var k in r['trig_event']) {
            if (!(k in trig_event)) {
                trig_event[k] = [];
            }
            trig_event[k].push(r);
            r['done'] = 1;
        }
    }

    function match(a, b) {
        for (var k in a['set']) {
            if (k in b['trig_prop'] &&
                a['set'][k] == b['trig_prop'][k]) {
                return 1;
            }
        }
        return 0;
    }

    // fold
    var found = 1;
    while (found) {
        found = 0;
        for (var r0 of rules) {
            if (r0['done']) {
                // match r0 setter with r1 listener
                for (var r1 of rules) {
                    if (!r1['done'] && match(r0,r1)) {
                        r1['done'] = 1;
                        found = 1;
                        r0.c.push(r1);
                    } else {
                        /* only link */
                    }
                }
            }
        }
    }

    // ----------------- out -----------------
    var r = [];
    for (var k in trig_event) {
        var a = [];
        for (var rule of trig_event[k]) {
            a.push(rule);
        }
        r.push({'n': k, 'c' : a});
    }
    return r;
}

function processaction(fn, typ) {

}

function initrc_diff_tree(e, d) {
    var treear = new gen_tree('root');
    var seq = {};

    var rules = d['d'][0]['parsed']['rules'];
    rules = createhirarchy(rules);

    treear.genar(rules);

    /*
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



    }*/





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
