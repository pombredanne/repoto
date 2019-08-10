

extract-repos:
	mkdir -p mirrors/scripts flatten/flattenrepo.work
	python ../repoto.py genmirrors \
		--clonescript=mirrors/scripts/clone.sh \
		--flattenrepo=flatten/flattenrepo.work \
		def.json

instantiate-repos:
	rm -rf repos
	bash mirrors/scripts/clone.sh --base repos --symlinkbase gerrit --nodry-run

fetch:
	cd repos; for i in `ls`; do echo $$i; (cd $$i; git fetch $(TARGET) ;) done

fetch-v0:
	make TARGET=v0 fetch

fetch-v1:
	make TARGET=v1 fetch


status-repo:
	bash ../repo/mirrorupdate.sh \
		--base $(CURDIR)/repos \
		--symlinkbase $(CURDIR)/gerrit \
		--def mirrors/scripts/clone.sh.json \
		status
