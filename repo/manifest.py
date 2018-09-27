import xml.etree.ElementTree as ET
from xml.etree.ElementTree import tostring
import os;
from pprint import pprint

############# hirarchical model ##############

class mh_base(object):
    def __init__(self,args,n,m,xml,tags=[],attrs=[],depth=0):
        super(mh_base,self).__init__()
        self.args = args
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
            #print(str(self))
            raise AttributeError
    def setxml(self,n,v):
        if n in self.attrs:
            if n in self.xml.attrib:
                self.xml.attrib[n] = v
        else:
            raise AttributeError
    def addxml(self,n,v):
        if n in self.attrs:
            self.xml.attrib[n] = v
        else:
            raise AttributeError
    def match(self, tags):
        for i in tags:
            if i in self.tags:
                return True
        return False
    def get_xml(self):
        return tostring(self.xml).rstrip()
    def shortname(self,args):
        n = self.name
        if not (args.removepath is None):
            n = n.replace(args.removepath,"")
        return n

class mh_remote(mh_base):
    def __init__(self,args,m,xml,depth=0):
        super(mh_remote,self).__init__(args,'remote',m,xml,['elem'],['name','pushurl','review','fetch'],depth=depth)
        if ('fetch' in self.xml.attrib) and (self.xml.attrib['fetch'] == "../../"):
            if 'GITBASE' in os.environ:
                self.xml.attrib['fetch']=os.environ['GITBASE']

class mh_default(mh_base):
    def __init__(self,args,m,xml,depth=0):
        super(mh_default,self).__init__(args,'default',m,xml,['elem'],['remote','sync-c','sync-j'],depth=depth)
        
        
class mh_project(mh_base):
    def __init__(self,args,m,xml,depth=0):
        super(mh_project,self).__init__(args,'project',m,xml,['elem'],['name','path','revision','remote'],depth=depth)
    def __str__(self):
        return "project name={}".format(self.name)
    def changed(self,p,args):
        return not (self.revision == p.revision)
    def nameorpath(self,args):
        if 'path' in self.xml.attrib:
            return self.xml.attrib['path']
        return self.shortname(args)
    

class mh_remove_project(mh_base):
    def __init__(self,args,m,xml,depth=0):
        super(mh_remove_project,self).__init__(args,'remove_project',m,xml,['elem'],['name'],depth=depth)
    def __str__(self):
        return "remove-project name={}".format(self.name)

class mh_include(mh_base):
    def __init__(self,args,m,xml,depth=0):
        super(mh_include,self).__init__(args,'include',m,xml,['rec'],['name'],depth=depth)
        n = self.name
        if not n.startswith("/"):
            n = os.path.join(os.path.dirname(m.abspath),n);
        self._c = ftomanifest(args,n,m,depth);
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
    def __init__(self,args,ctx,m,xml,depth=0):
        super(mh_manifest,self).__init__('manifest',m,xml,['rec'],[],depth=depth)
        self.ctx = ctx;
        self._c = [ tags[c1.tag](args,self,c1,depth=self.depth+1) for c1 in [ c0 for c0 in xml if c0.tag in tags ] ]
    def __getattr__(self,n):
        if n in self.ctx:
            return self.ctx[n];
        return mh_base.__getattr__(self,n)
    def __str__(self):
        return "maifest name={}".format(self.abspath)

def ftomanifest(args,n,mp,depth=0):
    if (args.verbose > 0):
        print((" " * depth)+("+%s" %(n)))
    afn = os.path.abspath(n);
    tree = ET.parse(n)
    root = tree.getroot()  
    return [ mh_manifest(args,{'abspath': afn }, mp, xml, depth) for xml in root.iter('manifest') ];
    
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
    def __init__(self,up,args):
        super(projar,self).__init__(args)
        self.up = up
        self.args = args
        self.p = []
        self.added = []
    def add(self,e):
        self.p.append(e)
    def uniformname(self,n):
        if not (self.args.removepath is None):
            n = n.replace(self.args.removepath,"")
        return n;
    def rem(self,e):
        self.p = [ p for p in self.p if not (p.shortname(self.args) ==  e.shortname(self.args)) ]
    def projects(self):
        return self.p
    def contain(self,e):
        a = [ p for p in self.p if (p.shortname(self.args) ==  e.shortname(self.args)) ]
        return (len(a) >= 1)
    def changed(self,e):
        a = [ p for p in self.p if (p.shortname(self.args) ==  e.shortname(self.args)) ]
        return a[0].changed(e,self.args)
    def getProject(self,e):
        a = [ p for p in self.p if (p.shortname(self.args) ==  e.shortname(self.args)) ]
        return a[0]
    def addproject(self,p):
        n = norig = p.name
        if not (self.args.removepath is None):
            n = self.args.removepath + norig
        if p.path is None:
            p.addxml('path',norig)
        if p.remote is None and not (self.args.defserver is None):
            p.addxml('remote',self.args.defserver)
        self.log("Add {}".format(n))
        p.setxml('name',n)
        if not (self.up is None):
            self.up.tree[0]._c.append(p)
        
    def updateshawith(self,e):
        a = [ p for p in self.p if (self.uniformname(p.name) ==  self.uniformname(e.name)) ]
        if not (len(a) == 1):
            raise Exception("Project not present");
        self.log("Update {} {}".format(a[0].name, e.revision))
        a[0].setxml('revision',e.revision)
        
# clearcase like git handling via repo:
class manifest(object):
    
    def __init__(self, args, fn):
        self.args = args
        self.fn = fn;
        self.doc = None
        self.tree = ftomanifest(args, fn, None, depth=0)
        self.m = self.flatten()
        
    def flatten(self):
        p = projar(self,self.args)
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

