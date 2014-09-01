#
# Copyright Adam Pritchard 2014
# MIT License : http://adampritchard.mit-license.org/
#


PACKAGE_NAME = markdown-here
MOZILLA_PACKAGE_NAME = $(PACKAGE_NAME)-mozilla.xpi
CHROME_PACKAGE_NAME = $(PACKAGE_NAME)-chrome.zip
POSTBOX_PACKAGE_NAME = $(PACKAGE_NAME)-postbox.xpi
DIST_DIR = dist
SRC_DIR = src
TEST_DIR = $(SRC_DIR)/common/test

ZIP_ARGS = -r -1

MOZILLA_INPUT = chrome.manifest install.rdf common firefox
CHROME_INPUT = manifest.json common chrome _locales

.PHONY: all dirs chrome mozilla clean

# Targets for creating directories
dirs: $(DIST_DIR)
	rm -rf $(TEST_DIR)
$(DIST_DIR):
	mkdir $(DIST_DIR)

chrome: | dirs
	rm -f $(DIST_DIR)/$(CHROME_PACKAGE_NAME); \
	cd $(SRC_DIR); \
	zip $(ZIP_ARGS) "../$(DIST_DIR)/$(CHROME_PACKAGE_NAME)" $(CHROME_INPUT)

mozilla: | dirs
	rm -f $(DIST_DIR)/$(MOZILLA_PACKAGE_NAME); \
	cd $(SRC_DIR); \
	zip $(ZIP_ARGS) "../$(DIST_DIR)/$(MOZILLA_PACKAGE_NAME)" $(MOZILLA_INPUT)

#postbox: mozilla
#	cp -f $(DIST_DIR)/$(MOZILLA_PACKAGE_NAME) $(DIST_DIR)/$(POSTBOX_PACKAGE_NAME)
#	cd $(SRC_DIR)/postbox; \
#	zip $(ZIP_ARGS) ../../$(DIST_DIR)/$(POSTBOX_PACKAGE_NAME) common/*

clean:
	rm -rf $(DIST_DIR)
	find . -name "desktop.ini" -or -name ".*" -and -not -name "." -and -not -name ".git*" -print0 | xargs -0 rm -rf
	git checkout -- $(TEST_DIR)

all: clean chrome mozilla
