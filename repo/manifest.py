import xml.etree.ElementTree as ET
from xml.etree.ElementTree import tostring
import os;

############# hirarchical model ##############

class mh_base(object):
    def __init__(self,n,m,xml,tags=[],attrs=[],depth=0):
        self.n = n
        self.m = m;
        self.xml = xml;
        self.tags = [n]+tags 
        self.attrs = attrs
        self.depth = depth
    def __getattr__(self,n):
        if n in self.attrs:
            if n in self.xml.attrib:
                return self.xml.attrib[n]
            return None
        else:
            raise AttributeError
    def match(self, tags):
        for i in tags:
            if i in self.tags:
                return True
        return False
    def get_xml(self):
        return tostring(self.xml).rstrip()

class mh_remote(mh_base):
    def __init__(self,m,xml,depth=0):
        super(mh_remote,self).__init__('remote',m,xml,['elem'],['name','pushurl','review','fetch'],depth=depth)
        if ('fetch' in self.xml.attrib) and (self.xml.attrib['fetch'] == "../../"):
            if 'GITBASE' in os.environ:
                self.xml.attrib['fetch']=os.environ['GITBASE']

class mh_default(mh_base):
    def __init__(self,m,xml,depth=0):
        super(mh_default,self).__init__('default',m,xml,['elem'],['remote','sync-c','sync-j'],depth=depth)
        
class mh_project(mh_base):
    def __init__(self,m,xml,depth=0):
        super(mh_project,self).__init__('project',m,xml,['elem'],['name','path','revision'],depth=depth)
    def __str__(self):
        return "project name={}".format(self.name)

class mh_remove_project(mh_base):
    def __init__(self,m,xml,depth=0):
        super(mh_remove_project,self).__init__('remove_project',m,xml,['elem'],['name'],depth=depth)
    def __str__(self):
        return "remove-project name={}".format(self.name)

class mh_include(mh_base):
    def __init__(self,m,xml,depth=0):
        super(mh_include,self).__init__('include',m,xml,['rec'],['name'],depth=depth)
        n = self.name
        if not n.startswith("/"):
            n = os.path.join(os.path.dirname(m.abspath),n);
        self._c = ftomanifest(n,m,depth);
    def __str__(self):
        return "include name={}".format(self.name)
        
tags = {
    'include' : mh_include,
    'project' : mh_project,
    'remove-project' : mh_remove_project,
    'remote'  : mh_remote,
    'default' : mh_default
}

class mh_manifest(mh_base):
    def __init__(self,ctx,m,xml,depth=0):
        super(mh_manifest,self).__init__('manifest',m,xml,['rec'],[],depth=depth)
        self.ctx = ctx;
        self._c = [ tags[c1.tag](self,c1,depth=self.depth+1) for c1 in [ c0 for c0 in xml if c0.tag in tags ] ]
    def __getattr__(self,n):
        if n in self.ctx:
            return self.ctx[n];
        return mh_base.__getattr__(self,n)
    def __str__(self):
        return "maifest name={}".format(self.abspath)

def ftomanifest(n,mp,depth=0):
    print((" " * depth)+("+%s" %(n)))
    afn = os.path.abspath(n);
    tree = ET.parse(n)
    root = tree.getroot()  
    return [ mh_manifest({'abspath': afn }, mp, xml, depth) for xml in root.iter('manifest') ];
    
#################################################


class logclass(object):
    def __init__(self, args):
        super(logclass,self).__init__()
        self.args = args
    def log(self,l):
        if not (self.args.log is None):
            with open(self.args.log,"a") as f:
                f.write(l + "\n")
        
class projar(logclass):
    def __init__(self,args):
        super(projar,self).__init__(args)
        self.args = args
        self.p = []
    def add(self,e):
        self.p.append(e)
    def uniformname(self,n):
        if not (self.args.removepath is None):
            n = n.replace(self.args.removepath,"")
        return n;
    def rem(self,e):
        self.p = [ p for p in self.p if not (p.name ==  e.name) ]
    def projects(self):
        return self.p
    def contain(self,e):
        a = [ p for p in self.p if (self.uniformname(p.name) ==  self.uniformname(e.name)) ]
        return (len(a) >= 1)
    def addproject(self,p):
        n = p.name
        if not (self.args.removepath is None):
            n = self.args.removepath + n
        self.log("Add {}".format(n))
    def updateshawith(self,e):
        a = [ p for p in self.p if (self.uniformname(p.name) ==  self.uniformname(e.name)) ]
        if not (len(a) == 1):
            raise Exception("Project not present");
        self.log("Update {} {}".format(a[0].name, e.revision))
        
# clearcase like git handling via repo:
class manifest(object):
    
    def __init__(self, args, fn):
        self.args = args
        self.fn = fn;
        self.doc = None
        self.tree = ftomanifest(fn, None, depth=0)
        self.m = self.flatten()
        
    def flatten(self):
        p = projar(self.args)
        def touchproj(e):
            if isinstance(e,mh_project):
                p.add(e)
            elif isinstance(e,mh_remove_project):
                p.rem(e)
        self.traverse(['elem'], lambda x: touchproj(x))
        return p
    
    def traverse(self,tags,fn):
        a = [] + self.tree
        while len(a):
            e = a.pop(0)
            if hasattr(e, '_c'):
                a = e._c + a #retain order 
            if (e.match(tags)):
                fn(e)
    
    def write(self, fn):
        with open(fn,"w") as f:
            f.write("""<?xml version=\"1.0\" encoding=\"UTF-8\"?>
<manifest>   
""");
            class ctx():
                def __init__(self):
                    self.a = [];
                    self.r = [];
                def addproject(self, e):
                    self.a.append(e)
                def remproject(self, e):
                    self.a = [ p for p in self.a if not (p.name ==  e.name) ]
                def addremote(self, e):
                    self.r.append(e)
            
            c = ctx()
            def add_elem(e):
                if isinstance(e,mh_project):
                    #print("Add "+e.name)
                    c.addproject(e)
                elif isinstance(e,mh_remove_project):
                    #print("Remove "+e.name)
                    c.remproject(e)
            self.traverse(['elem'], lambda x: add_elem(x))
            def add_remote(e):
                c.addremote(e)
            self.traverse(['remote','default'], lambda x: add_remote(x))

            for e in c.r:
                f.write(" " + e.get_xml()+"\n");
            for e in c.a: #sorted(c.a, key=lambda x: x.name):
                f.write(" " + e.get_xml()+"\n");

            f.write("</manifest>\n");

