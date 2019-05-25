import os, shutil;
from pprint import pprint
from sets import Set
import pickle
import pystache
import os, sys, re, argparse, json

class filesunder(object):
    def __init__(self, args, d):
        super(filesunder,self).__init__()
        self.args = args
        self.d = d
        self.filehash = Set()
        self.dirhash = Set()
        self.retrieve()

    def retrieve(self):
        for root, dirs, files in os.walk(self.d):
            self.dirhash.add(root)
            if files:
                for f in files:
                    fn = os.path.join(root, f)
                    self.filehash.add(fn)
            if dirs:
                for d in dirs:
                    dn = os.path.join(root, d)
                    self.dirhash.add(fn)

    def diff(self, b):
        self.filehash_onlya = self.filehash - b.filehash;
        self.filehash_onlyb = b.filehash - self.filehash;
        self.filehash_ab = self.filehash & b.filehash;
        self.dirhash_onlya = self.dirhash - b.dirhash;
        self.dirhash_onlyb = b.dirhash - self.dirhash;
        self.dirhash_ab = self.dirhash & b.dirhash;
