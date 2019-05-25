mk:
	python make.py unit t/grammar.mk

.PHONY: mk

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
		$(CURDIR)/repoto.py list --json .repo/manifests/manifest.xml .; \
	google-chrome file://$(CURDIR)/r/index.html

diff:
	$(CURDIR)/repoto.py dirdiff t/a t/b t ;
	google-chrome file://$(CURDIR)/t/index.html
