 # Content Team Monorepo

This repo contains the microservices supporting the content team.

And architecture diagram can be found [here](https://app.cloudcraft.co/view/089e13fd-5130-4806-a235-668c53c8ca2f?key=4f239d74-6783-401b-96cd-db0ee17fcf6d).

## Octopus Workflow Builder

[Docker compose files have been provided](https://github.com/OctopusSamples/content-team-apps/tree/main/docker/workflow-builder) if you are interested in using the Workflow Builder locally.

The Workflow Builder requires a [GitHub OAuth app](https://docs.github.com/en/developers/apps/building-oauth-apps/creating-an-oauth-app) with the callback URL set to http://localhost:9000. 

![image](https://user-images.githubusercontent.com/160104/175141466-36c2181c-198d-4c00-a900-81ed73bbd838.png)

The Client ID is defined in the [GITHUB_OAUTH_APP_CLIENT_ID](https://github.com/OctopusSamples/content-team-apps/blob/main/docker/workflow-builder/.env#L1) environment variable, and the Client Secret is defined in the [GITHUB_OAUTH_APP_CLIENT_SECRET](https://github.com/OctopusSamples/content-team-apps/blob/main/docker/workflow-builder/.env#L2) environment variable.

Start the app with the command:

```
docker compose up
```

## Badges

### Audits Service
![Branches](.github/badges/auditsbranches.svg)
![Coverage](.github/badges/audits.svg)

### GitHub Actions Workflow Generator
![Branches](.github/badges/githubbranches.svg)
![Coverage](.github/badges/github.svg)

### Jenkins Pipelines Generator
![Branches](.github/badges/jenkinsbranches.svg)
![Coverage](.github/badges/jenkins.svg)

### Azure Service Bus Proxy
![Branches](.github/badges/azure-servicebus-proxy-branches.svg)
![Coverage](.github/badges/azure-servicebus-proxy-coverage.svg)

### GitHub OAuth Proxy
![Branches](.github/badges/github-oauth-proxy-branches.svg)
![Coverage](.github/badges/github-oauth-proxy-coverage.svg)

### Microservice Utils Shared Library
![Branches](.github/badges/microservice-utils-branches.svg)
![Coverage](.github/badges/microservice-utils-coverage.svg)

### Repo Creator
![Branches](.github/badges/repocreator.svg)
![Coverage](.github/badges/repocreatorbranches.svg)

### GitHub Repo Proxy
![Branches](.github/badges/githubrepoproxy.svg )
![Coverage](.github/badges/githubrepoproxybranches.svg)

### Octopus Proxy
![Branches](.github/badges/githubrepoproxy.svg )
![Coverage](.github/badges/octopusproxybranches.svg)

### Reverse Proxy
[![Go Report Card](https://goreportcard.com/badge/github.com/OctopusSamples/content-team-apps/go/reverse-proxy)](https://goreportcard.com/report/github.com/OctopusSamples/content-team-apps/go/reverse-proxy)

## Links

* [Github Actions Workflow Generator](https://githubactionsworkflowgenerator.octopus.com/#/)
* [Jenkins Pipeline Generator](https://jenkinspipelinegenerator.octopus.com/#/)
