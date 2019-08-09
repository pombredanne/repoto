#!/bin/bash -x

. "$(dirname $0)/base.sh"

case "$1" in
    status) shift;
	    ;;
    fetch) ;;
esac

declare -a newrepos
declare -a existingrepos
declare -a delrepos
jq_get_newrepos      newrepos existingrepos delrepos $mirrordef
jq_get_newreposclone newrepos $mirrordef

declare -a newremotes
declare -a existingremotes
declare -a delremotes
jq_get_newremotes     existingrepos newremotes existingremotes delremotes $mirrordef
jq_get_newremotes_add newremotes $mirrordef
echo "newremotes :" ${newremotes[@]}
echo "delremotes :" ${delremotes[@]}

declare -a needupdate
jq_get_newurls     existingrepos needupdate $mirrordef
echo "need update:" ${needupdate}

jq_get_newurls_update needupdate $mirrordef
