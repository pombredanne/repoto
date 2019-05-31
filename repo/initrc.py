import os, shutil, difflib;
from pprint import pprint
#from sets import Set
import pickle, html
import pystache
from repo.initrcexpr import initrc_expr
from repo.propparse import parse_prop
from glob import glob;
import os, sys, re, argparse, json
from json import dumps, loads, JSONEncoder, JSONDecoder

VERBOSE=1

def dbgprint(d):
    if VERBOSE:
        pass
        print(d)
def noroot(p):
    if (p.startswith("/")):
        return p[1:]
    return p;

class initrc_file(object):
    def __init__(self, ctx, fn=None, loadedfrom=os.getcwd()):
        super(initrc_file,self).__init__()
        self.parent = loadedfrom;
        self.ctx = ctx
        self.fn = fn
        lines = []
        self.lines = [];
        if fn is None:
            return
        if (fn in ctx['mappings']):
            fn = ctx['mappings'];
        #else:
        (root,fn) = self.mappath(fn)
        self.fn_host = None;
        if os.path.exists(fn):
            with open(fn,"r") as f:
                lines = f.readlines()
            self.fn_host = fn;
        else:
            pass
            print("------ cannot open {}".format(fn))
        idx = 1
        for l in lines:
            self.lines.append(initrc_line(self, idx, l))
            idx += 1
    def alllines(self):
        return self.lines

    def mappath(self, fn):
        if (fn.startswith("/system")):
            return (self.ctx['rootsystem'],os.path.join(self.ctx['rootsystem'],fn[len("/system/"):]))
        elif (fn.startswith("/vendor")):
            return (self.ctx['rootvendor'],os.path.join(self.ctx['rootvendor'],fn[len("/vendor/"):]))
        elif (fn.startswith("/")):
            return (self.ctx['root'],os.path.join(self.ctx['root'],fn[1:]))
        return (self.ctx['curpath'],os.path.join(self.ctx['curpath'],fn))

class initrc_line(object):
    def __init__(self, f, lnr, l):
        super(initrc_line,self).__init__()
        self.f = f;
        self.lnr = lnr;
        self.l = l.replace("\n","");
    def line(self):
        return self.l;
    def isimport(self):
        return self.l.startswith("import");
    def importfile(self):
        m = re.match(r"import\s+(.*)", self.l)
        return m.group(1);
    def iscomment(self):
        return re.match(r"^\s*#", self.l) or re.match(r"^\s*$", self.l);
    def isservice(self):
        return re.match(r"^service ", self.l);
    def isstartaction(self):
        return re.match(r"^[a-zA-Z]", self.l);
    def __str__(self):
        return "{}:{:04d}:{}".format(self.f.fn, self.lnr, self.l)
    def path(self):
        return "{}:{:d}".format(self.f.fn, self.lnr)
    def hostpath(self):
        return "{}:{:d}".format(self.f.fn_host, self.lnr)

######################################

class initrc_entity(object):
    def __init__(self):
        super(initrc_entity,self).__init__()
        self.cmds = []
    def push(self,l):
        self.cmds.append(l)
    def close(self):
        pass

class initrc_action(initrc_entity):
    def __init__(self, l):
        super(initrc_action,self).__init__()
        self.l = l
        self.setprops = {}
        self.trigger_event = {}
        self.trigger_prop = {}
        self.expr = initrc_expr(self,l)
    def __str__(self):
        return "action {} : {}".format(str(self.l),str(self.expr))
    def close(self):
        for l in self.cmds:
            if (l.line().strip().startswith("setprop")):
                a = re.split(r"\s+",l.line().strip())
                self.setprops[a[1]] = a[2];
                print ("####= {}={}".format(a[1],a[2]));
    def json(self):
        return {
            'typ' : 'action',
            'line' : self.l.line(),
            'actions' : [ l.line() for l in self.cmds ],
            'trig_event' : self.trigger_event,
            'trig_prop' : self.trigger_prop,
            'set' : self.setprops,
            'path' : self.l.hostpath()
        };


class initrc_service(initrc_entity):
    def __init__(self, l):
        super(initrc_service,self).__init__()
        self.l = l
    def __str__(self):
        return "service {} : {}".format(str(self.l),str(self.expr))
    def json(self):
        return { 'typ' : 'service',
                 'line' : self.l.line()
        };

######################################

class initrc_parse(object):
    
    def __init__(self, ctx, a):
        super(initrc_parse,self).__init__()
        self.files = []
        self.fa = []
        self.ctx = ctx

        rootfile = initrc_file(self.ctx);
        for fna in a:
            (r,fn) = rootfile.mappath(fna)
            #print("\n###################################\nTry path {} : {}".format(fna,fn) );
            if os.path.isdir(fn) and os.path.exists(fn):
                for fe in [f for f in os.listdir(fn) if os.path.isfile(f)]:
                    _fe = fe[len(r):]
                    #print("Path target: {}: host: {}".format(_fe, fe));
                    self.tryaddfile(_fe);
            else:
                _fn = fn[len(r):]
                #print("Path target: {}: host: {}".format(_fn, fn));
                self.tryaddfile(_fn);
        self.currule = None
        self.rules = []
        self.parse()

    def tryaddfile(self,fn):
        e = initrc_file(self.ctx, fn);
        self.fa += e.alllines()
        self.files.append(e)

    def substituteVar(self,l):
        def lookup(match):
            l = match.group(1)
            dbgprint("Lookup: {}".format(l))
            if l in self.ctx['lookup']:
                return self.ctx['lookup'][l]
            return "..undef.."
        return re.sub(r'\$\{([a-zA-Z0-9\.]+)\}', lookup, l)
    
    def finishentity(self):
        if not (self.currule == None):
            self.currule.close()
            self.rules.append(self.currule)
            
    def startaction(self, l):
        self.finishentity()
        self.currule = initrc_action(l)

    def startservice(self, l):
        self.finishentity()
        self.currule = initrc_service(l)

    def pushrule(self,l):
        self.currule.push(l)
        
    def json(self):
        return {
            'rules' : [r.json() for r in self.rules]
        };

    def parse(self):
        while len(self.fa):
            l = self.fa.pop(0)
            if (l.iscomment()):
                pass
            elif (l.isimport()):
                dbgprint("\n>>>>> Import: {} -----".format(l))
                fn = l.importfile()
                fn = self.substituteVar(fn)
                e = initrc_file(self.ctx, fn, loadedfrom=l.f)
                self.fa = e.alllines() + self.fa;
                self.files.append(e)
            elif l.isservice():
                self.startservice(l);
            elif (l.isstartaction()):
                self.startaction(l);
                dbgprint("\n----- Start rule: {} : {} -----".format(str(l),str(self.currule)))
            else:
                dbgprint(str(l))
                self.pushrule(l)
        self.finishentity();



######################################

class flatparse(object):
    def __init__(self, args, jsonin):
        super(flatparse,self).__init__()
        with open(jsonin, 'r') as f:
            self._jsonin = json.load(f)
        self.propparse = parse_prop();
        for pf in self._jsonin['defprop']:
            self.propparse.parse(pf)

        self.ctx = {
            'root' : self._jsonin['root'],
            'rootvendor' : self._jsonin['rootvendor'],
            'rootsystem' : self._jsonin['rootsystem'],
            'mappings':{},
            'lookup': self.propparse,
            'curpath': os.getcwd()
        }

        for f in ['root', 'rootvendor', 'rootsystem']:
            if self.ctx[f].endswith("/"):
                self.ctx[f] = self.ctx[f][:-1];
        #for p in args.extraprop:
        #    self.propparse.addextraprop(p);

        self.args = args
        self.parsed = initrc_parse(self.ctx, self._jsonin['input'])

    def json(self):
        return {
            'param' : self._jsonin,
            'parsed' : self.parsed.json() };
