#!/usr/bin/python
import os, sys, re, argparse
from repo.manifest import manifest, mh_project, mh_remove_project, projar
from xml.etree.ElementTree import tostring

def listrepos(args):
    o0 = manifest(args, args.file);
    p = projar(None,args)
    def touchproj(e):
        if isinstance(e,mh_project):
            p.add(e)
    o0.traverse(['elem'], lambda x: touchproj(x))
    projects = p.p
    for p in projects:
        n = str(p)
        print (p.name);


def flatten(args):
    o0 = manifest(args, args.file);
    p = projar(None,args)
    def touchproj(e):
        if isinstance(e,mh_project):
            p.add(e)
        elif isinstance(e,mh_remove_project):
            p.rem(e)
    o0.traverse(['elem'], lambda x: touchproj(x))
    projects = p.p
    if args.sort:
        projects = sorted(projects, key=lambda x: x.name)
    
    for p in projects:
        n = str(p)
        if not (args.removepath is None):
            n = n.replace(args.removepath,"")
        print (" "+n);
    o0.write(args.output)

def convbare(args):
    o0 = manifest(args, args.file);
    p = projar(None,args)
    def touchproj(e):
        if isinstance(e,mh_project):
            p.add(e)
        elif isinstance(e,mh_remove_project):
            p.rem(e)
    o0.traverse(['elem'], lambda x: touchproj(x))
    projects = p.p
    
    for p in projects:
        n = p.name
        pa = p.path
        if not (args.removepath is None):
            n = n.replace(args.removepath,"")
        if pa is None:
            pa = n
        print ("{} {}".format(n,pa));
    
def update(args):
    a0 = manifest(args, args.aosp);
    o0 = manifest(args, args.file);
    
    a0_p = a0.flatten()
    o0_p = o0.flatten()

    for p in a0_p.projects():
        if (o0_p.contain(p)):
            o0_p.updateshawith(p)
        else:
            o0_p.addproject(p)
    
    o0.write(args.output)

def filteraosp(args):
    a0 = manifest(args, args.aosp);
    o0 = manifest(args, args.file);
    
    a0_p = a0.flatten()
    o0_p = o0.flatten()
    
    aout = projar(None,args)
    
    for p in o0_p.projects():
        if (a0_p.contain(p)):
            aout.add(p)
    
    for p in aout.projects():
        sys.stdout.write(tostring(p.xml))
    
def diff(args):
    a0 = None
    if not (args.aosp is None):
        a0 = manifest(args, args.aosp);
        a0_p = a0.flatten()
    o0 = manifest(args, args.file1);
    target = manifest(args, args.file2);
    
    o0_p = o0.flatten()
    target_p = target.flatten()

    a_removed = projar(None,args)
    a_changed = projar(None,args)
    a_added   = projar(None,args)

    for p in target_p.projects():
        if (o0_p.contain(p)):
            if (o0_p.changed(p)):
                a_changed.add(p)
                f = o0_p.getProject(p)
                print ("change {}->{}:{}".format(f.revision,p.revision,p.name)) 
            else:
                pass
        else:
            a_added.addproject(p)
    
    for p in o0_p.projects():
        if not (target_p.contain(p)):
            a_removed.add(p)
            
    print ("Remove:");
    for p in a_removed.projects():
        print(" "+str(p))

    print ("Changed:");
    for p in a_changed.projects():
        print(" "+str(p))
        
    print ("Added:");
    for p in a_added.projects():
        print(" "+str(p))
    
    for p in a_changed.projects() + a_removed.projects():
        print( "<remove-project name=\"{}\"/>".format(p.name))
    for p in a_changed.projects() + a_added.projects():
        sys.stdout.write(tostring(p.xml))
    
def removed(args):
    o0 = manifest(args, args.file);
    o0_p = o0.flatten()
    
    p = projar(None,args)

    def searchremoved(e):
        if isinstance(e,mh_remove_project):
            p.rem(e)
            p.add(e)
    o0.traverse(['elem'], lambda x: searchremoved(x))
    projects = p.p
    removed_projects={}
    for p in projects:
        n = p.name
        if not (args.removepath is None):
            n = n.replace(args.removepath,"")
        removed_projects[n] = p
        print ( " + "+str(p))

    if not (args.aosp is None):
        print ("Removed aosp projects")
        a0 = manifest(args, args.aosp);
        a0_p = a0.flatten()
        for p in a0_p.projects():
            n = p.name
            a2 = [ e for e in o0_p.projects() if e.shortname(args) == n]
            if n in removed_projects:
                print ( " + aos-rev:{} ihu-rev:{} aosp/{} {}".format(p.revision,a2[0].revision,str(removed_projects[n]),p.path))
        
def parse(args):

    o0 = manifest(args, args.file);
    print("Elements:");
    def print_elem(e):
        print (" "+str(e));
    o0.traverse(['elem'], lambda x: print_elem(x))

    print("Hirarchies:");
    def print_hirarchy(e):
        print (" "+str(e));
    o0.traverse(['manifest'], lambda x: print_hirarchy(x))

    print("Removes:");
    def print_remove(e):
        print (" "+str(e));
    o0.traverse(['remove_project'], lambda x: print_remove(x))

def getaosp_projects(args):
    if (args.aosp is None):
        raise("--aosp required")
    a0 = manifest(args, args.aosp);
    a0_p = a0.flatten()
    return a0_p

    
def isaosp(args):
    a = getaosp_projects(args)
    n = args.repo
    found=0
    for p in a.projects():
        if p.nameorpath(args) == n:
            found=1
            break;
    if found:
        sys.stdout.write("yes");
    else:
        sys.stdout.write("no");
    

def getrev(args):
    a = getaosp_projects(args)
    n = args.repo
    found=0
    for p in a.projects():
        if p.nameorpath(args) == n:
            sys.stdout.write(p.revision)
            break;
    
    
def main():

    parser = argparse.ArgumentParser(prog='repoto')
    parser.add_argument('--verbose', action='store_true', help='verbose')
    parser.add_argument('--log', type=str, default=None, help='logfile')
    parser.add_argument('--sort', '-x', action='count')
    parser.add_argument('--remove-path', '-r', dest='removepath', default=None)
    parser.add_argument('--aosp', '-a', dest='aosp', default=None)
    subparsers = parser.add_subparsers(help='sub-commands help')
    
    # create the parser for the "flatten" command
    parser_a = subparsers.add_parser('flatten', help='flatten and sort projects')
    parser_a.add_argument('--sort', '-x', action='count')
    parser_a.add_argument('--remove-path', '-r', dest='removepath', default=None)
    parser_a.add_argument('file', type=str, help='root maifest')
    parser_a.add_argument('output', type=str, help='flattend output')
    parser_a.set_defaults(func=flatten)

    # create the parser for the "update" command
    parser_b = subparsers.add_parser('update', help='update shas')
    parser_b.add_argument('--defserver', '-A', dest='defserver', default=None)
    parser_b.add_argument('file', type=str, help='root maifest')
    parser_b.add_argument('output', type=str, help='flattend output')
    parser_b.set_defaults(func=update)

    # "removed" command
    parser_c = subparsers.add_parser('removed', help='list removed aosp projects')
    parser_c.add_argument('--defserver', '-A', dest='defserver', default=None)
    parser_c.add_argument('--aosp', '-a', dest='aosp', default=None)
    parser_c.add_argument('file', type=str, help='root maifest')
    parser_c.set_defaults(func=removed)

    # convert repo sync tree to bare repos
    parser_d = subparsers.add_parser('convbare', help='convert')
    parser_d.add_argument('file', type=str, help='root maifest')
    parser_d.set_defaults(func=convbare)
    
    # create the parser for the "parse" command
    parser_e = subparsers.add_parser('parse', help='parse and print info on projects')
    parser_e.add_argument('file', type=str, help='root manifest')
    parser_e.set_defaults(func=parse)

    # "diff" command
    parser_f = subparsers.add_parser('diff', help='diff projects')
    parser_f.add_argument('--defserver', '-A', dest='defserver', default=None)
    parser_f.add_argument('file1', type=str, help='root maifest 1')
    parser_f.add_argument('file2', type=str, help='root maifest 2')
    parser_f.set_defaults(func=diff)

    # "isaosp" command
    parser_g = subparsers.add_parser('isaosp', help='is aosp repo')
    parser_g.add_argument('repo', type=str, help='repo')
    parser_g.set_defaults(func=isaosp)

    # "getrev" command
    parser_g = subparsers.add_parser('getrev', help='getrev repo')
    parser_g.add_argument('repo', type=str, help='repo')
    parser_g.set_defaults(func=getrev)

    # "getrev" command
    parser_h = subparsers.add_parser('filter', help='filter aosp')
    parser_h.add_argument('file', type=str, help='repo')
    parser_h.set_defaults(func=filteraosp)
    
    # create the parser for the "flatten" command
    parser_list = subparsers.add_parser('list', help='list repos')
    parser_list.add_argument('file', type=str, help='root manifest')
    parser_list.set_defaults(func=listrepos)

    opt = parser.parse_args()
    opt.func(opt)

if __name__ == "__main__":
    main()
    
