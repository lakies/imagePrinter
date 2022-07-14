#!/bin/bash
set -e

systemctl enable cups
systemctl restart cups

echo '%printserver ALL=NOPASSWD: /bin/systemctl restart cups.service' | EDITOR='tee -a' visudo

# auto startup
env PATH=$PATH:/home/printserver/.nvm/versions/node/v16.16.0/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u printserver --hp /home/printserver
echo "######################################################################"
echo  "Installation finished!"
echo "######################################################################"
