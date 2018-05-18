identifier=com.luckymarmot.PawExtensions.cURLImporter
extensions_dir=$(HOME)/Library/Containers/com.luckymarmot.Paw/Data/Library/Application Support/com.luckymarmot.Paw/Extensions/

build:
	yarn run build
	cp README.md LICENSE ./dist/$(identifier)/

clean:
	yarn run clean

install: clean build
	mkdir -p "$(extensions_dir)$(identifier)/"
	cp -r ./dist/$(identifier)/* "$(extensions_dir)$(identifier)/"

test:
	yarn run test

archive: build
	cd ./dist/; zip -r cURLImporter.zip "$(identifier)/"
