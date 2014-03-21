#
# Copyright Adam Pritchard 2014
# MIT License : http://adampritchard.mit-license.org/
#


PACKAGE_NAME = markdown-here
THUNDERBIRD_PACKAGE_NAME = $(PACKAGE_NAME)-thunderbird.xpi
CHROME_PACKAGE_NAME = $(PACKAGE_NAME)-chrome.zip
POSTBOX_PACKAGE_NAME = $(PACKAGE_NAME)-postbox.xpi
DIST_DIR = dist
SRC_DIR = src
TEST_DIR = $(SRC_DIR)/common/test

.PHONY: all dirs chrome postbox thunderbird clean

# Targets for creating directories
dirs: $(DIST_DIR)
	rm -rf $(TEST_DIR)
$(DIST_DIR):
	mkdir $(DIST_DIR)

chrome: | dirs
	rm -f $(DIST_DIR)/$(CHROME_PACKAGE_NAME)
	cd $(SRC_DIR); \
	zip -r ../$(DIST_DIR)/$(CHROME_PACKAGE_NAME) manifest.json \
	zip -r ../$(DIST_DIR)/$(CHROME_PACKAGE_NAME) common/* \
	zip -r ../$(DIST_DIR)/$(CHROME_PACKAGE_NAME) chrome/*

thunderbird: | dirs
	rm -f $(DIST_DIR)/$(THUNDERBIRD_PACKAGE_NAME)
	cd $(SRC_DIR); \
	zip -r ../$(DIST_DIR)/$(THUNDERBIRD_PACKAGE_NAME) chrome.manifest \
	zip -r ../$(DIST_DIR)/$(THUNDERBIRD_PACKAGE_NAME) install.rdf \
	zip -r ../$(DIST_DIR)/$(THUNDERBIRD_PACKAGE_NAME) common/* \
	zip -r ../$(DIST_DIR)/$(THUNDERBIRD_PACKAGE_NAME) firefox/*

postbox: thunderbird
	cp -f $(DIST_DIR)/$(THUNDERBIRD_PACKAGE_NAME) $(DIST_DIR)/$(POSTBOX_PACKAGE_NAME)
	cd $(SRC_DIR)/postbox; \
	zip -r ../../$(DIST_DIR)/$(POSTBOX_PACKAGE_NAME) common/*

clean:
	rm -rf $(DIST_DIR)
	find . -name "desktop.ini" -or -name ".*" -and -not -name "." -and -not -name ".git*" -print0 | xargs -0 rm -rf
	git checkout -- $(TEST_DIR)

all: clean chrome thunderbird
