#!/usr/bin/perl
use v5.10.1;
use experimental 'smartmatch';
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
    out=s
  } ,@g_more) or usage(\*STDERR);
  
$outdir=$OPT{'out'};

my $filename = $ARGV[0];
open(my $fh, '<:encoding(UTF-8)', $filename)
  or die "Could not open file '$filename' $!";

%defines=();
%assign=();

my $localpath ="";
my $started = 0;
while(<$fh>) {
    if (!$started) {
	if (/\*kati\*: LOAD-file-start/) {
	    $started = 1;
	}
    } else {
	if (/LOAD-file-proj-assign: ([\[\]A-Za-z\@0-9_\-\/\.\+]+)=<\{(.*)\}> :(.*)/ ) {
	    my ($defname,$evalstk,$content) = ($1,$2,$3);
	    $assign{$defname} = {'inherit' => []} if (!exists($assign{$defname}));
	    $assign{$defname}{'cur'} = $context;
	    foreach my $c (split(/\s+/,$context)) {
		if ($c =~ /^\@inherit.*/) {
		    if (!($c ~~ @{$assign{$defname}{'inherit'}})) { # perl 5.10
			push(@{$assign{$defname}{'inherit'}}, $c);
		    }
		}
	    }
	} else {
	    #print("Error :: '$_'\n");
	    #exit(1);
	}
    }
}

my $j = encode_json(\%assign);
open(my $o, '>', $ARGV[1])
  or die "Could not open file '$filename' $!";
print($o $j);
close($o);
