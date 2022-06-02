## Setup

Make sure ssh connection is working and nodejs is installed

Run the following:
* `ssh-keygen`
* `ssh-copy-id username@host` - substitue the username and host with the correct values
* `echo "cd /home/user/imagePrinter && node index.js &" >> ~/.bashrc` substitute the /home/user with the path where this program is installed
<!-- * `crontab -l > file; echo "@reboot cd /home/user/syncstuff && node index.js" >> file; crontab file; rm file;` - substitute the /home/user with the path where this program is installed -->

Specify correct server, user, print server and server image path in `config.json`

Install dependencies with `npm install`

Run `node index.js` to start