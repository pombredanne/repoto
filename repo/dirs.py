import os, shutil, difflib;
from pprint import pprint
#from sets import Set
import pickle, html
import pystache
import os, sys, re, argparse, json
from json import dumps, loads, JSONEncoder, JSONDecoder

class PythonObjectEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (list, dict, str, unicode, int, float, bool, type(None))):
            return JSONEncoder.encode(self, obj)
        elif isinstance(obj, set):
            return JSONEncoder.encode(self, list(obj)) #str(obj) #"set([{}])".format(",".join([ PythonObjectEncoder.default(self,i) for i in list(obj)]))
        return pickle.dumps(obj)

class filesunder(object):
    def __init__(self, args, d):
        super(filesunder,self).__init__()
        self.args = args
        self.d = d
        self.filehash = set()
        self.dirhash = set()
        self.diffhistory = {};
        self.retrieve()

    def noroot(self,a):
        b = a;
        if b.startswith(self.d):
            b=b[len(self.d):]
        if b.startswith('/'):
            b = b[1:]
        return b;

    def retrieve(self):
        for root, dirs, files in os.walk(self.d):
            r = self.noroot(root)
            if (len(r)):
                self.dirhash.add(r)
            if files:
                for f in files:
                    fn = os.path.join(root, f)
                    self.filehash.add(self.noroot(fn))
            if dirs:
                for d in dirs:
                    dn = os.path.join(root, d)
                    self.dirhash.add(self.noroot(dn))

    def diff(self, b):
        self.filehash_onlya = self.filehash - b.filehash;
        self.filehash_onlyb = b.filehash - self.filehash;
        self.filehash_ab = self.filehash & b.filehash;
        for f in self.filehash_ab:
            ap = os.path.join(self.d, f);
            bp = os.path.join(b.d, f);
            typea = os.popen('file {}'.format(ap)).read()
            if (typea.startswith(ap)):
                typea = typea[len(ap):]
            usediff = 0;
            if re.search("ASCII", typea):
                usediff=1
            elif re.search("x86-64", typea):
                usediff=2
            if usediff:
                if (usediff==1):
                    d = os.popen('diff -Naur {} {}'.format(ap,bp)).readlines()
                elif (usediff==2):
                    d = os.popen('bash -c "diff -Naur <( strings {} ) <( strings {})"'.format(ap,bp)).readlines()
                if (len(d)):
                    print("{} changed: {}".format(ap, len(d)));
                    _d = []; l = 0;
                    for i in d:
                        l += len(i);
                        _d.append(i);
                        if (self.args.maxdiff > 10000):
                            _d.append(" ... discard rest ...")
                            break;
                    d = [ html.escape(i) for i in _d ]
                    d = json.dumps({'d':d});
                    with open(".tmp.data","w") as h:
                        h.write(d);
                    d = os.popen('gzip -c .tmp.data | base64 -w0'.format(ap,bp)).read()
                    self.diffhistory[f] = d;

        self.dirhash_onlya = self.dirhash - b.dirhash;
        self.dirhash_onlyb = b.dirhash - self.dirhash;
        self.dirhash_ab = self.dirhash & b.dirhash;
