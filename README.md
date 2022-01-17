# gitlab-ci
> Opinionated CI/CD powered by Gitlab and Google Cloud Platform

# Overview

This project contains 3 folders :
- `gitlab-ci` : .gitlab-ci jobs and templates
- `gitlab-log` : export gitlab job logs to GCP (monitoring/alerting)
- `gitlab-runner` : runner configuration and installation process

Each one of these folders should be a gitlab project with their own build process.

You must replace inside the ymls the following variables :

```
<gcp_region>
<gcp_project_id>
<gitlab_project_path>
<gitlab_base_url>
```

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
Name : <gcp_project_id>-gitlab-cache
Description : Used to cache dependencies while building applications
```

```
Bucket
Name : <gcp_project_id>-gitlab-logs
Description : Used to store logs from gitlab runner jobs
```

You can also create buckets to deploy your applications :
```
Bucket
Name : <gcp_project_id>-registry-spark-repository
Description : Used to store spark applications. Useful for Dataproc.
```

### Cloud Functions
> Optional. See gitlab-log folder

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

That is why you need to run a local script on the machine hosting gitlab to synchronize logs on a bucket.  
Once uploaded, a cloud function reads that file and logs each line of it. That way you can add alerts if needed with `google cloud monitoring` ...

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

Select a group, Left Panel : `Settings > CI / CD > Variables (Expand)`

It is recommended to set these variables once in the parent Gitlab Group so each gitlab project inside can use them.

| Type     | Key                                  | Value | Description |
| :---:    | :---:                                | :---: | :---:       |
| Variable | DOCKER_AUTH_CONFIG                   | Result of `cat ~/.docker/config.json` | Used to pull image from a private container registry : see 'image' keyword from .gitlab-ci.yml <br> The json can be printed after a docker login inside the .gitlab-ci.yml |
| File     | DOCKER_REGISTRY_PASSWORD_FILE_PATH   | Result of `cat <gitlab-ci_service_account.json> \| base64` | Used to login over a docker registry (see service account created before) |
| Variable | DOCKER_REGISTRY_REPOSITORY           | <gcp_project_id>/docker-repository | |
| Variable | DOCKER_REGISTRY_SERVER               | <gcp_region>-docker.pkg.dev | |
| Variable | DOCKER_REGISTRY_USER                 | _json_key_base64 | See GCP documentation |
| Variable | GITLAB_BASE_URL                      | <gitlab_base_url> | |
| Variable | GITLAB_EMAIL                         | <gitlab-ci-email> | |
| File     | GITLAB_SERVICE_ACCOUNT_FILE_PATH | Copy/Paste service account created above | |
| Variable | GITLAB_TOKEN | <gitlab_token> | See impersonation token created above |
| Variable | GITLAB_USER | gitlab-ci | |
| Variable | MAVEN_REGISTRY_REPOSITORY_URL | https://<gcp_region>-maven.pkg.dev/<gcp_project_id>/maven-repository | |
| File     | MAVEN_SETTINGS_FILE_PATH | Copy/Paste and adapt file gitlab-ci/docker/maven-3-jdk-13/settings.template | |
| File     | GITLAB_CI_SET_PACKAGE_JSON | Copy/Paste script : gitlab-ci/scripts/GITLAB_CI_SET_PACKAGE_JSON | Script used to update package.json version |
| File     | GITLAB_CI_SET_POM_XML | Copy/Paste script : gitlab-ci/scripts/GITLAB_CI_SET_POM_XML | Script used to update pom.xml version |
| Variable | GITLAB_CI_SETUP | Copy/Paste script : gitlab-ci/scripts/GITLAB_CI_SETUP | Script used to set environment variables from .gitlab-ci.properties |
| Variable | GITLAB_REGISTRY_BUCKET_SPARK | <gcp_project_id>-registry-spark-repository | Google Cloud Storage bucket |

