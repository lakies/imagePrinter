#!/bin/bash
set -e

usermod -aG sudo printserver

systemctl enable cups
systemctl restart cups
systemctl enable beanstalkd
systemctl start beanstalkd

echo '%printserver ALL=NOPASSWD: /bin/systemctl restart cups.service' | EDITOR='tee -a' visudo

# auto startup
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u printserver --hp /home/printserver

echo "######################################################################"
echo  "Installation finished!"
echo "######################################################################"
