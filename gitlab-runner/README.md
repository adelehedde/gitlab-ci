# Gitlab-Runner
> Gitlab Runner Configuration

## Register a runner

First you need to obtain your gitlab url and your registration token :  
Go to `Admin Area > Overview > Runners` (https://<gitlab_base_url>/admin/runners)

The easiest way to register a Runner is to start a Docker container locally with the Runner :
```
docker run -it --entrypoint /bin/bash gitlab/gitlab-runner:alpine-v13.3.0
```

You can then register your runner :
```
gitlab-runner register
```

Complete the form with your gitlab url and registration token :
```
Please enter the gitlab-ci coordinator URL (e.g. https://gitlab.com/):
https://<gitlab_base_url>/

Please enter the gitlab-ci token for this runner:
<registration_token>

Please enter the gitlab-ci description for this runner:
<runner_description>       

Please enter the gitlab-ci tags for this runner (comma separated):
<tags>

Please enter the executor: shell, ssh, docker+machine, docker-ssh+machine, kubernetes, docker, docker-ssh, parallels, virtualbox:
docker

Please enter the default Docker image (e.g. ruby:2.1):
busybox:latest
```

You should see the runner on gitlab (refresh the page).

The final step is to extract the authentication token from the local Runner.  
When we registered the Runner, Gitlab saved an authentication token in the docker container.  
This token is necessary because it connects your Runner to Gitlab and designates a stable ID for your Runner.  
When Pods are restarted automatically by Kubernetes, a stable ID allows Gitlab to reference the same logical Runner after each restart.

```
cat /etc/gitlab-runner/config.toml
```

Copy the token inside this file and make sure not to lose it, as it is the only way to authenticate the newly registered Runner to Gitlab.  
Once properly stored, it is safe to shutdown and remove the Docker instance.

## Deploy the Runner to Kubernetes

Create a namespace and a service account for your runner :
```
kubectl apply -f gitlab-runner-namespace.yml
kubectl apply -f gitlab-runner-service-account.yml
```

### Runner gitlab-runner-ci

Runner with privileges used for CI/CD :  
- Docker build is enabled inside containers  
```  
# config.toml
[runners.kubernetes]
  privileged = true
```

```
# .gitlab-ci.yml
job:
  image: docker:19.03.12
  variables:
    DOCKER_DRIVER: overlay2
    DOCKER_HOST: tcp://docker:2375
    DOCKER_TLS_CERTDIR: ""
  services:
    - docker:19.03.12-dind
  script:
    - <docker_cmd>
```

- Cache is enabled  
You must create a secret from the service account `gitlab-ci` 
```
kubectl create secret generic gitlab-runner-credentials --from-file=gitlab-runner-sa=./gitlab-ci.json -n=gitlab-runner
```

```
# config.toml
# see following sections
[runners.cache]
[runners.cache.gcs]
```

```
# .gitlab-ci.yml
cache:
    key: "$CI_COMMIT_REF_SLUG"
    paths:
      # Please note that it seems that the cache directory must be inside your working directory
      - <path_cache>
```
  
```
kubectl apply -f gitlab-runner-ci/gitlab-runner-ci-configmap.yml
kubectl apply -f gitlab-runner-ci/gitlab-runner-ci-deployment.yml
```

Please see :
- https://docs.docker.com/engine/reference/run/#runtime-privilege-and-linux-capabilities
- https://jpetazzo.github.io/2015/09/03/do-not-use-docker-in-docker-for-ci/
- https://docs.gitlab.com/runner/executors/kubernetes.html#using-docker-in-your-builds

### Runner gitlab-runner-job

Generic runner used to run a job
```
kubectl apply -f gitlab-runner-job/gitlab-runner-job-configmap.yml
kubectl apply -f gitlab-runner-job/gitlab-runner-job-deployment.yml
```