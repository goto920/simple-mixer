#!/bin/sh

sed -e 's/export /module.exports = /' \
	../../../node_modules/soundtouchjs/dist/soundtouch.js \
	> soundtouch-modified.js

sed -e "s/'soundtouchjs';/'.\/soundtouch-modified';/" \
	../../../src/jslibs/MyFilter.js \
	> MyFilter-modified.js

browserify MySoundTouchWorklet.js -p esmify > ../bundle.js
