mk:
	python make.py flatten t/grammar.mk flat.mk

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

