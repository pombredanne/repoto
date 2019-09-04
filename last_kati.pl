#!/usr/bin/perl
my $filename = $ARGV[0];
open(my $fh, '<:encoding(UTF-8)', $filename)
  or die "Could not open file '$filename' $!";
open(my $o, '>', $ARGV[1])
  or die "Could not open file '$filename' $!";


@a = [];
while(<$fh>) {
    if (/\*kati\*: LOAD-file-start/) {
	@a = [];
    } else {
	#push(@a,$_);
	print($o $_);
    }
}
close($o);

close($fn);

