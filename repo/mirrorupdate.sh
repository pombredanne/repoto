#!/bin/bash -x

. "$(dirname $0)/base.sh"

case "$1" in
    status) shift;
	    ;;
    apply) shift;
	    ;;
    fetch) ;;
esac

if [ -z ${singlerepo} ]; then
    echo "calulate added repos..."
    declare -a newrepos
    declare -a existingrepos
    declare -a delrepos
    jq_get_newrepos      newrepos existingrepos delrepos $mirrordef
    jq_get_newreposclone newrepos $mirrordef
    echo " newrepos : [" ${newrepos[@]} "]"

    echo "calulate remotes changes..."
    declare -a newremotes
    declare -a existingremotes
    declare -a delremotes
    jq_get_newremotes     existingrepos newremotes existingremotes delremotes $mirrordef
    jq_get_newremotes_add newremotes $mirrordef
    echo " newremotes : [" ${newremotes[@]} "]"
    echo " delremotes : [" ${delremotes[@]} "]"

    echo "calulate url changes..."
    declare -a needupdate
    jq_get_newurls     existingrepos needupdate $mirrordef
    echo " need update: [" ${needupdate[@]} "]"

    jq_get_newurls_update needupdate $mirrordef

else
    echo "calulate url changes..."
    declare -a needupdate
    declare -a existingrepos
    existingrepos=("${singlerepo}")
    jq_get_newurls     existingrepos needupdate $mirrordef
    echo " need update: [" ${needupdate[@]} "]"

    jq_get_newurls_update needupdate $mirrordef
fi
