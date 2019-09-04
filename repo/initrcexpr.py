import os, shutil, difflib;
from pprint import pprint
#from initrchtml import initrchtml
#from sets import Set
import pickle, html
import pystache
from glob import glob;
import os, sys, re, argparse, json
from json import dumps, loads, JSONEncoder, JSONDecoder

class parserule_event_prop(object):
    def __init__(self, a,b):
        super(parserule_event_prop,self).__init__()
        self.a = a;
        self.b = b;
    def __str__(self):
        return "{}={}".format(self.a,self.b);

class parserule_event_op(object):
    def __init__(self, l):
        super(parserule_event_op,self).__init__()
        self.l = l;
    def __str__(self):
        return self.l

class parserule_event_source(object):
    def __init__(self, l):
        super(parserule_event_source,self).__init__()
        self.l = l;
    def __str__(self):
        return self.l

class initrc_expr(object):
    def __init__(self, action, l):
        super(initrc_expr,self).__init__()
        self.action = action
        self.tok = []
        #print("Parse {}".format(str(l)))
        self.l = l
        self.cmds = []
        self.stack = []
        self.parserule()

    def peek(self):
        if len(self.tok)==0:
            return ""
        #print (self.tok)
        return str(self.tok[0]);

    def next(self):
        #print(self.tok)
        e = self.tok.pop(0)
        #print("+"+str(e))
        #print("Consume : {}".format(str(e)))
        return e;


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
        #print ("parsed: "+str(self.stack))

    def parserule_service(self,l):
        pass

    def parserule_event(self,l):
        ori = l;
        while (len(l.strip())):
            l = l.strip()
            m = re.match("property:([a-zA-Z0-9\-_\.]+)=([a-zA-Z0-9\-_\.\*,]+)",l)
            if (m):
                #print("Found prop: " + m.group(0))
                l = l[len(m.group(0)):]
                self.tok.append(parserule_event_prop(m.group(1),m.group(2)))
                print ("####? {}={}".format(m.group(1),m.group(2)));
                self.action.trigger_prop[m.group(1)] = m.group(2);
                continue
            m = re.match("(&&|\|\|)",l)
            if (m):
                #print("Found   op: " + m.group(0))
                l = l[len(m.group(0)):]
                self.tok.append(parserule_event_op(m.group(0)))
                continue
            m = re.match("([a-zA-Z0-9\-_]+)",l)
            if (m):
                #print("Found event: " + m.group(0))
                l = l[len(m.group(0)):]
                self.tok.append(parserule_event_source(m.group(0)))
                self.action.trigger_event[m.group(0)] = m.group(0)
                continue
            else:
                raise(Exception("Cannot parse '{}'".format(ori)))
        e = self.parse_expr()

    def parserule(self):
        l = self.l.l.strip()
        if (l.startswith("on ")):
            #pass
            self.parserule_event(l[3:].strip())
        elif (l.startswith("service ")):
            self.parserule_service(l[len("service "):].strip())
        else:
            raise(Exception("Unknown rule"))

    def __str__(self):
        return "parsed:{}".format(" ".join([ str(i) for i in self.stack ]))
