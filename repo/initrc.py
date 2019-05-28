import os, shutil, difflib;
from pprint import pprint
#from sets import Set
import pickle, html
import pystache
from repo.initrcexpr import initrc_expr
from glob import glob;
import os, sys, re, argparse, json
from json import dumps, loads, JSONEncoder, JSONDecoder

VERBOSE=1

def dbgprint(d):
    if VERBOSE:
        print(d)
def noroot(p):
    if (p.startswith("/")):
        return p[1:]
    return p;

class initrc_file(object):
    def __init__(self, ctx, fn):
        super(initrc_file,self).__init__()
        self.ctx = ctx
        self.fn = fn
        if (fn in ctx['mappings']):
            fn = ctx['mappings'];
        else:
            fn = os.path.join(ctx['root'],noroot(fn));
        with open(fn,"r") as f:
            lines = f.readlines()
        self.lines = []; 
        idx = 1
        for l in lines:
            self.lines.append(initrc_line(self, idx, l))
            idx += 1
    def alllines(self):
        return self.lines

class initrc_line(object):
    def __init__(self, f, lnr, l):
        super(initrc_line,self).__init__()
        self.f = f;
        self.lnr = lnr;
        self.l = l.replace("\n","");
    def isimport(self):
        return self.l.startswith("import");
    def importfile(self):
        m = re.match(r"import\s+(.*)", self.l)
        return m.group(1);
    def iscomment(self):
        return re.match(r"^\s*#", self.l) or re.match(r"^\s*$", self.l);
    def isservice(self):
        return re.match(r"^service ", self.l);
    def isstartrule(self):
        return re.match(r"^[a-zA-Z]", self.l);
    def __str__(self):
        return "{}:{:04d}:{}".format(self.f.fn, self.lnr, self.l)

class initrc_entity(object):
    def __init__(self):
        super(initrc_entity,self).__init__()
        self.cmds = []
    def push(self,l):
        self.cmds.append(l)

class initrc_rule(initrc_entity):
    def __init__(self, l):
        super(initrc_rule,self).__init__()
        self.l = l
        self.expr = initrc_expr(l)
    def __str__(self):
        return "event {} : {}".format(str(self.l),str(self.expr))

class initrc_service(initrc_entity):
    def __init__(self, l):
        super(initrc_service,self).__init__()
        self.l = l
    def __str__(self):
        return "service {} : {}".format(str(self.l),str(self.expr))

class initrc_parse(object):
    
    def __init__(self, ctx, a):
        super(initrc_parse,self).__init__()
        self.fa = []
        self.ctx = ctx
        for fn in a:
            self.fa += initrc_file(ctx, fn).alllines()
        self.currule = None
        self.rules = []
        self.parse()
    
    def substituteVar(self,l):
        def lookup(match):
            l = match.group(1)
            dbgprint("Lookup: {}".format(l))
            return self.ctx['lookup'][l]
        return re.sub(r'\$\{([a-zA-Z0-9\.]+)\}', lookup, l)
    
    def finishentity(self):
        if not (self.currule == None):
            self.rules.append(self.currule)
            
    def startrule(self, l):
        self.finishentity()
        self.currule = initrc_rule(l)

    def startservice(self, l):
        self.finishentity()
        self.currule = initrc_service(l)

    def pushrule(self,l):
        self.currule.push(l)
        
    def parse(self):
        while len(self.fa):
            l = self.fa.pop(0)
            if (l.iscomment()):
                pass
            elif (l.isimport()):
                dbgprint("\n>>>>> Import: {} -----".format(l))
                fn = l.importfile()
                fn = self.substituteVar(fn)
                self.fa = initrc_file(self.ctx, fn).alllines() + self.fa;
            elif l.isservice():
                self.startservice(l);
            elif (l.isstartrule()):
                self.startrule(l);
                dbgprint("\n----- Start rule: {} : {} -----".format(str(l),str(self.currule)))
            else:
                dbgprint(str(l))
                self.pushrule(l)
        self.finishentity();

class flatparse(object):
    def __init__(self, args):
        ctx = {'root' : args.root, 
               'mappings':{}, 
               'lookup':{
                   'ro.hardware' : '64',
                   'ro.zygote' : 'zygote64'
                   }}
        super(flatparse,self).__init__()
        self.args = args
        self.parsed = initrc_parse(ctx, args.inputs)
