
bundle.js: main.js
	node_modules/.bin/browserify -o bundle.js main.js

node_modules: package.json
	npm install

