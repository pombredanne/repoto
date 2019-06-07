
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
    $(document).on("mousedown", "#tree tbody tr", function() {
      $("tr.selected").removeClass("selected");
      $(this).addClass("selected");
    });

}

function setuplog(a,sha) {
    console.log("Load "+sha);
    $.ajax({
        dataType: "json",
        async: false, // Must be false, otherwise loadBranch happens after showChildren?
        url: "/log/" + sha + "/100"
    }).done(function(data) {
        $('#'+a).selectize({
            onChange        : function (e) {
                console.log(this.options[e].sha);
            },
            options: data,
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
    });
}

function setuprefselect(a) {

    var $sellog = $('#'+"select-log").selectize({
        onChange        : function (e) {
            if (e in this.options)
                console.log(this.options[e].id);
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
        $('#'+a).selectize({
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
