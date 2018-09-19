flat:
	python repoto.py flatten ${MAINMANIFEST}        m0.xml > log0.txt
	python repoto.py flatten ${MAINMANIFESTGOGOLE}  m1.xml > log1.txt

all:
	python test_m.py -f ${MAINMANIFEST}
	python test_m.py -f ${MAINMANIFESTGOGOLE}
