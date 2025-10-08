#!/bin/bash

set -e

cd "$(dirname "$0")"
cd plugins/vsphere
bun run build
zip -9 -r ../../public/plugins/hypershelf-vsphere.zip dist/*
cd ../..

bun run build
bun convex deploy
