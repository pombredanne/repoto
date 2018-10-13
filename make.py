import os, sys, re, argparse
from mk.parse import makefile, ctx

class projar():
    pass

def flatten(args):
    o0 = makefile(args.file);
    o0.parse(o0.ctx)
    
def parse(args):
    o0 = makefile(args.file);

def unit(args):
    o0 = makefile(args.file);
    p = o0.parseStr(ctx([]),"$(call a,$1,$(v))")
    print(p.dbgstr())
    
def main():

    parser = argparse.ArgumentParser(prog='repoto')
    parser.add_argument('--verbose', action='store_true', help='verbose')
    subparsers = parser.add_subparsers(help='sub-commands help')
    
    # create the parser for the "flatten" command
    parser_a = subparsers.add_parser('flatten', help='flatten makefile')
    parser_a.add_argument('file', type=str, help='root makefile')
    parser_a.add_argument('output', type=str, help='flattend output')
    parser_a.set_defaults(func=flatten)
    
    # create the parser for the "parse" command
    parser_b = subparsers.add_parser('parse', help='parse and print makefile info')
    parser_b.add_argument('file', type=str, help='root makefile')
    parser_b.set_defaults(func=parse)


    # create the parser for the "parse" command
    parser_c = subparsers.add_parser('unit', help='parse and print makefile info')
    parser_c.add_argument('file', default=None, type=str, help='root makefile')
    parser_c.set_defaults(func=unit)

    
    opt = parser.parse_args()
    opt.func(opt)

if __name__ == "__main__":
    main()
    
