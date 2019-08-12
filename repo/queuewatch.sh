#!/bin/bash

function get_nr_pending ()  {
    local -n l_list
    local IFS
    l_list=$1
    l_list=()

    regex="[0-9]+ queued"
    IFS=$'\n'
    for l in $(ts)
    do
	if [[ $l =~ $regex ]]
	then
	    l_list+=($l)
	fi
    done
}

function get_finished_list ()  {
    local -n l_list
    local IFS
    l_list=$1
    l_list=()

    regex="[0-9]+ finished"
    IFS=$'\n'
    for l in $(ts)
    do
	if [[ $l =~ $regex ]]
	then
	    l_list+=($l)
	fi
    done
}

declare -a finished
declare -a pending

while true; do
    get_finished_list finished
    get_finished_list pending

    for i in $(seq 0 $(( ${#finished[@]}-1 )) ); do
	f=${finished[$i]}
	#echo " >> $f <<"
	id=$(echo $f | awk '{ print $1 }')
	rstatus=$(echo $f | awk '{ print $4 }')

	echo "Finished ${id} (${rstatus}):"
	ts -c ${id}
	ts -r ${id}
    done
    echo "Sleep"
    sleep 1
done
