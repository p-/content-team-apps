resource "octopusdeploy_project" "frontend_project" {
  auto_create_release                  = false
  default_guided_failure_mode          = "EnvironmentDefault"
  default_to_skip_if_already_installed = false
  description                          = "Deploys the backend service."
  discrete_channel_release             = false
  is_disabled                          = false
  is_discrete_channel_release          = false
  is_version_controlled                = false
  lifecycle_id                         = var.octopus_application_lifecycle_id
  name                                 = "Google Microservice Frontend"
  project_group_id                     = octopusdeploy_project_group.google_microservice_demo.id
  tenanted_deployment_participation    = "Untenanted"
  space_id                             = var.octopus_space_id
  included_library_variable_sets       = []
  versioning_strategy {
    template = "#{Octopus.Version.LastMajor}.#{Octopus.Version.LastMinor}.#{Octopus.Version.LastPatch}.#{Octopus.Version.NextRevision}"
  }

  connectivity_policy {
    allow_deployments_to_no_targets = false
    exclude_unhealthy_targets       = false
    skip_machine_behavior           = "SkipUnavailableMachines"
  }
}

resource "octopusdeploy_channel" "feature_branch" {
  name        = "Feature Branches"
  project_id  = octopusdeploy_project.frontend_project.id
  description = "The channel through which feature branches are deployed"
  depends_on  = [octopusdeploy_project.frontend_project]
  is_default  = true
  rule {
    tag = ".+"
    action_package {
      deployment_action = "Deploy App"
      package_reference = local.backend_package_name
    }
  }
}

resource "octopusdeploy_channel" "mainline" {
  name        = "Mainline"
  project_id  = octopusdeploy_project.frontend_project.id
  description = "The channel through which mainline releases are deployed"
  depends_on  = [octopusdeploy_project.frontend_project]
  is_default  = true
  rule {
    tag = "^$"
    action_package {
      deployment_action = "Deploy App"
      package_reference = local.backend_package_name
    }
  }
}

resource "octopusdeploy_variable" "debug_variable" {
  name         = "OctopusPrintVariables"
  type         = "String"
  description  = "A debug variable used to print all variables to the logs. See [here](https://octopus.com/docs/support/debug-problems-with-octopus-variables) for more information."
  is_sensitive = false
  owner_id     = octopusdeploy_project.frontend_project.id
  value        = "False"
}

resource "octopusdeploy_variable" "debug_evaluated_variable" {
  name         = "OctopusPrintEvaluatedVariables"
  type         = "String"
  description  = "A debug variable used to print all variables to the logs. See [here](https://octopus.com/docs/support/debug-problems-with-octopus-variables) for more information."
  is_sensitive = false
  owner_id     = octopusdeploy_project.frontend_project.id
  value        = "False"
}

locals {
  frontend_package_name   = "microservices-demo-frontend"
  frontend_resource_names = "frontend"
}

resource "octopusdeploy_deployment_process" "deploy_frontend" {
  project_id = octopusdeploy_project.frontend_project.id
  step {
    condition           = "Success"
    name                = "Deploy App"
    package_requirement = "LetOctopusDecide"
    start_trigger       = "StartAfterPrevious"
    target_roles        = ["demo-k8s-cluster"]
    action {
      action_type    = "Octopus.KubernetesDeployContainers"
      name           = "Deploy App"
      run_on_server  = true
      worker_pool_id = data.octopusdeploy_worker_pools.ubuntu_worker_pool.worker_pools[0].id
      environments   = [
        var.octopus_development_app_environment_id,
        var.octopus_production_app_environment_id
      ]
      features = ["Octopus.Features.KubernetesService"]
      package {
        name                      = local.frontend_resource_names
        package_id                = local.frontend_package_name
        feed_id                   = var.octopus_dockerhub_feed_id
        acquisition_location      = "NotAcquired"
        extract_during_deployment = false
      }
      container {
        feed_id = var.octopus_dockerhub_feed_id
        image   = "octopusdeploy/worker-tools:3-ubuntu.18.04"
      }
      properties = {
        "Octopus.Action.KubernetesContainers.Replicas" : "1",
        "Octopus.Action.KubernetesContainers.DeploymentStyle" : "RollingUpdate",
        "Octopus.Action.KubernetesContainers.ServiceNameType" : "External",
        "Octopus.Action.KubernetesContainers.DeploymentResourceType" : "Deployment",
        "Octopus.Action.KubernetesContainers.DeploymentWait" : "Wait",
        "Octopus.Action.KubernetesContainers.ServiceType" : "ClusterIP",
        "Octopus.Action.KubernetesContainers.IngressAnnotations" : "[]",
        "Octopus.Action.KubernetesContainers.PersistentVolumeClaims" : "[]",
        "Octopus.Action.KubernetesContainers.Tolerations" : "[]",
        "Octopus.Action.KubernetesContainers.NodeAffinity" : "[]",
        "Octopus.Action.KubernetesContainers.PodAffinity" : "[]",
        "Octopus.Action.KubernetesContainers.PodAntiAffinity" : "[]",
        "Octopus.Action.KubernetesContainers.Namespace" : "onlinebotique",
        "Octopus.Action.KubernetesContainers.DeploymentName" : "frontend",
        "Octopus.Action.KubernetesContainers.DnsConfigOptions" : "[]",
        "Octopus.Action.KubernetesContainers.PodAnnotations" : "[{\"key\":\"sidecar.istio.io/rewriteAppHTTPProbers\",\"value\":\"true\"}]",
        "Octopus.Action.KubernetesContainers.DeploymentAnnotations" : "[]",
        "Octopus.Action.KubernetesContainers.DeploymentLabels" : "{\"app\":\"frontend\"}",
        "Octopus.Action.KubernetesContainers.CombinedVolumes" : "[]",
        "Octopus.Action.KubernetesContainers.PodSecurityFsGroup" : "1000",
        "Octopus.Action.KubernetesContainers.PodSecurityRunAsGroup" : "1000",
        "Octopus.Action.KubernetesContainers.PodSecurityRunAsNonRoot" : "true",
        "Octopus.Action.KubernetesContainers.PodSecuritySysctls" : "[]",
        "Octopus.Action.KubernetesContainers.PodServiceAccountName" : "default",
        "Octopus.Action.KubernetesContainers.Containers" : jsonencode([
          {
            IsNew : true
            InitContainer : "False"
            Ports : [{ value : "8080" }]
            EnvironmentVariables :
            [
              {
                key : "PORT"
                value : "8080"
              },
              {
                key : "PRODUCT_CATALOG_SERVICE_ADDR"
                value : "productcatalogservice:3550"
              },
              {
                key : "CURRENCY_SERVICE_ADDR"
                value : "currencyservice:7000"
              },
              {
                key : "CART_SERVICE_ADDR"
                value : "cartservice:7070"
              },
              {
                key : "RECOMMENDATION_SERVICE_ADDR"
                value : "recommendationservice:8080"
              },
              {
                key : "SHIPPING_SERVICE_ADDR"
                value : "shippingservice:50051"
              },
              {
                key : "CHECKOUT_SERVICE_ADDR"
                value : "checkoutservice:5050"
              },
              {
                key : "AD_SERVICE_ADDR"
                value : "adservice:9555"
              },
              {
                key : "DISABLE_TRACING"
                value : "1"
              },
              {
                key : "DISABLE_PROFILER"
                value : "1"
              }
            ]
            SecretEnvironmentVariables: []
            SecretEnvFromSource: []
            ConfigMapEnvironmentVariables: []
            ConfigMapEnvFromSource: []
            FieldRefEnvironmentVariables: []
            VolumeMounts: []
            AcquisitionLocation: "NotAcquired"
            Name: "server"
            PackageId: "google-samples/microservices-demo/frontend"
            FeedId: "Feeds-1231"
            Properties: {}
            Command: []
            Args: []
            Resources:
            {
              requests:
              {
                memory: "64Mi"
                cpu: "100m"
                ephemeralStorage: ""
              }
              limits:
              {
                memory: "128Mi"
                cpu: "200m"
                ephemeralStorage: ""
                nvidiaGpu: ""
                amdGpu: ""
              }
            }
            LivenessProbe:
            {
              failureThreshold: ""
              initialDelaySeconds: "10"
              periodSeconds: ""
              successThreshold: ""
              timeoutSeconds: ""
              type: "HttpGet"
              exec:
              {
                command:[]
              }
              httpGet:
              {
                host: ""
                path: "/_healthz"
                port: "8080"
                scheme: ""
                httpHeaders:
                [
                  {
                    key: "Cookie"
                    value: "shop_session-id=x-liveness-probe"
                  }
                ]
              }
              tcpSocket:
              {
                host: ""
                port:""
              }
            }
            ReadinessProbe:
            {
              failureThreshold: ""
              initialDelaySeconds: "10"
              periodSeconds: ""
              successThreshold: ""
              timeoutSeconds: ""
              type: "HttpGet"
              exec:
              {
                command: []
              }
              httpGet:
              {
                host: ""
                path: "/_healthz"
                port: "8080"
                scheme: ""
                httpHeaders:
                [
                  {
                    key:"Cookie"
                    value: "shop_session-id=x-readiness-probe"
                  }
                ]
              }
              tcpSocket:
              {
                host: ""
                port: ""
              }
            }
            StartupProbe:
            {
              failureThreshold: ""
              initialDelaySeconds: ""
              periodSeconds: ""
              successThreshold: ""
              timeoutSeconds: ""
              type: null
              exec:
              {
                command:[]
              }
              httpGet:
              {
                host: ""
                path: ""
                port: ""
                scheme: ""
                httpHeaders:[]
              }
              tcpSocket:
              {
                host: ""
                port: ""
              }
            }
            Lifecycle: {}
            SecurityContext:
            {
              allowPrivilegeEscalation: "false"
              privileged: "false"
              readOnlyRootFilesystem: "true"
              runAsGroup: ""
              runAsNonRoot: ""
              runAsUser: ""
              capabilities:
              {
                add: []
                drop: ["all"]
              }
              seLinuxOptions:
              {
                level: ""
                role: ""
                type: ""
                user: ""
              }
            }
          }
        ])
        "Octopus.Action.KubernetesContainers.PodSecurityRunAsUser" : "1000",
        "Octopus.Action.KubernetesContainers.ServiceName" : "frontend",
        "Octopus.Action.KubernetesContainers.LoadBalancerAnnotations" : "[]",
        "Octopus.Action.KubernetesContainers.ServicePorts" : jsonencode(
          [
            {
              name: "http"
              port: "80"
              targetPort: "8080"
            }
          ]
        )
        "Octopus.Action.RunOnServer" : "true"
      }
    }
  }
}