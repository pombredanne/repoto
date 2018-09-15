import xml.etree.ElementTree as ET
import os;

############# hirarchical model ##############

class mh_base(object):
    def __init__(self,n,m,xml,tags=[],attrs=[]):
        self.n = n
        self.m = m;
        self.xml = xml;
        self.tags = [n]+tags 
        self.attrs = attrs
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

class mh_remote(mh_base):
    def __init__(self,m,xml):
        super(mh_remote,self).__init__('remote',m,xml,['elem'],['name','pushurl','review'])

class mh_default(mh_base):
    def __init__(self,m,xml):
        super(mh_default,self).__init__('default',m,xml,['elem'],['remote','sync-c','sync-j'])
        
class mh_project(mh_base):
    def __init__(self,m,xml):
        super(mh_project,self).__init__('priject',m,xml,['elem'],['name','path','revision'])
    def __str__(self):
        return "project name={}".format(self.name)

class mh_remove_project(mh_base):
    def __init__(self,m,xml):
        super(mh_remove_project,self).__init__('remove_project',m,xml,['elem'],['name'])
    def __str__(self):
        return "remove-project name={}".format(self.name)

class mh_include(mh_base):
    def __init__(self,m,xml):
        super(mh_include,self).__init__('include',m,xml,['rec'],['name'])
        n = self.name
        if not n.startswith("/"):
            n = os.path.join(os.path.dirname(m.abspath),n);
        self._c = ftomanifest(n,m);
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
    def __init__(self,ctx,m,xml):
        super(mh_manifest,self).__init__('manifest',m,xml,['rec'],[])
        self.ctx = ctx;
        self._c = [ tags[c1.tag](self,c1) for c1 in [ c0 for c0 in xml if c0.tag in tags ] ]
    def __getattr__(self,n):
        if n in self.ctx:
            return self.ctx[n];
        return mh_base.__getattr__(self,n)
    def __str__(self):
        return "maifest name={}".format(self.abspath)

def ftomanifest(n,mp):
    afn = os.path.abspath(n);
    tree = ET.parse(n)
    root = tree.getroot()  
    return [ mh_manifest({'abspath': afn }, mp, xml) for xml in root.iter('manifest') ];
    
#################################################
    
# clearcase like git handling via repo:
class manifest(object):
    
    def flatten(self,p):
        pass
    
    def __init__(self, fn):
        self.fn = fn;
        self.doc = None
        self.tree = ftomanifest(fn, None)
        self.m = self.flatten(self.tree)
        
    def traverse(self,tags,fn):
        a = [] + self.tree
        while len(a):
            e = a.pop()
            if hasattr(e, '_c'):
                a = a + e._c
            if (e.match(tags)):
                fn(e)
    
