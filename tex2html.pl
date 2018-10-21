#!/usr/bin/perl

$a=<<'EOF';
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>$head</title>

<style>
h1   {color: blue;}
p    {color: red;}
</style>
</head>
<body>
EOF
print($a);

$parStatus=0;
$ln=0;
while(<>) {
    $line = $_;
    $line =~ s/\n$//;
    $lnv=sprintf("%04d", $ln);
    print( "<span class=\"code\" id=\"line${ln}\" >${lnv}: ${line}</span><br>\n");
    $ln+=1;
}

$a=<<'EOF';
</body>
</html>
EOF
print ($a);
