#!/bin/bash

PID=0
prun() {
    f=$1;
    eval "$*" ; exitcode=$?
    echo "'$f' returned '$exitcode'"
    exit $exitcode
}

runtest() {
    local timeout=$1; shift

    prun $* &
    PID="$!"

    status="timeout"
    for i in `seq $timeout`; do
	if kill -0 $PID 2>/dev/null; then
	    true;
	elif wait "$PID"; then
	    status="success $?"; break
	else
	    status="failure $?"; break
	fi
	sleep 1
    done
    case "$status" in
	success*) ;;
	failure*)
	    ;;
	timeout*)
	    echo "timeout for $* (${PID})"
	    kill -9 ${PID}
	    ;;
    esac
}

CR=$(printf "\n")

runtest 200 $* 2>&1 | (
    IFS="${CR}"
    while read line; do
	case ${line} in
	    *prebuilts/ninja/linux-x86/ninja\ \ -C\ .\ -f\ *build-*_*.ninja*)
		echo "Found ${line}: pid ${PID}";
		kill -9 ${PID}
		;;
	    *prebuilts/build-tools/linux-x86/bin/ninja*-f\ out/combined-*.ninja\ -v\ -w*)
		echo "Found ${line}: pid ${PID}";
		kill -9 ${PID}
		;;
	    *)
		echo $line;
	    ;;
	esac
    done
)

exit 0
