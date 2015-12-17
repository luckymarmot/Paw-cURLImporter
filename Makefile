install:
	npm prune
	NODE_ENV=production npm run dist

clean:
	rm -rf node_modules

dist_app: clean install

test:
	npm test

lint:
	./node_modules/eslint/bin/eslint.js -c linting/dev.yaml src/

dev:
	npm install
	npm start