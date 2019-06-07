
function setupfilebrowser(a) {
    var table = $("#"+a);
    table.treetable({
        expandable: true,
        onNodeCollapse: function() {
            var node = this;
            table.treetable("unloadBranch", node);
        },
        onNodeExpand: function() {
            var node = this;
            // Render loader/spinner while loading
            $.ajax({
                dataType: "json",
                async: false, // Must be false, otherwise loadBranch happens after showChildren?
                url: "/browse/" + node.id + "/children"
            }).done(function(data) {
                var items = [];
                $.each( data, function( key, val ) {
                    items.push("<tr data-tt-id=\""  + val['id']   + "\" data-tt-parent-id=\"" + val['pid'] + "\" data-tt-branch=\"" + val['branch'] + "\">" +
	                       "<td><span class=\"" + val['kind'] + "\"></span>" +
                               "</td></tr>");
                });
                var rows = $(html).filter("tr");
                rows.find(".directory").parents("tr").each(function() {
                    //droppableSetup.apply(this);
                });
                table.treetable("loadBranch", node, rows);
            });
        }
    });
}

