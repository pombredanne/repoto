#!/usr/bin/perl
my $filename = $ARGV[0];
open(my $fh, '<:encoding(UTF-8)', $filename)
  or die "Could not open file '$filename' $!";

@a = [];
$first = 0;
while(<$fh>) {
    if (/\*kati\*: LOAD-file-start/) {
	if ($first == 0) {
	    @a = [];
	    $first = 1;
	} else {
	    close($fn);

	    my $filename = $ARGV[1];
	    open(my $o, '>', $filename)
		or die "Could not open file '$filename' $!";
	    
	    print($o join("", @a));
	    close($o);
	    exit(0);
	}
    } else {
	push(@a,$_);
    }
}
