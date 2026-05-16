$ErrorActionPreference = "Stop"

Write-Host "`n--- Starting Marketplace Deployment ---" -ForegroundColor Cyan

Write-Host "`n[1/5] Checking Minikube status..." -ForegroundColor Yellow
if ((minikube status | Select-String "host: Running") -eq $null) {
    minikube start --memory=4096 --cpus=4
} else {
    Write-Host "Minikube is already running." -ForegroundColor Green
}

Write-Host "`n[2/5] Syncing with Minikube Docker daemon..." -ForegroundColor Yellow
& minikube -p minikube docker-env --shell powershell | Invoke-Expression

Write-Host "`n[3/5] Building Docker images..." -ForegroundColor Yellow
$services = "api-gateway", "seller-service", "catalog-service", "order-service", "payment-service", "review-service"

foreach ($service in $services) {
    Write-Host "Building image for: $service..." -ForegroundColor Blue
    docker build -t "$($service):v1" --build-arg SERVICE_NAME=$service .
}

Write-Host "`n[4/5] Applying Kubernetes manifests..." -ForegroundColor Yellow
Write-Host "Deploying Infrastructure..."
kubectl apply -f k8s/infrastructure/

Write-Host "Waiting for DB (10s)..."
Start-Sleep -Seconds 10

Write-Host "Deploying Services..."
kubectl apply -f k8s/services/

Write-Host "`n[5/5] Finalization..." -ForegroundColor Yellow
kubectl get pods

Write-Host "`n--- Deployment Complete! ---" -ForegroundColor Green
Write-Host "1. Port Forward: kubectl port-forward svc/api-gateway-service 3000:3000" -ForegroundColor Gray
Write-Host "2. Ingress: minikube tunnel" -ForegroundColor Gray
Write-Host "`nStarting Port Forward on http://localhost:3000..." -ForegroundColor Cyan

kubectl port-forward svc/api-gateway-service 3000:3000