#!/bin/bash -x

# Option parsing
nofetch=0
while [ $# -gt 0 ]; do
    case "$1" in
        -nofetch)   nofetch=1; shift ;;
        *)          break ;;
    esac
done

curbase=$(pwd)
base=$1
symlinkbase=$2
if [ -z ${base} ]; then echo "specify base"; exit 1; fi
if [ -z ${symlinkbase} ]; then echo "specify symlinkbase"; exit 1; fi

function clone_repo {
    local path=${base}/${1}.git
    local repo=${2}
    local linkpath=${3}
    echo "$1 : ${repo} => ${path} (${linkpath})"
    (mkdir -p ${path}; cd ${path};
    if ! git init --bare ; then
        echo "------------- !!! unable to init ${path} ------------- "; exit 1;
    fi
    git config uploadpack.allowTipSha1InWant true
    git config uploadpack.allowReachableSHA1InWant true
    )
    dfn=$(readlink -f ${path})
    lfn=${curbase}/${symlinkbase}/${linkpath}
    mkdir -p $(dirname ${lfn})
    ln -s ${dfn} ${lfn}.git
}

function clone_repo_new {
    local path=${base}/${1}.git
    local n=${2}
    local url=${3}
    (cd ${path};
     if ! git remote add ${n} ${url}; then
        echo "------------- !!! unable to add remote ${n} ${url} ------------- "; exit 1;
     fi
     if ! git config --add remote.${n}.fetch +refs/heads/*:refs/heads/_${n}/*; then
        echo "------------- !!! unable to configure remote fetch ${n} ${url} ------------- "; exit 1;
     fi
     if ! git config --add remote.${n}.fetch +refs/heads/*:refs/heads/*; then
        echo "------------- !!! unable to configure remote fetch to origin ------------- "; exit 1;
     fi

    )
}

function clone_repo_more {
    local path=${base}/${1}.git
    local n=${2}
    local url=${3}
    (cd ${path};
     if ! git remote set-url ${n} --add ${url}; then
        echo "------------- !!! unable to add more remote ${n} : ${url} --------------"; exit 1;
     fi
    )
}

function clone_repo_fetch {
    local path=${base}/${1}.git
    if [ "${nofetch}" = "0" ]; then
      (cd ${path};
       if ! git fetch --all; then
          echo "------------- !!! unable to fetch all ------------- "; exit 1;
       fi
      )
    fi;
}

