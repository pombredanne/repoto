include Makefile.config.mk

SHELL=bash

all:

aosp:
	echo "lineage needs to be prepared"
	-rm /tmp/kati.log
	mkdir -p $(CURDIR)/$(DATE)
	cd kati; make
	if [ -d $(AOSP_BASE)/build/kati ]; then \
		cp kati/*cc $(AOSP_BASE)/build/kati/;  \
		cp kati/*h $(AOSP_BASE)/build/kati/;  \
		cp kati/Makefile* $(AOSP_BASE)/build/kati/;  \
	fi
	-cp kati/ckati $(AOSP_BASE)/prebuilts/build-tools/linux-x86/bin/ckati
	-cp kati/ckati $(AOSP_BASE)/out/host/linux-x86/bin/ckati
	touch $(AOSP_TOUCH)
	cd $(AOSP_BASE); source build/envsetup.sh; lunch $(AOSP_LUNCH);  \
		$(CURDIR)/monitor.sh make showcommands 2>&1 | tee $(CURDIR)/$(DATE)/compile_kati.txt

aosp-process:
	cat /tmp/kati.log  | grep -ia LOAD-file > kati_$(AOSP_LUNCH)_list_filter.txt
	perl first_kati.pl kati_$(AOSP_LUNCH)_list_filter.txt kati_$(AOSP_LUNCH)_list_first.txt
	perl last_kati.pl kati_$(AOSP_LUNCH)_list_filter.txt kati_$(AOSP_LUNCH)_list_last.txt


aosp-extract:
	cat /tmp/kati.log  | grep -ia LOAD-file > kati_$(AOSP_LUNCH)_list_filter.txt
	perl kati-extract.pl kati_$(AOSP_LUNCH)_list_filter.txt kati_$(AOSP_LUNCH).json

aosp-process-config:
	#-rm -rf kati_lineage_config-out
	mkdir -p kati_$(AOSP_LUNCH)_config-out
	/usr/bin/perl kati-dep-tree.pl \
		--lineage $(AOSP_BASE) \
		--base build/core/config.mk \
		--out kati_$(AOSP_LUNCH)_config-out  \
		kati_$(AOSP_LUNCH)_list_first.txt index.html
	google-chrome --allow-file-access-from-files kati_$(AOSP_LUNCH)_config-out/index.html

aosp-process-main:
	#-rm -rf kati_lineage_main-out
	mkdir -p kati_$(AOSP_LUNCH)_main-out
	/usr/bin/perl kati-dep-tree.pl \
		--lineage $(AOSP_BASE) \
		--base build/core/main.mk \
		--out kati_$(AOSP_LUNCH)_main-out  \
		kati_$(AOSP_LUNCH)_list_last.txt index.html
	google-chrome --allow-file-access-from-files kati_$(AOSP_LUNCH)_main-out/index.html

aosp-process-dep:
	mkdir -p kati_$(AOSP_LUNCH)_main-out
	/usr/bin/perl kati-dep.pl \
		--lineage $(AOSP_BASE) \
		--base build/core/config.mk \
		--out kati_$(AOSP_LUNCH)_main-out  \
		kati_$(AOSP_LUNCH)_list_last.txt index.html
