import os, shutil;
from pprint import pprint
import pickle
import pystache
import os, sys, re, argparse, json

class filesunder(object):
    def __init__(self, args, d):
        super(filesunder,self).__init__()
        self.args = args
        self.d = d
        self.retrieve()

    def retrieve(self):
        for root, dirs, files in os.walk(self.d):
            if files:
                for f in files:
                    fn = os.path.join(root, f)
            if dirs:
                for d in dirs:
                    pass
