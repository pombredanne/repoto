# repoto

# Kati trace example:

Open  kati_lineage_main-out/index.html in google-chrome. Select ```Projelem``` element. In middle column click on the ```[num]:[num]:[num]``` entries to select a stackframe.

To generate trace run ```make -f Makefile.lineage.mk prepare``` and ```make -f Makefile.lineage.mk lineage lineage-process lineage-process-main```. This will first patch kati, then run configuration process. Lastlineage-process and lineage-process-main will process /tmp/kati.log via perl script kati-dep-tree.pl to generate a html file.

# License
https://www.gnu.org/licenses/gpl-3.0.html
