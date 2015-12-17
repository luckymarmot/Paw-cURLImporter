#!/usr/bin/env bash
identifier="com.luckymarmot.PawExtensions.ExampleImporter"
extensions_dir="$HOME/Library/Containers/com.luckymarmot.Paw/Data/Library/Application Support/com.luckymarmot.Paw/Extensions/"
npm run build
echo $extensions_dir
echo $extensions_dir$identifier/
ditto ./build/* "$extensions_dir$identifier/"