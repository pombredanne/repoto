
var dialogindx = 0;

function refselectdialog (x) {
    var d = $('#dialog').html();

    this.dialogidx = dialogindx++;
    this.select_repo = "select-repo-"+this.dialogidx;
    this.select_log  = "select-log-"+this.dialogidx;
    this.select_tree  = "select-tree-"+this.dialogidx;
    var select_repo = this.select_repo;
    var select_log = this.select_log;
    var select_tree = this.select_tree;

    d = d.replace("select-repo", this.select_repo);
    d = d.replace("select-log", this.select_log);
    d = d.replace("select-tree", this.select_tree);

    $('body').append($('<div id="dialog-' + this.dialogidx + '" title="Select revision"> ' + d + '</div>'));
    $( "#dialog-" + this.dialogidx ).dialog({width:"400px"});

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

        // ---------------------- commit select ------------------------
        var activesha = "undef";
        function loadChildDir(node) {
            // Render loader/spinner while loading
            var nid = (node == null ? 0 : node.id);
            $.ajax({
                dataType: "json",
                async: false, // Must be false, otherwise loadBranch happens after showChildren?
                url: "/browse/"+activesha+"/" + nid + "/children"
            }).done(function(data) {
                var items = [];
                $.each( data, function( key, val ) {
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

        // ---------------------- branch select ------------------------
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
        var sellog = $sellog[0].selectize;

        $.ajax({
            dataType: "json",
            async: false, // Must be false, otherwise loadBranch happens after showChildren?
            url: "/showrefs"
        }).done(function(data) {
            $('#'+select_repo).selectize({
                onChange        : function (e) {
                    var sha = this.options[e].sha;
                    $.ajax({
                        dataType: "json",
                        async: false, // Must be false, otherwise loadBranch happens after showChildren?
                        url: "/log/" + sha + "/100"
                    }).done(function(data) {
                        sellog.clear();
                        sellog.clearOptions();
                        sellog.load(callback => {
                            callback(data);
                        });
                    });
                },
                options: data,
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
        });
    }

    setuprefselect();
}
