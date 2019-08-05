-include Makefile.test.mk

test-clone:
	rm -rf test-repos
	mkdir -p test-repos/repos
	mkdir -p test-repos/gerrit
	make test-gerrit
	@python repoto.py genmirrors test-manifests/clonespec.json > test-repos/test.sh
	cd test-repos; bash -x test.sh -nofetch repos gerrit

test-gerrit-get:
	wget https://gerrit-releases.storage.googleapis.com/gerrit-2.15.13.war

GERRIT_SITE=$(CURDIR)/test-gerrit

test-gerrit:
	-killall java
	export GERRIT_SITE=$(CURDIR)/test-gerrit; \
	java -jar gerrit-2.15.13.war init --batch --dev -d $$GERRIT_SITE;
	echo "google-chrome http://localhost:8080"
	-git config -f $(GERRIT_SITE)/etc/gerrit.config gerrit.basePath $(CURDIR)/test-repos/gerrit
	-git config -f $(GERRIT_SITE)/etc/gerrit.config gitweb.type gitweb
	-git config -f $(GERRIT_SITE)/etc/gerrit.config gitweb.cgi /usr/share/gitweb/gitweb.cgi
	mv $(GERRIT_SITE)/git/All-Projects.git $(CURDIR)/test-repos/gerrit/
	mv $(GERRIT_SITE)/git/All-Users.git $(CURDIR)/test-repos/gerrit/
	$(GERRIT_SITE)/bin/gerrit.sh restart

mk:
	python make.py unit t/grammar.mk

.PHONY: mk test-manifests

flat:
	python repoto.py flatten ${MAINMANIFEST}        m0.xml > log0.txt
	python repoto.py flatten ${MAINMANIFESTGOGOLE}  m1.xml > log1.txt

conv	:
	python repoto.py convbare ${MAINMANIFESTGOGOLE}  | tee convbare0.txt


diff	:
	python repoto.py diff ${MDIFF0} ${MDIFF1}  | tee diff.txt


fmt	:
	python repoto.py format --fmt="%n %p" ${MAINMANIFESTGOGOLE}  | tee fmt0.txt

all:
	python test_m.py -f ${MAINMANIFEST}
	python test_m.py -f ${MAINMANIFESTGOGOLE}


prep:
	rm -rf r.git _r
	mkdir -p r.git
	cd r.git; git init --bare
	git clone r.git _r
	cp manifest*.xml _r/; cd _r; git add manifest*.xml; git commit -m 'all' --all;  git push origin master

prep-repo:
	mkdir -p r
	cd r; python $(CURDIR)/git-repo/repo init -u $(CURDIR)/r.git -b master -m manifest.xml; \
		$(CURDIR)/git-repo/repo sync

scan:
	cd r; \
		$(CURDIR)/repoto.py list --output r --json .repo/manifests/manifest.xml .; \
	google-chrome file://$(CURDIR)/r/index.html

diffd:
	$(CURDIR)/repoto.py dirdiff t/a t/b t ;

diffdh:
	google-chrome file://$(CURDIR)/t/index.html


-include Makefile.config.mk

INITRC_ROOT?=t
INITRC_ROOTSYSTEM?=t
INITRC_ROOTVENDOR?=t
INITRC_OUT?=t
INITRC_FILES?=init.rc
INITRC_DEFPROP?=defpropt.json
INITRC_INPUTS?=t/setup1.json t/setup2.json

initrc:
	$(CURDIR)/repoto.py flatinit  \
		--output $(INITRC_OUT) \
	$(INITRC_INPUTS)
	google-chrome file://$(CURDIR)/t/index.html



STEP_M?=$(CURDIR)/r/.repo/manifests/manifest.xml
STEP_R?=--rewriteproj eiselekd/repoto=review:172/2/3:b100105d66cf17a27ad7c3e408d9fb2ee7ed1a6a --addserver review=github.com
STEP_L?=--aosproot r

step:
	python3 step.py $(STEP_M) $(STEP_R) t/out.xml

list:
	mkdir -p out
	$(CURDIR)/repoto.py list --json out/j,json $(STEP_M_A) $(STEP_M_B) ;
	#google-chrome file://$(CURDIR)/out/index.html

tar:
	tar cvf step.tar step.py repo/manifest.py repo/__init__.py

server:
	python repotorest.py
