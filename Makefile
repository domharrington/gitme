default: test lint

test:
	@./node_modules/.bin/mocha \
		-r should \
		-R spec

.PHONY: default test