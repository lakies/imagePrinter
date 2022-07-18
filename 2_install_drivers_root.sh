#!/bin/bash

set -e

DRIVERS=(
        "https://download.brother.com/welcome/dlfp100345/ql820nwbpdrv-3.1.5-0.i386.deb"
        "https://download.brother.com/welcome/dlfp100337/ql800pdrv-3.1.5-0.i386.deb"
)

#TODO check if installed
for url in "${DRIVERS[@]}"
do
        echo "Installing $url"
        TEMP_DEB="$(mktemp --suffix=.deb)"
        wget -O "$TEMP_DEB" $url
        dpkg -i --force-all "$TEMP_DEB"
        rm -f "$TEMP_DEB"
done


echo "######################################################################"
echo  "Drivers installed!"
echo "######################################################################"
