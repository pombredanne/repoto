
echo '{ "e" : ['
git log --pretty=format:'{ ^^^^c^^^^: ^^^^%H^^^^,  ^^^^p^^^^: ^^^^%P^^^^ , ^^^^t^^^^ : ^^^^%T^^^^, ^^^^d^^^^ : ^^^^%cD^^^^, ^^^^s^^^^ : ^^^^%s^^^^ },%n' \
    --show-notes --parents --boundary --all  | \
    sed 's/\x1b/\\x1b/g' | \
    sed 's/\t/\\t/g' | \
    sed 's/\r/\\r/g' | \
    sed 's/\\/\\\\/g' | \
    sed 's/"/\\"/g' | sed 's/\^^^^/"/g'

echo '{}]}'
