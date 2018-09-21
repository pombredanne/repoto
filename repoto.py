import os, sys, re, argparse
from repo.manifest import manifest, mh_project, mh_remove_project

class projar():
    def __init__(self):
        self.p = []
    def add(self,e):
        self.p.append(e)
    def rem(self,e):
        self.p = [ p for p in self.p if not (p.name ==  e.name) ]
    
def flatten(args):
    o0 = manifest(args.file);
    p = projar()
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

def update(args):
    a0 = manifest(args.aosp);
    o0 = manifest(args.file);
    p = projar()
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
    
    
def parse(args):

    o0 = manifest(args.file);
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

def main():

    parser = argparse.ArgumentParser(prog='repoto')
    parser.add_argument('--verbose', action='store_true', help='verbose')
    subparsers = parser.add_subparsers(help='sub-commands help')
    
    # create the parser for the "flatten" command
    parser_a = subparsers.add_parser('flatten', help='flatten and sort projects')
    parser_a.add_argument('--sort', '-x', action='count')
    parser_a.add_argument('--remove-path', '-r', dest='removepath', default=None)
    parser_a.add_argument('file', type=str, help='root maifest')
    parser_a.add_argument('output', type=str, help='flattend output')
    parser_a.set_defaults(func=flatten)

    # create the parser for the "update" command
    parser_a = subparsers.add_parser('update', help='update shas')
    parser_a.add_argument('--sort', '-x', action='count')
    parser_a.add_argument('--remove-path', '-r', dest='removepath', default=None)
    parser_a.add_argument('--aosp', '-a', dest='aosp', default=None)
    parser_a.add_argument('file', type=str, help='root maifest')
    parser_a.add_argument('output', type=str, help='flattend output')
    parser_a.set_defaults(func=update)
    
    # create the parser for the "parse" command
    parser_b = subparsers.add_parser('parse', help='parse and print info on projects')
    parser_b.add_argument('file', type=str, help='root manifest')
    parser_b.set_defaults(func=parse)

    opt = parser.parse_args()
    opt.func(opt)

if __name__ == "__main__":
    main()
    
