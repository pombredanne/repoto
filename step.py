#!/usr/bin/python3
import os, sys, re, argparse, json
from repo.manifest import manifest, mh_project, mh_remove_project, projar, mh_remote
import xml.etree.ElementTree as ET
from xml.etree.ElementTree import tostring
from json import dumps, loads, JSONEncoder, JSONDecoder

def main():
    parser = argparse.ArgumentParser(prog='step manifest')
    parser.add_argument('--verbose', action='store_true', help='verbose')
    parser.add_argument('--addserver', action='append', default=[], help='specify upstream server: --addserver <servername>=url')
    parser.add_argument('--rewriteproj', action='append', default=[], help='specify upstream id for project: "--rewrite <pname>=servername:upstream:sha", where servername can be specified via --addserver')
    parser.add_argument('--remove-path', '-r', dest='removepath', default=None)
    parser.add_argument('file', type=str, help='root maifest')
    parser.add_argument('output', type=str, help='flattend output')
    args = parser.parse_args()

    o0 = manifest(args, args.file);
    p = projar(None,args)
    # traverse over elements and process remove-project and project
    def touchproj(e):
        if isinstance(e,mh_project):
            p.add(e)
        elif isinstance(e,mh_remove_project):
            p.rem(e)
    o0.traverse(['elem'], lambda x: touchproj(x))

    # optionally rewrite project path using option --remove-path
    h = {}
    projects = p.p
    for p in projects:
        h[p.name] = p;
        n = str(p)
        print (" "+n);

    #<remote name="origin" fetch="../../" review="ssh://bsdvm022.debads.europe.delphiauto.net:8080"/>

    # add new review servers
    for r in args.addserver:
        n = r.split("=")
        a = n[1].split(":")
        n = n[0]
        print("addserver {} : server {} ".format(n, a[0]));
        m = mh_remote(args, None, ET.Element('remote'))
        m.addxml('name', n);
        o0.add_remote(m);

    # rewrite upstream and sha field
    for r in args.rewriteproj:
        n = r.split("=")
        a = n[1].split(":")
        n = n[0]
        print("rewrite {} : server {} upstream {} sha {} ".format(n, a[0], a[1], a[2]));
        if (n in h):
            p = h[n];
            if (len(a[0])):
                p.addxml('remote', a[0]);
            p.addxml('upstream', a[1]);
            p.setxml('revision', a[2]);
        else:
            raise("Project {} not found".format(n));
    # output
    o0.write(args.output)

if __name__ == "__main__":
    main()
    
