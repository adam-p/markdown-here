#
# Copyright Adam Pritchard 2015
# MIT License : http://adampritchard.mit-license.org/
#


INPUT_FILE = mdh-markdown-it.js
OUTPUT_FILE = mdh-markdown-it.out.js
EXPORT_NAME = MdhMarkdownIt


.PHONY: all clean install build

all: clean install build

clean:
	rm -f $(OUTPUT_FILE)

install:
	npm install

build: install
	./node_modules/.bin/browserify $(INPUT_FILE) --standalone $(EXPORT_NAME) -o $(OUTPUT_FILE)

