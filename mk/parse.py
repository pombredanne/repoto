import re

class color:
    PURPLE = '\033[95m'
    CYAN = '\033[96m'
    DARKCYAN = '\033[36m'
    BLUE = '\033[94m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'

class ctx(object):
    def __init__(self,content):
        self.cur = 0
        self.lines = content
        self.lnr = 1
    def classify(self):
        pass
    def hasMore(self):
        pass
    def getNext(self):
        c = self.cur
        if (len(self.lines) > c):
            self.cur+=1
            return self.lines[c]
        return None
    def __str__(self):
        return "<cmdline>"

class filectx(ctx):
    def __init__(self,fn,content):
        self.fn = fn
        super(filectx,self).__init__(content)
    def __str__(self):
        return "{}".format(self.fn)

    
class mline(object):
    def __init__(self,ctx,line=""):
        super(mline,self).__init__()
        self.ctx = ctx
        self.strStk = []
        self.elements = []
        self.l = line
        self.lnr = 0
    def slurp(self,ctx):
        self.lnr = ctx.lnr
        self.l = ""
        while True:
            l = ctx.lines.pop(0)
            ctx.lnr += 1
            m  = re.match(r"^(.*)\\$", l)
            if not (m):
                break;
            self.l += m.group(1)
            if (len(ctx.lines) == 0):
                break;
        self.l += l.rstrip()
        return self
    def __str__(self):
        return "{}{:03}:{}".format(str(self.ctx),self.lnr,self.l);
    def dbgstr(self,color=False):
        return "{} : {}".format(self.__str__(), self.dbgelements(color=color))
    def dbgelements(self,color=False):
        return "".join([l.dbgstr(color=color) for l in self.elements])
    def is_assign(self):
        return False
    def is_define(self):
        return False
    def is_if(self):
        return False
    def is_fi(self):
        return False
    def is_elif(self):
        return False
    def is_endif(self):
        return False
    def is_else(self):
        return False
    def is_include(self):
        return False
    def is_comment(self):
        return False
    def is_rule(self):
        return False
    def is_rulepart(self):
        return False
    def openVar(self):
        self.elements.append(mlinepart_var(self.ctx))
    def lastOpen(self):
        for i in reversed(range(len(self.elements))):
            if self.elements[i].isOpen():
                return i
        return -1
    def closeVar(self):
        found = 0
        lcnt = len(self.elements)
        i = self.lastOpen()
        if (i != -1):
            out = self.elements[i+1:]
            self.elements = self.elements[:i+1]
            self.elements[i].close(out)
        else:
            raise(Exception("Cannot find opening bracket"))
    def lastStr(self):
        if len(self.elements) == 0 or \
           not isinstance(self.elements[len(self.elements)-1],mlinepart_str):
            self.elements.append(mlinepart_str(self.ctx))
        return self.elements[len(self.elements)-1]
    def addStr(self,l):
        e = self.lastStr()
        e.addStr(l)
        

class mlinepart(mline):
    def __init__(self,ctx):
        super(mlinepart,self).__init__(ctx)
    def isOpen(self):
        pass
    
class mlinepart_str(mlinepart):
    def __init__(self,ctx):
        super(mlinepart_str,self).__init__(ctx)
        self.l = ""
    def addStr(self,l):
        self.l += l
    def isOpen(self):
        return False
    def dbgstr(self,color=False):
        return self.l
    
class mlinepart_var(mlinepart):
    def __init__(self,ctx):
        super(mlinepart_var,self).__init__(ctx)
        self.isOpen_ = True
    def close(self,a):
        self.elements += a
        self.isOpen_ = False
    def isOpen(self):
        return self.isOpen_
    def dbgstr(self,color=False):
        return "$({})".format(self.dbgelements(color))

class mlinepart_func(mlinepart_var):
    def __init__(self,ctx):
        super(mlinepart_func,self).__init__(ctx)
    def dbgstr(self,color=False):
        return "$({})".format(self.dbgelements(color))

    
class mdefine(mline):
    def __init__(self,ctx):
        pass
    
class mif(object):
    def __init__(self,ctx):
        pass

class massign(object):
    def __init__(self,ctx):
        pass

class makefile(object):
    def __init__(self,fn):
        content = []
        if not (fn is None):
            with open(fn,"r") as f:
                content = f.readlines()
        c = filectx(fn, content)
        # read line by line, merge multiline backspace
        self.lines = []
        while (len(c.lines) > 0):
            m = mline(c)
            self.lines.append(m.slurp(c));
        self.ctx = ctx(self.lines)
        self.tree = []
        self.ifStk = []
        self.rule = None
        self.define = None
        
    def __str__(self):
        "\n".join([str(l) for l in self.lines])

    def parseStr(self,ctx,l):
        p = mline(ctx,line=l)
        lcnt = len(l); i=0
        while i < lcnt:
            if i+1 < lcnt and l[i] == '$' and l[i+1] == '(':
                i += 1
                p.openVar()
            elif l[i] == ')':
                p.closeVar()
            else:
                p.addStr(l[i])
            i += 1
        return p
    
    def parse(self,ctx):
        while True:
            n = ctx.getNext()
            if (n is None):
                break;
            if (n.is_assign()):
                pass
            elif (n.is_define()):
                self.defineOpen()
            elif (n.is_endif()):
                self.defineClose()
            elif (n.is_if()):
                self.ifPush()
            elif (n.is_else()):
                self.ifElsePush()
            elif (n.is_fi()):
                self.ifClose()
            elif (n.is_elif()):
                self.ifElifPush()
            elif (n.is_include()):
                pass
            elif (n.is_comment()):
                pass
            elif (n.is_rule()):
                self.ruleOpen()
            elif (n.is_rulepart()):
                self.ruleaddTo()
            else:
                raise(Exception("Un-parsable line '%s'\n" %(str(n))))

        
