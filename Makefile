scripts: facts.pack.js
	coffee --watch --compile *.coffee

facts.pack.js:
	curl -O https://pinkturtle.github.io/facts/facts.pack.js

.git:
	git init
	git config core.ignorecase false
	git config user.name "pinkturtle"
	git config user.email "purplespots@lostpond"
	git remote add github git@github.com:pinkturtle/checklist.git
	git checkout -b demo
	git add --all
	git commit -m "Init"
	git log

public: .git
	git push github demo demo:gh-pages
