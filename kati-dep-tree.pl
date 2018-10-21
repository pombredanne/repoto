#!/usr/bin/perl
use Data::Dumper;
use Getopt::Long;
use File::Basename;
use File::Path;
use FindBin qw($Bin);
use JSON::MaybeXS qw(encode_json decode_json);
use Cwd;
use Carp;
use Cwd 'abs_path';
require "$Bin/templ.pm";
require "$Bin/kati.pm";

Getopt::Long::Configure(qw(bundling));
GetOptions(\%OPT,qw{
    quiet|q+
    verbose|v+
    ihu=s
    base=s
    out=s
} ,@g_more) or usage(\*STDERR);

$ihu=$OPT{'ihu'};
$base=$OPT{'base'} || "build/make/core/config.mk";
$outdir=$OPT{'out'} || "gen";


my $filename = $ARGV[0];
open(my $fh, '<:encoding(UTF-8)', $filename)
  or die "Could not open file '$filename' $!";

$argbase = $base;
#$_c = { 'c' => [], 'fn_' => 'build/make/core/config.mk' };
$_c = { 'c' => [], 'fn_' => $argbase };

#%f = ( 'build/make/core/config.mk' => $_c );
%f = ( $argbase => $_c );

sub search_fn {
    my ($fn,$docreate) = @_;
    if ($docreate && ! exists($f{$fn})) {
	$f{$fn} = { 'c' => [], 'fn_' => $fn };
    }
    return $f{$fn}
}

%defines=();
%stackmap=();
%assign=();

$projroot = new kati::projelem({'n'=>'Projelem'});


while(<$fh>) {
    if (/LOAD-file: ([A-Za-z0-9_\-\/\.\+]+) : <\{/) {
	my ($fn) = ($1);
	print("$fn"."\n");
    } elsif (/LOAD-file-define: ([A-Za-z0-9_\-\/\.\+\\]+) : ([^:]+):/) {
	my ($defname,$fn) = ($1,$2);
	$defines{$defname} = { 'fn' => $fn };
    } elsif (/LOAD-file-map-entry: ([A-Za-z0-9_\-\/\.\+\\]+)=([0-9]+)/) {
	my ($defname,$idx) = ($1,$2);
	$stackmap{$idx} = $defname;
    } elsif (/LOAD-file-proj-assign: ([\[\]A-Za-z0-9_\-\/\.\+]+)=<\{(.*)\}> :(.*)/) {
	my ($defname,$evalstk,$content) = ($1,$2,$3);
	$assign{$defname} = [] if (!exists($assign{$defname}));
	push(@{$assign{$defname}},
	     new kati::assign($evalstk,$content));
	my @p = kati::projelem::split_tree_path($defname);
	my $p = $projroot->instantiate_path($defname, @p);
	print($content);
	print(": $defname\n");
    } elsif (/LOAD-file-dep: ([A-Za-z0-9_\-\/\.\+]+):([0-9]+) -> ([A-Za-z0-9_\-\/\.\+]+)/) {
	my ($fnfrom,$fnfromln,$fnto) = ($1,$2,$3);
	my $from = search_fn($fnfrom,0);
	my $to = search_fn($fnto,1);
	$$to{'fromln_'} = $1.".html#line".($fnfromln);
	$$to{'from_'} = $1;
	$$to{'from_ln_'} = $fnfromln;
	my $found = 0;
	for my $f (@{$$from{'c'}}) {
	    if ($$f{'fn_'} eq $fnto) {
		$found = 1;
	    }
	}
	if ($found == 0) {
	    push(@{$$from{'c'}},$to);
	}
	print("$fnfrom->$fnto"."\n");
    } else {
	print("Error '$_'\n");
	exit(1);
    }
}

@assign = ();
%assignpages = ();
foreach my $k (keys(%assign)) {
    my $v = $assign{$k};
    my $a = new kati::assignhist($k,$v);
    $assignpages{$k} = $a->asPage()
}

%preventrec = ();

sub recout
{
    my ($c,$idx) = @_;
    my $p = ''; #(' 'x$idx);
    my $m = "";
    my $target_from = $$c{'from_'};
    my $target_from_ln = $$c{'from_ln_'};
    my $fn = $$c{'fn_'};

    my $e = new kati::treeelem({
	'target_from' => $target_from,
	    'target_from_ln' => $target_from_ln,
	    'fn' => $fn  });

    return $e if ($preventrec{$$c{'fn_'}});
    $preventrec{$$c{'fn_'}} = 1;

    if (scalar(@{$$c{'c'}}) != 0) {
	for my $e_ ( @{$$c{'c'}} ) {
	    my $v = recout($e_,$idx+1);
	    $e->addElem($v),
	}
    }
    return $e;
}
#print(Dumper($f));

print("----\n");
%m = ();
for my $k (keys(%f)) {
    my $fn = $f{$k}{'fn_'};
    my $d = dirname($fn);
    my $cmd = "mkdir -p ".$outdir."/".$d;
    `$cmd`;
    if (! -f $outdir."/".$fn.".html") {
	print("Convert $fn\n");
	my $cmd = "(echo ".$fn."; cat ".$ihu."/".$fn.") | perl tex2html.pl > ".$outdir."/".$fn.".html";
	`$cmd`;
    }
    $cmd = "gzip -c ${outdir}/${fn}.html | base64 -w0";
    my $d = `$cmd`;
    $m{$fn.".html"} = $d;
}

my $d = '{'.join(",",map { "'$_' : '$m{$_}'" } keys(%m)).'}';

$r = recout($_c,0);;

$r = new kati::top($base,$r, {
    'projelem' => $projroot,
    'zipdata'=>$d,
	'defines'=>encode_json(\%defines),
	'stackmap'=>encode_json(\%stackmap),
	'assignpages'=>encode_json(\%assignpages)
		   });
my $filename = $outdir."/".$ARGV[1];
$r->saveTo($outdir."/".$ARGV[1]);

#open(my $fhout, '>', $filename)
#  or die "Could not open file '$filename' $!";

`cp -r files $outdir/`;

#print ($fhout $m);
