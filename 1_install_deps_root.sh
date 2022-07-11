#!/bin/bash
set -e

apt update


# Deps
apt install -y curl wget python3 python3-pip build-essential libudev-dev beanstalkd iceweasel nodejs sudo


# Install nodejs
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

nvm install 16

npm install -g pm2

echo "######################################################################"
echo  "Installed deps!"
echo "######################################################################"
