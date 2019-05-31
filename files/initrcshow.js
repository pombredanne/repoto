
function idify(a) {
    var r = [];
    for (var i of a) {
        var j = i.id();
        r.push(j);
    }
    return r;
}

function unidify(d, a, b) {
    var a_i = 0;
    var b_i = 0;
    var r = [];
    for (i of d) {
        if (i.added && ! i.removed) {
            for (var j = 0; j < i.items.length; j++)
                r.push([undefined,b[b_i++]]);
        } else if (!i.added &&i.removed) {
            for (var j = 0; j < i.items.length; j++)
                r.push([a[a_i++],undefined]);
        } else if  (!i.added && !i.removed) {
            for (var j = 0; j < i.items.length; j++)
                r.push([b[b_i++],a[a_i++]]);
        } else {
            throw Error("Undef");
        }
    }
    return r;
}

/* ----------------------------- */

function actionrule (r) {
    this.done = 0;
    this.n = r.line;
    this.attr = {'class' : ['processaction']};
    this.trig_event = r.trig_event;
    this.trig_prop = r.trig_prop;
    this.path = r.path;
    this.set = r.set;
    this.actions = r.actions;
    this.c = [];
}
actionrule.prototype.id = function() {
    return this.n + this.actions.join("");
};

function eventcategory (r) {
    this.done = 0;
    this.n = r.n;
    this.attr = {'class' : ['processeventcategory']};
    this.c = r.c;
}
eventcategory.prototype.id = function() {
    return this.n;
};

/* ----------------------------- */

function createhirarchy(rules) {
    var trig_event = {};
    var trig_prop = {}; // listener
    var trig_set = {}; // setter

    var rules_wrap = []
    for (var r of rules) {
        r['done'] = 0 ;
        r['n'] = r.line;
        r['attr'] = {'class' : ['processaction']};
        r['c'] = [];
        var rwrap = new actionrule(r);
        rules_wrap.push(rwrap);
        for (var k in r['trig_prop']) {
            if (!(k in trig_prop)) {
                trig_prop[k] = []
            }
            trig_prop[k].push({'e':rwrap, 'v': r['trig_prop'][k]});
        }
        for (var k in r['set']) {
            if (!(k in trig_set)) {
                trig_set[k] = []
            }
            trig_set[k].push({'e':rwrap, 'v': r['set'][k]});
        }
    }

    // sort in main events
    for (var r of rules_wrap) {
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
        for (var r0 of rules_wrap) {
            if (r0['done']) {
                // match r0 setter with r1 listener
                for (var r1 of rules_wrap) {
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

    // others
    trig_event['loose'] = [];
    for (var r of rules_wrap) {
        if (r['done'])
            continue;
        trig_event['loose'].push(r);
    }

    // ----------------- out -----------------
    var r = [];
    for (var k in trig_event) {
        var a = [];
        for (var rule of trig_event[k]) {
            a.push(rule);
        }
        r.push(new eventcategory({'n': k, 'c' : a}));
    }
    return r;
}


function processaction(fn, typ) {
    var a = fn.split(/:/);
    var filename = a[0];
    var linenumber = a[1];
    openfn(filename, linenumber);
}

function propagate(e,c) {
    e.attr.class.push(c);
    for (var i of e.c) {
        propagate(i,c);
    }
}

function diffhirarchy(a,b) {
    var a_i = idify(a);
    var b_i = idify(b);
    console.log(a_i);
    console.log(b_i);
    var d = diff(a_i, b_i);
    console.log(d);
    var u = unidify(d, a, b);
    console.log(u);
    var result = [];
    for (var e of u) {
        if (e[0] == undefined && e[1] != undefined) {
            propagate(e[1], "diffremoved");
            result.push(e[1]);
        }
        if (e[0] != undefined && e[1] == undefined) {
            propagate(e[0], "diffnew");
            result.push(e[0]);
        }
        if (e[0] != undefined && e[1] != undefined) {
            var e0 = e[0];
            var e1 = e[1];
            var c = diffhirarchy(e0.c, e1.c);
            e1.c = c;
            result.push(e1);
        }
    }
    return result;
}

function initrc_diff_tree(e, d) {
    var treear = new gen_tree('root');
    var seq = {};

    var rules_a = createhirarchy(d['d'][0]['parsed']['rules']);
    var rules_b = createhirarchy(d['d'][1]['parsed']['rules']);

    var rulues_d = diffhirarchy(rules_a, rules_b);

    treear.genar(rulues_d);
    /*
    treear.genar(rules_a.concat(rules_b));
    */

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
