#!/bin/bash
# https://github.com/beveiled/hypershelf
# Copyright (C) 2025  Daniil Gazizullin
# 
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
# 
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

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
