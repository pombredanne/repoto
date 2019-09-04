#!/bin/bash

# recompile ckati and copy
lineage:
	echo "lineage needs to be prepared"
	-rm /tmp/kati.log
	mkdir -p $(CURDIR)/$(DATE)
	cd kati; make
	cp kati/ckati ~/lineage/prebuilts/build-tools/linux-x86/bin/ckati
	cd ~/lineage/; source build/envsetup.sh; lunch lineage_jfltexx-userdebug; make clean; \
		$(CURDIR)/monitor.sh make showcommands 2>&1 | tee $(CURDIR)/$(DATE)/compile_kati.txt

lineage-process:
	cat /tmp/kati.log  | grep -ia LOAD-file > kati_jfltexx_list_filter.txt
	perl first_kati.pl kati_jfltexx_list_filter.txt kati_jfltexx_list_first.txt
	perl last_kati.pl kati_jfltexx_list_filter.txt kati_jfltexx_list_last.txt

lineage-process-config:
	#-rm -rf kati_lineage_config-out
	mkdir -p kati_lineage_config-out
	/usr/bin/perl kati-dep-tree.pl \
		--lineage $(HOME)/lineage \
		--base build/make/core/config.mk \
		--out kati_lineage_config-out  \
		kati_jfltexx_list_first.txt index.html
	google-chrome --allow-file-access-from-files kati_lineage_config-out/index.html


lineage-process-main:
	#-rm -rf kati_lineage_main-out
	mkdir -p kati_lineage_main-out
	/usr/bin/perl kati-dep-tree.pl \
		--lineage $(HOME)/lineage \
		--base build/make/core/main.mk \
		--out kati_lineage_main-out  \
		kati_jfltexx_list_last.txt index.html
	google-chrome --allow-file-access-from-files kati_lineage_main-out/index.html



all:

SHELL=bash
DATE:=$(shell date +%y%m%d-%H%M%S)

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

