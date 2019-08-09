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
jq_get_newrepos newrepos existingrepos delrepos $mirrordef
jq_get_newreposclone newrepos $mirrordef

declare -a newremotes
declare -a existingremotes
declare -a delremotes
jq_get_newremotes     existingrepos newremotes existingremotes delremotes $mirrordef
jq_get_newremotes_add newremotes $mirrordef
echo "new remotes:" ${delremotes[@]}

#testarops

declare -a newurls
jq_get_newurls     existingremotes $mirrordef
#jq_get_newurls_add newurls $mirrordef
