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
    lineage=s
    base=s
    out=s
  } ,@g_more) or usage(\*STDERR);
  
  $lineage=$OPT{'lineage'};
  $base=$OPT{'base'};
  $outdir=$OPT{'out'};


my $filename = $ARGV[0];
open(my $fh, '<:encoding(UTF-8)', $filename)
  or die "Could not open file '$filename' $!";

%defines=();
%stackmap=();
%assign=();
%ctxmap=();

while(<$fh>) {
    if (/LOAD-file-proj-assign: (ALL_DEPS|LOCAL_PATH)[\[\]A-Za-z\@0-9_\-\/\.\+]+)=<\{(.*)\}> :(.*)/ ) {
	my ($defname,$evalstk,$content) = ($1,$2,$3);
	$assign{$defname} = [] if (!exists($assign{$defname}));
	push(@{$assign{$defname}},
	     new kati::assign($evalstk,$content));
	print($content) if ($OPT{'verbose'});
	if (!($defname eq "ALL_DEPS.MODULES")) {
	    print(": $defname=$content\n") ;
	}
    } else {
	#print("Error :: '$_'\n");
	#exit(1);
    }
}

