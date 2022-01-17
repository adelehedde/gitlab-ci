# gitlab-log

## gitlab-log-cloud-function

Deploy it on Google Cloud Platform

```
Function
Name : gitlab-log
Environment : Node.js 16
Description : read gitlab runner log files that are uploded by a script called 'gitlab-ci-rsync-logs.sh' hosted directly in the Gitlab server (works only with a self hosted instance).
```

## gitlab-ci-rsync-logs.sh

```
sudo su
mkdir /var/log/gitlab-log
nohup bash gitlab-ci-rsync-logs.sh > /var/log/gitlab-log/rsync.log 2>&1 &
```

Alternatives to this script :
- gcsfuse to synchronize a bucket with a folder
- script with inotify-tools
