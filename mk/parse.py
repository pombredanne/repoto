import re

class mdefine(mline):
    def __init__(self,ctx):

class mif(object):
    def __init__(self,ctx):

class massign(object):
    def __init__(self,ctx):

class mline(object):
    def __init__(self,ctx):
        pass
    def slurp(self,ctx):
        self.lnr = ctx.lnr
        while True:
            self.l = ctx.lines.pop(0)
            ctx.lnr += 1
            m  = re.match(r"^(.*)\\$", self.l)
            if not (m):
                break;
            self.l = m.group(1)
            if (len(ctx.lines) == 0):
                break;
        self.l = self.l.rstrip()
        return self
    
    def classify(self,ctx):
        if (is_assign()):
            pass
        elif (is_define()):
            e = mdefine(l)
            while not (ctx.nextis('endef')):
                e.push(ctx.classify());
            ctx.skip('endef')
        elif (is_if()):
            e = mif(l)
            while not (ctx.nextis('endif')):
                m = ctx.classify()
                e.pushtrue(ctx.classify());
        elif (is_include()):
            pass
        elif (is_comment()):
            pass
        elif (is_rule()):
            while not (ctx.nextis('tab')):
                e.pushtrue(ctx.classify());
        else:
            raise(Exception("Unparsable line '%s'\n" %(self.l)))
        
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
            
class makefile(object):
    def __init__(self,fn):
        with open(fn,"r") as f:
            content = f.readlines()
        class ctx():
            def __init__(self,content):
                self.lines = content
                self.lnr = 1
            def classify(self):
                
        c = ctx(content)
        # read line by line, merge multiline backspace
        self.lines = []
        while (len(c.lines) > 0):
            m = mline()
            self.lines.append(m.slurp(c));
        c1 = ctx(self.lines)
        # create hirarchy
        self.tree = []
        while (len(c.lines) > 0):
            self.tree.append(c.classify());
        
