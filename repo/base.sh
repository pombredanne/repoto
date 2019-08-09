#!/bin/bash -x

# Option parsing
nofetch=1
dryrun=1
mirrordef=
while [ $# -gt 0 ]; do
    case "$1" in
        --fetch)     nofetch=0; shift ;;
        --nodry-run) dryrun=0; shift ;;
        --def)       mirrordef="$2"; shift 2 ;;
	--base)      base="$2"; shift 2 ;;
	--symlinkbase)      symlinkbase="$2"; shift 2 ;;
        *)           break ;;
    esac
done

curbase=$(pwd)
if [ -z ${base} ]; then echo "specify base"; exit 1; fi
if [ -z ${symlinkbase} ]; then echo "specify symlinkbase"; exit 1; fi

function mayberun () {
    if [[ $dryrun == 0 ]]; then
	echo "dry-run: $*"
    else
	$@
    fi
    # return exit code of last command
}

function clone_repo {
    local path=${base}/${1}.git
    local repo=${2}
    local linkpath=${3}
    echo "$1 : ${repo} => ${path} (${linkpath})"
    (mkdir -p ${path}; cd ${path};
    if ! mayberun git init --bare ; then
        echo "------------- !!! unable to init ${path} ------------- "; exit 1;
    fi
    mayberun git config uploadpack.allowTipSha1InWant true
    mayberun git config uploadpack.allowReachableSHA1InWant true
    )
    dfn=$(readlink -f ${path})
    if [[ ${symlinkbase:0:1} == "/" ]]; then
	lfn=${symlinkbase}/${linkpath}
    else
	lfn=${curbase}/${symlinkbase}/${linkpath}
    fi
    mkdir -p $(dirname ${lfn})
    mayberun ln -s ${dfn} ${lfn}.git
}

function clone_repo_new {
    local path=${base}/${1}.git
    local n=${2}
    local url=${3}
    (cd ${path};
     if ! mayberun git remote add ${n} ${url}; then
        echo "------------- !!! unable to add remote ${n} ${url} ------------- "; exit 1;
     fi
     if ! mayberun git config --add remote.${n}.fetch +refs/heads/*:refs/heads/_${n}/*; then
        echo "------------- !!! unable to configure remote fetch ${n} ${url} ------------- "; exit 1;
     fi
     if ! mayberun git config --add remote.${n}.fetch +refs/heads/*:refs/heads/*; then
        echo "------------- !!! unable to configure remote fetch to origin ------------- "; exit 1;
     fi

    )
}

function clone_repo_more {
    local path=${base}/${1}.git
    local n=${2}
    local url=${3}
    (cd ${path};
     if ! mayberun git remote set-url ${n} --add ${url}; then
        echo "------------- !!! unable to add more remote ${n} : ${url} --------------"; exit 1;
     fi
    )
}

function clone_repo_fetch {
    local path=${base}/${1}.git
    if [ "${nofetch}" = "0" ]; then
      (cd ${path};
       if ! mayberun git fetch --all; then
          echo "------------- !!! unable to fetch all ------------- "; exit 1;
       fi
      )
    fi;
}
####################################


function array_restof () {
    local i
    local -n ldest
    local -n lsrc
    local -n ldiff
    local -A hsrc
    local -A hdiff
    ldest=$1
    lsrc=$2
    ldiff=$3
    ldest=()
    for i in ${ldiff[@]}; do
	hdiff["$i"]="$i"; done
    for i in ${lsrc[@]}; do
	if [[ ! ${hdiff[${i}]+def} ]]; then
	    ldest+=(${i})
	fi
    done
}

function array_and () {
    local i
    local -n ldest
    local -n lsrc
    local -n ldiff
    local -A hsrc
    local -A hdiff
    ldest=$1
    lsrc=$2
    ldiff=$3
    ldest=()
    for i in ${ldiff[@]}; do
	hdiff["$i"]="$i"; done
    for i in ${lsrc[@]}; do
	if [[ ${hdiff["${i}"]+def} ]]; then
	    ldest+=(${i})
	fi
    done
}

function testarops () {
    local -a destnew
    local -a destexisting
    local -a destrem
    local -a ar0
    local -a ar1
    ar0=( 3 4 5)
    ar1=( 1 2 3 4)

    array_restof destnew      ar1 ar0
    array_and    destexisting ar0 ar1
    echo "oldar:"
    printar ar0
    echo "newar:"
    printar ar1
    array_restof destrem      ar0 ar1

    echo; echo "new:"
    printar destnew
    echo "existing:"
    printar destexisting
    echo "removed:"
    printar destrem
}

function join_by { local IFS="$1"; shift; echo -n "$*"; }

function asjson_ar {
    local i
    local -n lar
    lar=$1
    printf "[ "
    join_by , $(for i in ${lar[@]}; do printf " \"%s\"" ${i}; done)
    printf " ]"
}



####################################

# use nameref "-n" variable given as name
function printar() {
    local -n larray
    larray=$1
    for i in $(seq 0 $(( ${#larray[@]}-1 )) ); do printf "%04d: '%s'\n" $i ${larray[$i]}; done
}

function printhash() {
    local -n larray
    larray=$1
    for i in ${!larray[@]}; do printf "%s: '%s'\n" $i ${larray[$i]}; done
}

# note: json id is without ".git" ending, repository directories in ${base} need to end with .git
function jq_get_newrepos () {
    local i; local j;
    local -n r_newrepo
    local -n r_existingrepos
    local -n r_undefrepo
    local -A repos
    r_newrepo=$1
    r_existingrepos=$2
    r_undefrepo=$3
    for i in $(cat $4  | jq -r '.[] | .id'); do
	repos["${i}"]="${i}"
    done
    for i in $( (for j in ${repos[@]}; do echo $j; done) | sort ); do
	if [ ! -f ${base}/${i}.git/config ]; then
	    r_newrepo+=($i)
	else
	    r_existingrepos+=($i)
	fi
    done
    # extract the repositories that are unattended
    for i in $(ls ${base}); do
	if [ -f ${base}/${i}/config -a -d ${base}/${i}/objects ]; then
	    if [[ ! "${repos[${i/%.git/}]+1}" ]]; then
		r_undefrepo+=(${i/%.git/})
	    fi
        fi
    done
    #printar r_newrepo
    #printar r_undefrepo
}

function jq_get_newreposclone () {
    true
}

# retrieve the defined git remotes of $2
function remotes_of () {
    local i;
    local -n l_remotes
    local regex="^remote\.([a-z_0-9\-]+)\.url=(.*)"
    l_remotes=$1
    l_remotes=()
    for i in $(git -C $2 config -l ) ; do
	if [[ $i =~ $regex ]]; then
            l_remotes+=("${BASH_REMATCH[1]}")
	fi
    done
}

# retrieve the defined git remotes of $2
function jq_remotes_of () {
    local i
    local -n l_remotes
    l_remotes=$1
    l_remotes=()
    for i in $(cat $3 | jq -r ".[] | select(.id==\"${2}\") | .remotes |.[] | .name"); do
	l_remotes+=("$i")
    done
}

function jq_get_newremotes () {
    local i; local d; local idx
    local -n r_existingrepos
    local -n r_newremotes
    local -n r_existingremotes
    local -n r_undefremotes

    r_existingrepos=$1
    r_newremotes=$2
    r_existingremotes=$3
    r_undefremotes=$4

    idx=0
    for i in ${r_existingrepos[@]}; do
	local -a remotes
	local -a jq_remotes
	remotes_of remotes ${base}/${i}.git
	jq_remotes_of jq_remotes ${i} ${5}

	array_restof r_newremotes      jq_remotes remotes
	array_and    r_existingremotes jq_remotes remotes
	array_restof r_undefremotes    remotes    jq_remotes

	d=.tmp/${i}/remote
	mkdir -p ${d}
	cat <<EOF > ${d}/env.txt
local -a r_newremotes
local -a r_existingremotes
local -a r_undefremotes
r_newremotes=(${r_newremotes[@]})
r_existingremotes=(${r_existingremotes[@]})
r_undefremotes=(${r_undefremotes[@]})
EOF

	idx=$((idx+1))
    done
}

function jq_get_newremotes_add () {
    true
}

function jq_get_newurls () {


    true
}

function jq_get_newurls_add () {
    true
}
