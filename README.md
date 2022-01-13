# gitlab-ci
> Opinionated CI/CD powered by Gitlab and Google Cloud Platform

# Setting Up Your Environment

You need a saas or self hosted gitlab instance. You can even use Google Compute Engine to install it if you want to centralize everything on GCP.  

This guide is non exhaustive but give you the main components to configure. You can adapt it easily.

It has been tested with the following versions :
```
Gitlab Version : 12.8.1-ee
Gitlab Runner Version : 13.3.0
```

## Google Cloud Platform

Firstly you can create a new GCP project : <gcp_project_id>

### IAM & Admin

```
Service Account 
name : gitlab
# Generate key
Add key > Create new key > Key Type : JSON (download the json and keep it safe !)

IAM
Member : gitlab@<gcp_project_id>.iam.gserviceaccount.com
Role : Storage Object Admin
```

```
Service Account 
name : gitlab-ci
# Generate key
Add key > Create new key > Key Type : JSON (download the json and keep it safe !)

IAM
Member : gitlab-ci@<gcp_project_id>.iam.gserviceaccount.com
Role : Artifact Registry Writer, Storage Object Admin
```

Instead of giving the global Storage Object Admin role to your service accounts, you can add them to the buckets they need.

### Kubernetes Engine

You need to create a Kubernetes Engine cluster. The configuration is up to you, depending on your needs.

### Artifact Registry
> Universal build artifact management 

You can create different repository types.

```
# Docker Repository
<gcp_region>-docker.pkg.dev/<gcp_project_id>/docker-repository
# Maven Repository
<gcp_region>-maven.pkg.dev/<gcp_project_id>/maven-repository
```

### Cloud Storage

Bucket names are unique. So adapt the names ...

```
Bucket
Name : <project_id>-gitlab-cache
Description : Used to cache dependencies while building applications
```

```
Bucket
Name : <project_id>-gitlab-logs
Description : Used to store logs from gitlab runner jobs
```

You can also create buckets to deploy your applications :
```
Bucket
Name : <project_id>-registry-spark-repository
Description : Used to store spark applications. Useful for Dataproc.
```

### Cloud Functions

```
Function
Name : gitlab-log
Environment : Node.js 16
Description : read gitlab runner log files that are uploded by a script called 'gitlab-ci-rsync-logs.sh' hosted directly in the Gitlab server (works only with a self hosted instance).
```

During a job execution, logs are written to a local file and sent from the GitLab Runner to Gitlab.  
As the logs are not written to stdout, we cannot see logs on `google cloud monitoring` web interface. So we cannot create alerts if needed.

We can configure gitlab to automatically upload job logs to a bucket.  
More details : [Job Logs](https://docs.gitlab.com/ee/administration/job_logs.html)  
However, once the log file is moved to the external storage, there is an error when you want to see the log output directly in Gitlab...

```
# See /etc/gitlab/gitlab.rb
# tested configuration :
gitlab_rails['artifacts_object_store_enabled'] = true
gitlab_rails['artifacts_object_store_direct_upload'] = false
gitlab_rails['artifacts_object_store_background_upload'] = true
gitlab_rails['artifacts_object_store_proxy_download'] = true
gitlab_rails['artifacts_object_store_remote_directory'] = "<gcp_project_id>-gitlab-logs"
gitlab_rails['artifacts_object_store_connection'] = {
  'provider' => 'Google',
  'google_project' => '<gcp_project_id>',
  'google_client_email' => 'gitlab@<gcp_project_id>.iam.gserviceaccount.com',
  'google_json_key_location' => '/path/to/gitlab-service-account.json',
}
```

That is why a local script is running on the machine hosting gitlab to synchronize logs on a bucket.  
Once uploaded, a cloud function reads that file and logs each line of it. That way you can add alerts if needed with `google cloud monitoring` ...

#### gitlab-ci-rsync-logs.sh

```
sudo su
nohup bash gitlab-ci-rsync-logs.sh > /var/log/gitlab-log/rsync.log 2>&1 &
```

### Gitlab Environment Configuration

#### Gitlab-ci User
`Gitlab Admin Area / Overview / Users / New User`

```
Name : gitlab-ci
Username : gitlab-ci
Email : <gitlab-ci-email>
```

Edit the user and create an impersonation token

```
Name : gitlab-ci
Expires at : let the field empty
Scopes : api, read_repository, write_repository
```

Do not forget to add the user to the Gitlab Group where you want to use it with the role `Maintainer` ! (necessary to push on master)

#### Variables
Select a group
Left Panel : `Settings > CI / CD > Variables (Expand)`

```
Type : File
Name : docker_registry_password
Value : Result of `cat <service_account.json> | base64`
Description : Used to login over a docker registry (see service account created before)
```

```
Type : Variable 
Name : DOCKER_AUTH_CONFIG
Value : Result of `cat ~/.docker/config.json`
Description : Used to pull image from a private container registry : see 'image' keyword from .gitlab-ci.yml
The json can be printed after a docker login inside the .gitlab-ci.yml
```

