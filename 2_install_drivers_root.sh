#!/bin/bash

set -e

DRIVERS=(
        "http://download.brother.com/welcome/dlfp100347/ql820nwbcupswrapper-1.1.4-0.i386.deb"
        "http://download.brother.com/welcome/dlfp100339/ql800cupswrapper-1.1.4-0.i386.deb"
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
