# Deploy Nexthire to Docker Desktop Kubernetes (local learning stack).
# Prereqs: Docker Desktop → Settings → Kubernetes → Enable Kubernetes

param(
    [ValidateSet("hello", "stack", "all")]
    [string]$Target = "hello"
)

$ErrorActionPreference = "Stop"
$K8sDir = $PSScriptRoot
$BackendRoot = Split-Path $K8sDir -Parent

function Assert-Kubectl {
    kubectl cluster-info 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Kubernetes API not reachable. Enable Kubernetes in Docker Desktop and wait for it to turn green."
    }
}

function Ensure-Secret {
    $envFile = Join-Path $BackendRoot ".env"
    if (-not (Test-Path $envFile)) {
        Write-Error "Missing $envFile — copy from .env.example and fill in secrets."
    }
    kubectl get namespace nexthire 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        kubectl apply -f (Join-Path $K8sDir "namespace.yaml")
    }
    kubectl create secret generic backend-env `
        --from-env-file=$envFile `
        -n nexthire `
        --dry-run=client -o yaml | kubectl apply -f -
    Write-Host "Secret backend-env synced from .env"
}

Assert-Kubectl
kubectl apply -f (Join-Path $K8sDir "namespace.yaml")

switch ($Target) {
    "hello" {
        kubectl apply -f (Join-Path $K8sDir "hello.yaml")
        kubectl rollout status deployment/hello -n nexthire --timeout=120s
        Write-Host ""
        Write-Host "Hello test: http://localhost:30080"
        kubectl get pods,svc -n nexthire
    }
    "stack" {
        Ensure-Secret
        kubectl apply -f (Join-Path $K8sDir "redis.yaml")
        kubectl apply -f (Join-Path $K8sDir "backend.yaml")
        kubectl apply -f (Join-Path $K8sDir "frontend.yaml")
        kubectl rollout status deployment/redis -n nexthire --timeout=120s
        kubectl rollout status deployment/backend -n nexthire --timeout=180s
        kubectl rollout status deployment/frontend -n nexthire --timeout=180s
        Write-Host ""
        Write-Host "Frontend: http://localhost:30300"
        Write-Host "Backend:  http://localhost:30500/api/v1"
        kubectl get pods,svc -n nexthire
    }
    "all" {
        & $PSCommandPath -Target hello
        & $PSCommandPath -Target stack
    }
}