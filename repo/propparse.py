import os, shutil, difflib;
from pprint import pprint
#from sets import Set
import pickle, html
import pystache
from glob import glob;
import os, sys, re, argparse, json
from json import dumps, loads, JSONEncoder, JSONDecoder

class parse_prop(object):
    def __init__(self):
        super(parse_prop,self).__init__()
        self.h = {}

    def parse(self,fn):
        m = re.match("^([a-zA-Z0-9\-_\.]+)=([a-zA-Z0-9\-_\.\*,]*)",fn)
        if (m):
            self.h[m.group(1)] = { 'v' : m.group(2), 'src' : 'cmdline' };
            return
        with open(fn,"r") as f:
            self.a = f.readlines();
        idx = 0;
        for l in self.a:
            idx+=1
            l = l.strip()
            m = re.match("^([a-zA-Z0-9\-_\.]+)=([a-zA-Z0-9\-_\.\*,]*)",l)
            if (m):
                #print("Found prop: " + m.group(0))
                l = l[len(m.group(0)):]
                self.h[m.group(1)] = { 'v' : m.group(2) };
                continue
            if (re.match(r"^\s*#", l) or re.match(r"^\s*$", l)):
                #print("Found comment: " + l)
                continue
            else:
                raise(Exception("Cannot parse '{}'".format(l)))

    def addextraprop(self,l):
        m = re.match("^([a-zA-Z0-9\-_\.]+)=([a-zA-Z0-9\-_\.\*,]*)",l)
        if (m):
            #print("Found prop: " + m.group(0))
            l = l[len(m.group(0)):]
            self.h[m.group(1)] = { 'v' : m.group(2), 'src': 'cmdline' };

    def __getitem__(self, key):
        return self.h[key]['v'];
    def __contains__(self, key):
        return key in self.h
    def __str__(self):
        return "parsed:{}".format(" ".join([ str(i) for i in self.stack ]))
