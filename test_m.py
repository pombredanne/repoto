import os, sys, re, argparse
from repo.manifest import manifest

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("-f", "--file", type=str, help="input manifest")
    args = parser.parse_args()
    o0 = manifest(args.file);

    def print_elem(e):
        print (str(e));
    o0.traverse(['elem'], lambda x: print_elem(x))

    print("Hirarchies:");
    def print_hirarchy(e):
        print (str(e));
    o0.traverse(['manifest'], lambda x: print_hirarchy(x))

    print("Removes:");
    def print_remove(e):
        print (str(e));
    o0.traverse(['remove_project'], lambda x: print_remove(x))
    
if __name__ == "__main__":
    main()
    
