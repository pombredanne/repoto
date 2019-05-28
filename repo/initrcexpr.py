import os, shutil, difflib;
from pprint import pprint
#from sets import Set
import pickle, html
import pystache
from glob import glob;
import os, sys, re, argparse, json
from json import dumps, loads, JSONEncoder, JSONDecoder

class parserule_event_prop(object):
    def __init__(self, a,b):
        super(parserule_event_prop,self).__init__()
    def __str__(self):
        pass

class parserule_event_op(object):
    def __init__(self, l):
        super(parserule_event_op,self).__init__()
    def __str__(self):
        pass

class parserule_event_source(object):
    def __init__(self, l):
        super(parserule_event_source,self).__init__()
    def __str__(self):
        pass

class initrc_expr(object):
    def __init__(self, l):
        super(initrc_expr,self).__init__()
        self.tok = []
        self.l = l
        self.cmds = []
        self.stack = []
        self.parserule()

    def peek(self):
        if len(self.tok)==0:
            return ""
        return str(self.tok[0]);
    def next(self):
        return self.tok.pop(0);

    def parserule_event(self,l):
        ori = l;
        while (len(l.strip())):
            l = l.strip()
            m = re.match("property:([a-zA-Z0-9\-_\.]+)=([a-zA-Z0-9\-_\.\*,]+)",l)
            if (m):
                l = l[len(m.group(0)):]
                self.tok.append(parserule_event_prop(m.group(1),m.group(2)))
                continue
            m = re.match("(&&|\|\|)",l)
            if (m):
                l = l[len(m.group(0)):]
                self.tok.append(parserule_event_op(m.group(0)))
                continue
            m = re.match("([a-zA-Z0-9\-_]+)",l)
            if (m):
                l = l[len(m.group(0)):]
                self.tok.append(parserule_event_source(m.group(0)))
                continue
            else:
                raise(Exception("Cannot parse '{}'".format(ori)))
        e = self.parse_expr()

    def parse_literal(self):
        o = self.next()
        if not (isinstance(o,(parserule_event_source,parserule_event_prop))):
            raise(Exception("Cannot parse expression"))
        self.stack.append(o)

    def parse_unary(self):
        self.parse_literal()
    def parse_expr_and(self):
        l = self.parse_unary()
        if (self.peek() == "||"):
            self.next()
            r = self.parse_unary()
            self.stack.append(o)

    def parse_expr_or(self):
        l = self.parse_expr_and()
        if (self.peek() == "&&"):
            o = self.next()
            r = self.parse_expr_and()
            self.stack.append(o)

    def parse_expr(self):
        self.parse_expr_or()

    def parserule_service(self,l):
        pass

    def parserule(self):
        l = self.l.l.strip()
        if (l.startswith("on ")):
            self.parserule_event(l[3:].strip())
        elif (l.startswith("service ")):
            self.parserule_service(l[len("service "):].strip())
        else:
            raise(Exception("Unknown rule"))
