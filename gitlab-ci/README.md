# Gitlab-Ci
> Templates and jobs for .gitlab-ci.yml

# Overview

Gitlab ci has the concept of inheritance (`include`, `extends`, yml anchors, ...).  
You can have a look at the [.gitlab-ci.yml reference](https://docs.gitlab.com/ee/ci/yaml/) for more details.

However it is not as powerful as you may expect it and it can be difficult to create jobs/templates without duplicating code...  
That's why it is recommended to follow the following  guideline.

## Job

A job is responsible of a single action and generally defines variables to configure it.  

Only the `script` keyword should be used to define the job logic. That way the `before_script` and `after_script` keywords can be used for custom logic or setting variables.

They are hidden to prevent execution when included.  
They must be extended to be used and can be extended many times.

They are generally structured that way :
```
# job
# documentation

.job:
  image: <job_image>
  script:
    - echo "Checking input variables"
    - echo "Processing Job"
```

## Template

A template is composed of one of many jobs to define a complete CI/CD workflow.  
There is generally a template per kind of project/gitlab group...

The template is responsible of setting a `stage`, setting variables, setting rules (`rules`, `only`, `when`, ... keywords).

They are generally structured that way :
```
include:
  - project: '<gitlab_project_path>/gitlab-ci'
    file: '/jobs/job.yml'

stages:
  - job_stage

job:
  extends: .job
  stage: job_stage
  before_script:
    - echo "Setting Job input variables"
```

## .gitlab-ci.yml

You can include a template in your `.gitlab-ci.yml` project :
```
include:
  - project: '<gitlab_project_path>/gitlab-ci'
    file: '/templates/template.yml'
```

# Templates/Jobs Configuration

## Variables

Some jobs are variablized.  

They can be set in the `before_script` or `variables` section.

They can also be set as global gitlab variables.  
At least they must be defined in the project using the template.  
But they can also be inherited from a Gitlab group.  
Select a group, Left Panel : `Settings > CI / CD > Variables (Expand)`

## Common function/script

If you need a common function/script between your jobs, it is recommended to define it as global Gitlab CI/CD variable (type file).  
Indeed, gitlab yml inheritance is not perfect. So it is better to keep things simple.

## .gitlab-ci.properties

Some jobs need to read properties from a file called `.gitlab-ci.properties`.  
This file must be created at the root of your repository.
These properties are mostly used for git or the artifact registry to tag correctly your artifact.

Template : 
```
# .gitlab-ci.properties
group=<gitlab_group_path>
name=<gitlab_project_name>
version=<gitlab_project_version>
```

# GITLAB CI/CD

## How to validate my templates ?

Gitlab provides a web IDE that autodetects `.gitlab-ci.yml` and provides autocompletion.  

For another file like a template, you can go to your project, click on `CI / CD` (left panel) and click on the `CI Lint` button.  
You can copy/paste your yml to debug it.

## How to run manually a pipeline ?

Select your project, click on `CI / CD` (left panel) and click on the `Run Pipeline` button.  
It will inform you if your `.gitlab-ci.yml` is invalid even if you include templates inside.
