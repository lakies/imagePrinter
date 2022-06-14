#!/bin/bash
set -e

apt update


# Deps
apt install -y curl wget python3 python3-pip build-essential libudev-dev beanstalkd iceweasel nodejs sudo


# Install nodejs
curl -sL https://deb.nodesource.com/setup_8.x | bash -

apt-get install -y nodejs

npm install -g pm2

echo "######################################################################"
echo  "Installed deps!"
echo "######################################################################"
