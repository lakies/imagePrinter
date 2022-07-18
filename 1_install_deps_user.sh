#!/bin/bash
set -e

sudo apt update


# Deps
sudo apt install -y curl wget python3 python3-pip build-essential libudev-dev


# Install nodejs
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

nvm install 15

npm install -g pm2

echo "######################################################################"
echo  "Installed deps!"
echo "######################################################################"
