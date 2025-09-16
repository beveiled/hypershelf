#!/bin/bash

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <vsphere_hostname> <hypershelf_host>"
  echo "Example: $0 192.168.1.100 http://hypershelf.local"
  exit 1
fi

ip_address="$1"
hypershelf_host="$2"

sed "s|\\\$VSPHERE_HOSTNAME\\\$|$ip_address|g" vsphere/manifest.sample.json > vsphere/manifest.json
sed "s|\\\$HYPERSHELF_HOST\\\$|$hypershelf_host|g" vsphere/content.sample.js > vsphere/content.js

zip -r hypershelf-vsphere.zip vsphere/README.md vsphere/manifest.json vsphere/content.js

echo "Done"
