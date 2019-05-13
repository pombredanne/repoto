// ----------- link ---------------

function link(e) {
    for (v in e) {
        this[v] = e[v];
    }
    this._ishidden = true;
}

// ----------- commit --------------------

function commit(e) {
    for (v in e) {
        this[v] = e[v];
    }
    this._ishidden = true;
}

commit.prototype.id = function(e) { return this.c; }

// ----------- commit history ------------

function commit_history(svg) {
    this.commit_down = {}; //
    this.commit_upward = {}; //
    this.commits = [];
    this.svg = svg;
}

commit_history.prototype.add_one_commit = function(e) {

    var e = new commit(e);
    e._d = Date.parse(e.d);
    var len = this.commits.length;
    /* sort into array */
    var l = 0, r = len, m = 0;
    while (l!=r) {
        var m = Math.floor((r+l)/2);
        if (e._d > this.commits[m]._d)
            r = m; // e is newer, add front
        else
            l = (++m);
    }
    this.commits.splice(m,0,e);
    len++;
    e._i = m;
    /* move index of older commit s */
    for (var j = m+1; j < len; j++) {
        this.commits[j]._i++;
    }
    /* build graph */
    for (var i in e.p) {
        var l = new link(e.c, e.p[i]);
        if (this.commit_down[e.c] == undefined)
            this.commit_down[e.c] = [];
        this.commit_down[e.c].push(l);
        if (this.commit_upward[e.p[i]] == undefined)
            this.commit_upward[e.p[i]]  = [];
        this.commit_upward[e.p[i]].push(l);
    }











    /*
    var ca = this.svg.selectAll(".commit").data(
        this.commits,
        function (d,i) { return d.c; });

    ca.enter().each(
        function(d,i) { d['_d3'] = this; }
    )
        .append("circle")
        .attr('class', 'commit')
        .attr('cx', function(d) { return 16 })
        .attr('cy', function(d) { return d._i*16 })
        */








    ;

    /*

        .attr('class', 'commit')
        .append("circle")
        .attr('class', 'commit')
        .attr('id', function(d,i) { return d.id(); })
    ;*/

    /*
      .append("circle").attr({
	    'class': 'commitgraphic selectable',
	    });*/

    //ca.exit().each(function(d,i) { console.log("remove"); }).remove();

}

commit_history.prototype.update = function() {

    var cshow = this.commits.filter(e=>this._ishidden);



}
