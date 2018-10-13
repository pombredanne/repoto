?import re

class mline(object):
    def __init__(self,ctx):
        pass
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
        return "{:03}:{}".format(self.lnr,self.l);

    def is_assign():
        pass
    def is_define():
        pass
    def is_if():
        pass
    def is_include():
        pass
    def is_comment():
        pass
    def is_rule():
        pass

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
        with open(fn,"r") as f:
            content = f.readlines()
        class ctx():
            def __init__(self,content):
                self.lines = content
                self.lnr = 1
            def classify(self):
                pass
            def hasMore(self):
                pass
        c = ctx(content)
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
            
    def parse(self,ctx):
        while True:
            n = ctx.getNext()
            if (n is None):
                break;
            if (n.is_assign()):
                pass
            elif (n.is_define()):
                self.defineOpen()
            elif (n.is_endef()):
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
                raise(Exception("Unparsable line '%s'\n" %(self.l)))

        
