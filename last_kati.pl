#!/usr/bin/perl
my $filename = $ARGV[0];
open(my $fh, '<:encoding(UTF-8)', $filename)
  or die "Could not open file '$filename' $!";

@a = [];
while(<$fh>) {
    if (/\*kati\*: LOAD-file-start/) {
	@a = [];
    } else {
	push(@a,$_);
    }
}

close($fn);

my $filename = $ARGV[1];
open(my $o, '>', $filename)
  or die "Could not open file '$filename' $!";

print($o join("", @a));
close($o);
