# https://www.gnu.org/licenses/gpl-3.0.html

package kati::top;
@ISA = ('templ::template');

$ptxt=<<'PEOF';
<html>
  <head>
    <script src="files/jquery-ui-1.12.1.custom/external/jquery/jquery.js"></script>
    <script src="files/jquery-ui-1.12.1.custom/jquery-ui.js"></script>
    <script src="files/code.js"></script>
    <script src="files/pako.js"></script>
    <link rel="stylesheet" type="text/css" href="files/jquery-ui-1.12.1.custom/jquery-ui.css">
    <link rel="stylesheet" type="text/css" href="files/jquery-ui-1.12.1.custom/jquery-ui.structure.css">
    <link rel="stylesheet" type="text/css" href="files/c.css">
    <style></style>
  </head>
  <body>
    <div class="page row">
     <div class="exp" onClick='expandAll()'>[+]</div>
     <div id="browser" class="menu-tree column expleft"><ul>
      {{projelem}}<br>
      {{tree}}
     </ul></div>
     <div class="mainpane">
      <div id="fninfo" class="floatinfo"></div>
      <div id="fileview" class="fileview"></div>
     </div>
     <div class="detail flex">
      <div id="detailfninfo" class="detailfloatinfo"></div>
      <div id="detailfileview" class="detailfileview"></div>
     </div>
    </div>
    <script>
     var stackmap={{stackmap}};
     var defines={{defines}};
     var zipdata={{zipdata}};
     var assignpages={{assignpages}};
     var ctxmap={{ctxmap}};
    </script>
  </body>
</html>
PEOF

sub new {
    my ($c,$fn,$a,$opts) = @_;
    my $s = {'fn'=>$fn,'txt'=>$ptxt,'tree'=>$a};
    bless $s,$c;
    $s->merge($opts,['zipdata','defines','projelem','assignpages','stackmap','ctxmap']) if ($opts);
    return $s;
}

package kati::treeelem;
@ISA = ('templ::template');

$ptxt=<<'PEOF';
<li>
    <span class="expanded">
    <a onclick='openfn("{{target_from}}",{{target_from_ln}})'
       >[+]</a>
    <a onclick='openfn("{{fn}}",0)' >{{fn}}</a>
   </span>
   <ul>
     {{childs}}
   </ul>
</li>
PEOF

sub new {
    my ($c,$opts) = @_;
    my $s =
    {
	'fn'=>'<undef>',
	'txt'=>$ptxt,
	'childs'=>[]
    };
    bless $s,$c;
    $s->merge($opts,['target_from', 'target_from_ln','fn']);
    return $s;
}

sub addElem {
    my ($s,$e) = @_;
    push(@{$$s{'childs'}}, $e);
}

##########################################################

package kati::projelem;
@ISA = ('templ::template');

$ptxt=<<'PEOF';
<li>
  <span class="expanded">
    <a onclick='openProjElem("{{lastleaf}}",0)' >{{n}}</a>
  </span>
  <ul>
    {{childs}}
  </ul>
</li>
PEOF

sub split_tree_path
{
    my ($d) = @_;
    my @a = split('\.',$d);
    my @b = ();
    foreach my $e (@a) {
	if ((($e eq 'mk') || ($e eq 'mk]]')) && scalar(@b)) {
	    $b[$#b] = $b[$#b].".".$e;
	} else {
	    push(@b, $e);
	}
    }
    return @b;
}

sub instantiate_path
{
    my ($s, $defname, @p) = @_;
    my $p = shift(@p);
    if (!exists($$s{'_childs'}{$p})) {
	$n = new kati::projelem({'n'=>$p});
	$$s{'_childs'}{$p} = $n;
	push(@{$$s{'childs'}}, $n);
    }
    my $n = $$s{'_childs'}{$p};
    if (scalar(@p)>0) {
	$n->instantiate_path($defname, @p);
    } else {
	push(@{$$n{'leafs'}},$defname);
	$$n{'lastleaf'} = $defname;
    }
}

sub new {
    my ($c,$opts) = @_;
    my $s =
    {
	'n'=>'...',
	'txt'=>$ptxt,
	'childs'=>[],
	'_childs'=>{},
	    'leafs' => [],
	    'lastleaf' => ''
    };
    bless $s,$c;
    $s->merge($opts,['n']);
    return $s;
}

sub addElem {
    my ($s,$e) = @_;
    push(@{$$s{'childs'}}, $e);
}

##########################################################
package kati::assign;
@ISA = ('templ::template');

$ptxt=<<'PEOF';
{{evalstk}} : {{content}}
PEOF

sub new {
    my ($c,$evalstk,$content) = @_;
    my $s = {'txt'=>$ptxt,
             'evalstk' => $evalstk,
	     'content' => $content };
    bless $s,$c;
    return $s;
}

package kati::assignhist;
@ISA = ('templ::template');

$ptxt=<<'PEOF';
{{assigns}}
PEOF

sub new {
    my ($c, $n, $a) = @_;
    my $s =
    {
	'txt'=>$ptxt,
	'n'=>$n,
	'assigns' => $a
    };
    bless $s,$c;
    $s->merge($opts,['n']);
    return $s;
}

sub asPage
{
    my ($s) = (shift);
    my $m = $s->doSub($$s{'txt'},@_);
    return $m;
}

1;
