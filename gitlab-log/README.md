# gitlab-log

## gitlab-log-cloud-function

Deploy it on Google Cloud Platform

## gitlab-ci-rsync-logs.sh

```
sudo su
mkdir /var/log/gitlab-log
nohup bash gitlab-ci-rsync-logs.sh > /var/log/gitlab-log/rsync.log 2>&1 &
```
