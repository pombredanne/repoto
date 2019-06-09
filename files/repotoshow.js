
function refselect (idx) {

    this.idx = idx;
    this.select_repo = "select-repo-"+this.idx;
    this.select_log  = "select-log-"+this.idx;
    this.select_tree  = "select-tree-"+this.idx;
    var select_repo = this.select_repo;
    var select_log = this.select_log;
    var select_tree = this.select_tree;
    var obj = this;
    var pathdb = {};

    function treetableLoadChildDir(table, node, activesha) {
        // Render loader/spinner while loading
        var nid = (node == null ? 0 : node.id);
        $.ajax({
            dataType: "json",
            async: false, // Must be false, otherwise loadBranch happens after showChildren?
            url: "/browse/"+activesha+"/" + nid + "/children"
        }).done(function(data) {
            var items = [];
            $.each( data, function( key, val ) {
                pathdb[val['id']] = val;
                items.push("<tr data-tt-id=\""  + val['id']   + "\" data-tt-parent-id=\"" + val['pid'] + "\" data-tt-branch=\"" + val['branch'] + "\">" +
	                   "<td><span class=\"" + val['kind'] + "\">"+val['n']+"</span>" +
                           "</td></tr>");
            });
            var html = items.join("");
            var rows = $(html).filter("tr");
            rows.find(".directory").parents("tr").each(function() {
                //droppableSetup.apply(this);
            });
            table.treetable("loadBranch", node, rows);
        });
    }

    function setuprefselect() {

        // ---------------------- filebrowser ------------------------
        var table = $("#" + select_tree);
        var $treetable = table.treetable({
            expandable: true,
            onNodeCollapse: function() {
                var node = this;
                table.treetable("unloadBranch", node);
            },
            onNodeExpand: function() {
                var node = this;
                loadChildDir(node);
            }
        });
        // Highlight selected row
        $(document).on("mousedown", "#" + select_tree + " tbody tr", function() {
            $("#" + select_tree + " tr.selected").removeClass("selected");
            $(this).addClass("selected");
        });
        var treetable = $treetable[0].treetable;
        obj.table = table;

        // ---------------------- commit select ------------------------
        var activesha = "undef";

        function loadChildDir(node) {
            treetableLoadChildDir(table,node,activesha);
        }

        // ---------------------- commit select ------------------------
        var $sellog = $('#'+ select_log ).selectize({
            onChange        : function (e) {
                if (e in this.options) {
                    activesha = this.options[e].id;
                    console.log(this.options[e].id);
                    table.empty();
                    loadChildDir(null);

                }
            },
            options: [],
            valueField: 'id',
            labelField: 'n',
            searchField: 'n',
            create: false,
            render: {
                option: function(item, escape) {
                    return '<div><span class="title">' +
                        '<span class="name">' + escape(item.d) + '</span>' +
                        '<ul class="meta">' +
                        '<li class="watchers"><span>' + escape(item.n) + '</span></li>' +
                        '</ul></div>';
                }
            }
        });
        obj.sellog = $sellog[0].selectize;

        // ---------------------- branch select ------------------------
        var $selcommit = $('#'+ select_repo ).selectize({
            onChange        : function (e) {
                if (e in this.options) {
                    var sha = this.options[e].sha;
                    $.ajax({
                        dataType: "json",
                        async: false, // Must be false, otherwise loadBranch happens after showChildren?
                        url: "/log/" + sha + "/100"
                    }).done(function(data) {
                        obj.sellog.clear();
                        obj.sellog.clearOptions();
                        obj.sellog.load(callback => {
                            callback(data);
                        });
                    });
                }
            },
            options: [],
            valueField: 'id',
            labelField: 'id',
            searchField: 'sha',
            create: false,
            render: {
                option: function(item, escape) {
                    return '<div><span class="title">' +
                        '<span class="name">' + escape(item.id) + '</span>' +
                        '<ul class="meta">' +
                        '<li class="watchers"><span>' + escape(item.sha) + '</span></li>' +
                        '</ul></div>';
                }
            }
        });
        obj.selcommit = $selcommit[0].selectize;

    };

    this.loadBranches = function() {

        obj.sellog.clear();
        obj.sellog.clearOptions();
        $.ajax({
            dataType: "json",
            async: false, // Must be false, otherwise loadBranch happens after showChildren?
            url: "/showrefs"
        }).done(function(data) {
            obj.selcommit.clear();
            obj.selcommit.clearOptions();
            obj.selcommit.load(callback => {
                callback(data);
            });
        });

        obj.table.empty();
    };

    this.getdiffmanifest = function() {
        var $n = $("#" + select_tree + " tr.selected");
        if ($n.length) {
            var e = $n[0];
            var n = $(e).parents("table").treetable("node", $(e).data("ttId"));
            return pathdb[n.id]['abspath'];
        }
        return undefined;
    };
    this.resetRepo = function() {
        obj.loadBranches();
    };

    setuprefselect();
    this.loadBranches();
}

var dialogindx = 0;

function refselectdialog () {

    this.dialogidx = dialogindx++;
    this.refsel = [dialogindx++, dialogindx++];
    var obj = this;

    var d = $('#dialog').html();

    for (var i = 0; i < 2; i++) {

        var select_repo  = "select-repo-" + this.refsel[i];
        var select_log   = "select-log-"  + this.refsel[i];
        var select_tree  = "select-tree-" + this.refsel[i];

        d = d.replace("_select-repo-" +i, select_repo);
        d = d.replace("_select-log-"  +i, select_log);
        d = d.replace("_select-tree-" +i, select_tree);
    }

    $('body').append($('<div id="dialog-' + this.dialogidx + '" title="Select revision"> ' + d + '</div>'));
    $( "#dialog-" + this.dialogidx ).dialog({width:"1200px",height:500}).dialogExtend(
        {
            "closable" : true,
            "maximizable" : true,
            "minimizable" : true,
            "collapsable" : true,
            "dblclick" : "collapse",
            "titlebar" : "transparent",
            "minimizeLocation" : "right"
        });

    obj.r0 = new refselect(this.refsel[0]);
    obj.r1 = new refselect(this.refsel[1]);

    this.getdiffmanifest = function() {
        var from = obj.r0.getdiffmanifest();
        var to   = obj.r1.getdiffmanifest();
        console.log("From " + from + " to " + to);
        return [from, to];
    };

    this.resetRepo = function() {
        obj.r0.resetRepo();
        obj.r1.resetRepo();
    };

    $("#diffmanifestbutton").click(e => {
        var r = obj.getdiffmanifest();
        processDiffManifests(r[0], r[1]);
    });

}

function initBrowser(resetdiag) {

    var pathdb = { 0 : { 'abspath' : "/" }};

    $( "#dialog-browser-select-tree" ).dialog({width:"800px"}).dialogExtend(
        {
            "closable" : true,
            "maximizable" : true,
            "minimizable" : true,
            "collapsable" : true,
            "dblclick" : "collapse",
            "titlebar" : "transparent",
            "minimizeLocation" : "right"
        });

    var table = $("#browser-select-tree");
    var $treetable = table.treetable({
        expandable: true,
        onNodeCollapse: function() {
            var node = this;
            table.treetable("unloadBranch", node);
        },
        onNodeExpand: function() {
            var node = this;

            var nid = (node == null ? 0 : node.id);
            $.ajax({
                dataType: "json",
                async: false, // Must be false, otherwise loadBranch happens after showChildren?
                url: "/browse/0/" + nid + "/children"
            }).done(function(data) {
                var items = [];
                $.each( data, function( key, val ) {
                    pathdb[val['id']] = val;
                    items.push("<tr data-tt-id=\""  + val['id']   + "\" data-tt-parent-id=\"" + val['pid'] + "\" data-tt-branch=\"" + val['branch'] + "\">" +
	                       "<td><span class=\"" + val['kind'] + "\">"+val['n']+"</span>" +
                               "</td></tr>");
                });
                var html = items.join("");
                var rows = $(html).filter("tr");
                rows.find(".directory").parents("tr").each(function() {
                    //droppableSetup.apply(this);
                });
                table.treetable("loadBranch", node, rows);
            });
        }
    });
    // Highlight selected row
    $(document).on("mousedown", "#browser-select-tree"  + " tbody tr", function() {
        $("#browser-select-tree" +  " tr.selected").removeClass("selected");
        $(this).addClass("selected");
    });
    $( "#dialog-browser-select-tree" ).dialog( "close" );

    function switchRepo() {
        var $n = $("#browser-select-tree" + " tr.selected");
        if ($n.length) {
            var e = $n[0];
            var n = $(e).parents("table").treetable("node", $(e).data("ttId"));
            var p = pathdb[n.id]['abspath'];
            console.log("Switch " + p);
            $( "#dialog-browser-select-tree" ).dialog( "close" );
            $.ajax({
                dataType: "json",
                url: "/setrepo/"+btoa(p)
            }).done(function(data) {
                if (data['success']) {
                    console.log("Set repo " + p + " success");
                    resetdiag.resetRepo();
                } else {
                    console.log("Set repo " + p + " failed");
                }
            });

        }
        return undefined;
    }

    $("#switchrepo").click(e => {
        switchRepo();
    });
}
