import xml.etree.ElementTree as ET
from xml.etree.ElementTree import tostring
import os, shutil;
from copy import deepcopy
from pprint import pprint
import pickle
import pystache
from json import dumps, loads, JSONEncoder, JSONDecoder
import os, sys, re, argparse, json

class PythonObjectEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (list, dict, str, unicode, int, float, bool, type(None))):
            return JSONEncoder.encode(self, obj)
        elif isinstance(obj, set):
            return JSONEncoder.encode(self, list(obj)) #str(obj) #"set([{}])".format(",".join([ PythonObjectEncoder.default(self,i) for i in list(obj)]))
        return pickle.dumps(obj)

treeElemSnippet="""
<li>
    <span class=\"expanded\">
    <a onclick='{{func}}(\"{{arg0}}\",\"{{arg1}}\",\"{{arg2}}\",\"{{arg3}}\",\"{{arg4}}\",\"{{arg5}}\")' >{{n}}</a>
   </span>
   <ul>
     {{{childs}}}
   </ul>
</li>""";

index="""
<html>
  <head>
    <script src="files/jquery-ui-1.12.1.custom/external/jquery/jquery.js"></script>
    <script src="files/jquery-ui-1.12.1.custom/jquery-ui.js"></script>
    <script src="files/code.js"></script>
    <script src="files/pako.js"></script>
    <script src="files/d3.js"></script>
    <script src="files/{{extracode}}.js"></script>
    <link rel="stylesheet" type="text/css" href="files/jquery-ui-1.12.1.custom/jquery-ui.css">
    <link rel="stylesheet" type="text/css" href="files/jquery-ui-1.12.1.custom/jquery-ui.structure.css">
    <link rel="stylesheet" type="text/css" href="files/c.css">
    <style></style>
  </head>
  <body>
    <div class="page row">
      <div class="exp" onClick='expandAll()'>[+]</div>
      <div class="exp" onClick='collapseAll()' style='display:block;'>[-]</div>
      <div class="exp" onClick='viewOnlyChanged()'>viewchanged</div>
      <script></script>
    </div>
    <div class="page row">
     <br>
     <div id="browser" class="menu-tree column expleft" style='position:relative;'>
     <ul>
      {{{dst2src}}}
     </ul></div>
     <div class="mainpane">
      <div id="fninfo" class="floatinfo"></div>
      <div id="fileview" class="fileview"></div>
     </div>
     <!--
     <div class="detail flex">
      <div id="detailfninfo" class="detailfloatinfo"></div>
      <div id="detailfileview" class="detailfileview"></div>
     </div>
     -->
    </div>
    <script src="files/tree.js"></script>
    <script>
     var prefs={{{prefs}}};
     var repodef={{{repodef}}};
     var zipdata={{{zipdata}}};
    </script>
    <script>
     {{basefunc}}('#browser',repodef);
    </script>
  </body>
</html>
"""

class html(object):
    def __init__(self, args):
        super(html,self).__init__()
        self.args = args

    def _generate(self, d, indexparam):
        i = os.path.join(d, "index.html")
        if not (os.path.isdir(d)):
            os.makedirs(d)
        srcdir = os.path.join(os.path.dirname(__file__), '../files')
        dstdir = os.path.join(d, "files")
        if (os.path.isdir(dstdir)):
            shutil.rmtree(dstdir)
        shutil.copytree(srcdir, dstdir)
        indexout=pystache.render(index, indexparam)
        with open(i, "w") as f:
            f.write(indexout)


class repohtml(html):
    def __init__(self, args, repodef):
        super(repohtml,self).__init__(args)
        self.repodef = repodef

    def generate(self, d):
        j = json.dumps(self.repodef, sort_keys=True, indent=4, separators=(',', ': '), cls=PythonObjectEncoder);
        pref = {};
        zipdata = [];
        indexparam={
            'prefs'  :  json.dumps(pref),
            'repodef':  j,
            'zipdata':  json.dumps(zipdata),
            'basefunc' : 'init_repo_tree',
            'extracode' : ''
        }
        self._generate(d, indexparam)

class diffdirhtml(html):
    def __init__(self, args, a):
        super(diffdirhtml,self).__init__(args)
        self.a = a

    def attributes(self, a, c):
        r = []
        for f in a:
            _c = deepcopy(c)
            if f in self.a.diffhistory:
                _c['class'].append('diffremainchanged');
            r.append({'path':f, 'attr': _c})
        return r

    def generate(self, d):
        self.f = self.attributes(self.a.filehash_onlya,{'class':['diffremoved','file']}) + \
            self.attributes(self.a.filehash_ab,{'class':['diffremain','file']}) + \
            self.attributes(self.a.filehash_onlyb,{'class':['diffnew','file']})

        j = json.dumps(self.f, sort_keys=True, indent=4, separators=(',', ': '), cls=PythonObjectEncoder);
        pref = {};
        zipdata = { 'diffhistory' : self.a.diffhistory };
        indexparam={
            'prefs'  :  json.dumps(pref),
            'repodef':  j,
            'zipdata':  json.dumps(zipdata),
            'basefunc' : 'init_diff_tree',
            'extracode' : 'diffshow'
        }
        self._generate(d, indexparam)
