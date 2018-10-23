# https://www.gnu.org/licenses/gpl-3.0.html

package templ::hashMerge;
use Carp;
use Data::Dumper;

$RE_balanced_squarebrackets = qr'(?:[\[]((?:(?>[^\[\]]+)|(??{$RE_balanced_squarebrackets}))*)[\]])'s;

sub get   {
	my ($s,$f) = (shift,shift);
	local $Data::Dumper::Maxdepth = 1;	#print (" + get ".$_->n."\n");
	if (exists($$s{$f})) {
		#print (Dumper($$s{$f}));
		#print (" + get ".$f."\n");
	}
	if ($f =~ /^-$RE_balanced_squarebrackets>$/) {	}
	return $s if ($f eq 'self');
	return exists($$s{$f}) ? $$s{$f} : (UNIVERSAL::can($s,$f) ? $s->$f(@_) : (exists($$s{"_".$f}) ? $$s{"_".$f} : undef));
}
sub trans { $_[0]->merge({'_trans'=> makemake::set::setNew($_[1])}); return $_[0];}
sub flags { $_[0]->merge({'_flags'=> makemake::set::setNew($_[1])}); return $_[0];}
sub flagsHas { my ($s,$f) = @_; return (exists($$s{'_flags'}) && (!makemake::set::setInterEmpty($$s{'_flags'},makemake::set::setNew($f)))); }
sub setColor { $_[0]->{'_color'} = $_[1]; }

sub getValsUp {
	my ($s,$n) = (shift,shift);
	my @v = map { $_->get($n,@_) } ($s);
	#print($n.":".join(",",map { $_->n } @n)."\n");
	return grep { defined($_) } @v;
}

sub getVals {
	my ($s,$n) = (shift,shift);
	#print (" *get ".$s->n." $n\n");
	my @n = ($s);
	my @v = map {
		local $Data::Dumper::Maxdepth = 1;
		#print (" + get ".$_->n."\n");
		#print (Dumper($_));

		$_->get($n,@_) } grep { defined($_) } @n;
	return grep { defined($_) } @v;
}

sub getFirstUp { my ($s,$n) = (shift,shift); my @r = $s->getValsUp($n,@_); return shift @r; }
sub getFirst   { my ($s,$n) = (shift,shift); my @r = $s->getVals($n,@_); return shift @r; }
sub getVal {
	my ($s,$n) = (shift,shift);
	return $s->get($n,@_);
}

sub merge {
	my ($self, $b, $k) = @_;
	_merge($self, $b, $k);
	return $self;
}

sub _merge {
	my ($a, $b, $k) = @_;
	my @k = keys %$b;
	@k = @$k if (defined($k));
	foreach my $k (@k) {
		if (!exists($$a{$k})) {
			$$a{$k} = $$b{$k};
		} else {
			if (UNIVERSAL::isa($$b{$k},'HASH') && UNIVERSAL::isa($$a{$k},'HASH')) {
				_merge($$a{$k}, $$b{$k});
			} elsif (UNIVERSAL::isa($$b{$k},'ARRAY') && UNIVERSAL::isa($$a{$k},'ARRAY')) {
				push (@{$$a{$k}},@{$$b{$k}});
			} elsif ((!UNIVERSAL::isa($$a{$k},'ARRAY')) &&
					 (!UNIVERSAL::isa($$b{$k},'HASH')) && (!UNIVERSAL::isa($$a{$k},'HASH'))) {
				$$a{$k} = $$b{$k};
			} elsif (UNIVERSAL::isa($$a{$k},'ARRAY')) {
				push (@{$$a{$k}},$$b{$k});
			} else {
				confess("Cannot merge $k: a($$a{$k}):".(ref $$a{$k})." b($$b{$k}):".(ref $$b{$k})."\n");
			}
		}
	}
}
# replace "\\" with "\", replace "\" with "/", replace '\n' with "\n"
sub convSlash { my ($s,$_fn) = @_; $_fn =~ s/\\/foo-rep-before-sub/gs; $_fn =~ s/\n/\n/gs; $_fn =~ s/[\\]/\//gs; $_fn =~ s/foo-rep-before-sub/\\/gs; return $_fn; }
sub convBSlash { my ($s,$_fn) = @_; $_fn =~ s/\\/\//gs; return $_fn; }
sub cflags_esc { my ($s) = (shift); my $f = $s->get("cflags",@_); return _cflags_esc($f); }
sub _cflags_esc { my ($f) = @_;
				  $f =~ s/"([^"]+)"/"\\"$1\\""/g; # "texvalue" => "\"texvalue\""
				  return $f; }

######################################################################

package templ::utils;
use File::Basename;
use File::Path;

use Data::Dumper;
sub ltrim { my $s = shift; $s =~ s/^\s+//;       return $s };
sub rtrim { my $s = shift; $s =~ s/\s+$//;       return $s };
sub  trim { my $s = shift; $s =~ s/^\s+|\s+$//g; return $s };

sub readfile {
    my ($in) = @_;
    ::usage(\*STDOUT) if (length($in) == 0) ;
    open IN, "$in" or die "Reading \"$in\":".$!;
    local $/ = undef;
    $m = <IN>;
    close IN;
    return $m;
}

sub writefile {
    my ($out,$re,$temp) = @_;
    my $dir = dirname($out);
    if ($dir) {
	mkpath($dir);
    }
    open OUT, ">$out" or die ($out.$!);
    print OUT ($re);
    close OUT;
}

######################################################################
# templating:
#
package templ::template;
use Data::Dumper;
@ISA = (templ::hashMerge);

$RE_balanced_squarebrackets = qr'(?:[\[]((?:(?>[^\[\]]+)|(??{$RE_balanced_squarebrackets}))*)[\]])'s;
$RE_balanced_smothbrackets  = qr'(?:[\(]((?:(?>[^\(\)]+)|(??{$RE_balanced_smothbrackets}))*)[\)])'s;
$RE_balanced_brackets =       qr'(?:[\{]((?:(?>[^\{\}]+)|(??{$RE_balanced_brackets}))*)[\}])'s;
$RE_IF =                      qr'\{\{if((?:(?>(?:(?!(?:fi\}\}|\{\{if)).)+)|(??{$RE_IF}))*)fi\}\}'s;
$RE_CALL =                    qr'\{\{call((?:(?>(?:(?!(?:llac\}\}|\{\{call)).)+)|(??{$RE_CALL}))*)llac\}\}'s;
$RE_FILE =                    qr'\{\{file((?:(?>(?:(?!(?:elif\}\}|\{\{file)).)+)|(??{$RE_FILE}))*)elif\}\}'s;
$RE_SLASH =                   qr'\{\{/((?:(?>(?:(?!(?:/\}\}|\{\{/)).)+)|(??{$RE_SLASH}))*)/\}\}'s;

sub snippetParam {
    my ($m) = (shift);
    if ($m =~ /^$RE_balanced_squarebrackets/) {
	$m = substr($m,length($&));
	return ($m,templ::utils::trim($1));
    } else {
	return ($m,"");
    }
}

sub splitpairs {
    my ($m) = @_; my $i, $j; my @a = ();
    for ($j = $i = 0; $i < length($m); $i++) {
	my $p = substr($m,$i);
	if ($p =~ /^\\\s/) {
	    $i++;
	} elsif ($p =~ /^(\s+)/) {
	    length($&);
	    push(@a,[substr($m,$j,$i-$j),$&]);
	    $i += length($&);
	    $j = $i;
	    $i--;
	}
    }
    push(@a,[substr($m,$j,$i-$j),'']) if ($i != $j);
    return [@a];
}

sub resolve_splitpairs {
    my ($a) = (shift);
    return [map {
	my ($fn,$sp) = ($$_[0],$$_[1]);
	my $_fn = templ::utils::trim($fn);
	$fn = $_fn;
	[$fn,$sp];
	    }  @$a ];
}

sub join_splitpairs {
    my ($a) = @_;
    return join("", map { $$_[0].$$_[1] } @$a);
}

sub slashsnippet {
    my ($self,$m) = (shift,shift);
    $m = $self->doSub($m,@_);
    my $a = splitpairs($m,@_); my $i = 0;
    $a = resolve_splitpairs($a,@_);
    $m = join_splitpairs($a,@_);
    return $m;
}

sub filesnippet {
    my ($self,$m) = (shift,shift);
    $m = templ::utils::trim($m);
    $m = templ::node::_relfname($m,@_);
    return $m;
}

sub callsnippet {
    my ($self,$m) = (shift,shift);
    my ($m,$n) = snippetParam($m);
    confess("Cannot find call expression\n") if (!length($n));
    my $a = $self->doSub($m,@_);
    $m = eval($n); warn $@ if $@;
    return $m;
}

sub ifsnippet {
    my ($s,$m) = (shift,shift);
    my ($m,$n) = snippetParam($m);
    confess("Cannot find if expression\n") if (!length($n));
    my $v = $s->getVal($n,@_);
    if (defined($v)) {
	return "" if (!$v);
    } else {
	return "" if ($n=~/^[a-z][a-z0-9_]*$/);
	my $r = eval($n); warn $@ if $@;
	if (!$r) {
	    return "";
	}
    }
    $m =~ s/$RE_IF/$self->ifsnippet($1,@_)/gse;
    return $m;
}

sub exesnippet {
    my ($self,$m) = (shift,shift);
    return `$m`;
}

sub flatten {
    my (@v) = @_; my @r = ();
    foreach my $v (@v) {
	if (UNIVERSAL::isa($v,'ARRAY')) {
	    push(@r, map { flatten($_) } @$v);
	} else {
	    push(@r,$v);
	}
    }
    return @r;
}

sub asrelfname { return $_[0]; }
sub cflags_esc { return $_[0]; }

# if $$s{$m} is an array of template objects, then call doSub on them
# as replacement text use $$o{'txt'} or the 'c' argument.
# if $$s{$m} is text replace with text
# if $$s{$m} c is an template object then call doSub
# to avoid recursion test == $s, however allow recusion with different 'c' paramter than 'txt'
sub snippet {
    my ($s,$m) = (shift,shift);
	my ($m,$n) = snippetParam($m);
    my $pre = ""; my $post = ""; my $isset = 0;
    my $a = eval("{$n}"); warn $@ if $@; my $r = "";

	#print("$n\n".Dumper($a));
	my $v;
	if ($m =~ /^\s*([a-zA-Z0-9_\.:]+)$RE_balanced_smothbrackets/s) {
		my ($x,$sel) = ($1,$2);
		$v = UNIVERSAL::can($s,$x) ? $s->$x($s->doSub($sel,@_),@_) :
			(exists(&$x) ? &$x($s->doSub($sel,@_),@_) : $x);
	} elsif ($m =~ /^\s*(get(?:-set)?(?:-up)?):([a-zA-Z0-9_\.,]+)/) {
		my ($x,$sel) = ($1,$2); my @_v = ($s); my @v = ();
		my $isup = ($x =~ /-up/);
		my $isset = ($x =~ /-set/);
		my $getVals = $isup ? "getValsUp" : "getVals";
		my $getFirst = $isup ? "getFirstUp" : "getFirst";
		my @sel = split(",",$sel);
		foreach my $sel (@sel) {
			my @_v = ($s);
			while ($sel =~ /^([a-zA-Z0-9_]+)/) {
				my $id = $1;
				$sel =~ s/^[a-zA-Z0-9_]+\.?//;
				#printf("Retrive $id\n");
				@_v = flatten( map {
					UNIVERSAL::can($_,$getVals) ?
						($isset ? ($_->$getVals($id,@_)) : ($_->$getFirst($id,@_))) :
						  (exists(&$id) ? &$id($_,@_) : "".$_)
					  } @_v);
				#print (" = ".join(",",@v)."\n");
			}
			push(@v,@_v);
		}
		if ($isset) {
			my %h = ();
			@v = grep { my $n = $_; my $e = !exists($h{$n}); $h{$n} = 1; $e } @v;
			#print("+Found ".join(",",map { UNIVERSAL::can($_,'n') ? $_->n : $_ } @v)."\n");
		}
		$v = [@v];
	} else {
		if ($$a{'gather'}) {
			$v = [$s->getVals($m,@_)] ;
		} else {
			$v = $s->getFirst($m,@_);
			local $Data::Dumper::Maxdepth = 1;
			#print("Get '$m' on ".$s->n."\n"); #:".Dumper($v)."\n");
		}
	}
    if ($$a{'wrap'}) {
		my $w = $$a{'wrap'};
		my $i = index($w,'^');
		($pre,$post) = (substr($w,0,$i),substr($w,$i+1));
    }
    return (exists($$a{'post'}) ? "" : "<undef>") if (!defined($v));
    if (UNIVERSAL::isa($v,'ARRAY')) {
		my $c = exists($$a{'c'}) ? $$a{'c'} : 'txt';
		#print ("Retrive $c\n");
		my @a = map { UNIVERSAL::can($_,'doSub') ? $_->doSub($_->get($c,@_),@_) : $_ } @{$v};
		#print ("Ar ".$s->n."[$m] $c(".scalar(@a)."):".join(" ".@a)."\n");
		my $b = $$a{'join'} || "";
      	@a = map { $pre.$_.$post } @a;
		$r = join($b,@a);

    } else {
		my $c = exists($$a{'c'}) ? $$a{'c'} : 'txt'; my $cres = undef;
		$cres = $v->get($c,@_) if (UNIVERSAL::can($v,'doSub'));
		$_v = (UNIVERSAL::can($v,'doSub') && ($s != $v || $c ne 'txt' ) && defined($cres) ) ? $v->doSub($cres,@_) : $v;
		$r = $pre.$$a{'pre'}.$_v.$$a{'post'}.$post;
    }
	if (exists($$a{'trim'})) {
		$r = join("\n",map { makemake::utils::trim($_) } split('[\n]',$r));
		$r = makemake::utils::trim($r);
	}
	if (exists($$a{'x'})) {
		$r =~ s/$$a{'x'}//g;
	}
    return $r;
}

sub doSub {
    my ($self,$m) = (shift,shift); my $cnt = 0; my $it = 0;
    my @a = @_;
    while(1) {
	my $ol = length($m);
	$cnt += ($m =~ s/$RE_IF/$self->ifsnippet($1,@a)/gsei);
	$cnt += ($m =~ s/$RE_CALL/$self->callsnippet($1,@a)/gsei);
	$cnt += ($m =~ s/$RE_FILE/$self->filesnippet($1,@a)/gsei);
	$cnt += ($m =~ s/$RE_SLASH/$self->slashsnippet($1,@a)/gsei);
	$cnt += ($m =~ s/\{$RE_balanced_brackets\}/$self->snippet($1,@a)/gse);
	$cnt += ($m =~ s/`([^`]+)`/$self->exesnippet($1,@a)/gsei);
	last if (($ol == length($m)) || $it > 4);
	$it++;
    }
    return $m;
}

sub saveTo {
    my ($s,$fn_) = (shift,shift);
    my $m = $s->doSub($$s{'txt'},@_);
    if (exists($$s{'trim'})) {
	$m = join("\n",map { templ::utils::trim($_) } split('[\n]',$m));
    }
    my $fn = $fn_ || $s->{'_fname'};
    print("Writing file $fn\n") if ($::OPT{'verbose'} && !$::OPT{'quiet'});
    templ::utils::writefile($fn,$m);
    print($m) if ($::OPT{'verbose'} && !$::OPT{'quiet'});
    return $m;
}
