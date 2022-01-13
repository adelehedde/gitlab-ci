#!/bin/bash

GITLAB_LOGS_DIRECTORY="/var/opt/gitlab/gitlab-rails/shared/artifacts"
GITLAB_LOGS_BUCKET="gs://<project_id>-gitlab-logs"
GITLAB_SERVICE_ACCOUNT_FILE_PATH="/path/to/gitlab-service-account.json"
DELAY_SECONDS=60

gcloud auth activate-service-account  --key-file="$GITLAB_SERVICE_ACCOUNT_FILE_PATH" || {
  echo "Unable to authenticate service account"
  exit 1
}

cd "$GITLAB_LOGS_DIRECTORY" || exit 1
while true; do
  echo "Synchronizing $GITLAB_LOGS_DIRECTORY with $GITLAB_LOGS_BUCKET"
  gsutil -m rsync -r "$GITLAB_LOGS_DIRECTORY" "$GITLAB_LOGS_BUCKET"
  echo "Waiting next iteration ..."
  sleep $DELAY_SECONDS
done
