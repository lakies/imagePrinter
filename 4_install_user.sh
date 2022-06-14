#!/bin/bash
set -e

pip3 install --upgrade https://github.com/pklaus/brother_ql/archive/master.zip --user
npm install
pm2 start index.js
pm2 save
pm2 startup
iceweasel localhost:8080
#node print_ids.js