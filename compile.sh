#!/bin/bash
mkdir target
rm ./target/*
cd ./frontend && npm run build && cp ./dist/index.html ../target/
cd ../
cd ./backend && npm run build && cp ./target/bundle.js ../target/
