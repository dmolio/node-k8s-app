# 3-Tier Application Deployment on Kubernetes

This project demonstrates how to deploy a 3-tier application (Node.js, MySQL, phpMyAdmin) on a Kubernetes cluster using kind. The application includes user registration and login functionality, with a modern UI and secure session handling.

## Quick Start

```bash
# Clone this repository
git clone https://github.com/dmolio/node-k8s-app.git
cd node-k8s-app

# Install dependencies
npm install

# Run with Docker Compose (for local development)
docker-compose up -d

# OR deploy to Kubernetes (see Kubernetes Deployment section below)
```

## Architecture

- **Frontend**: Node.js with EJS templates
- **Backend**: Express.js REST API
- **Database**: MySQL (MariaDB)
- **Database Management**: phpMyAdmin
- **Container Orchestration**: Kubernetes (kind)
- **Ingress Controller**: NGINX

## Prerequisites

- Docker
- kubectl
- kind (Kubernetes in Docker)
- Node.js and npm

## Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/dmolio/node-k8s-app.git
cd node-k8s-app
```

2. Install dependencies:
```bash
npm install
```

3. Run with Docker Compose (for local development):
```bash
docker-compose up -d
```

## Kubernetes Deployment

### 1. Create kind Cluster

Create `kind-config.yaml`:
```yaml
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
  - containerPort: 5006
    hostPort: 5006
    protocol: TCP
```

Create the cluster:
```bash
kind create cluster --name dev --config kind-config.yaml
```

### 2. Install NGINX Ingress Controller

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

# Wait for the ingress controller to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s
```

### 3. Deploy Application Components

Apply Kubernetes manifests in the following order:

```bash
# Create secrets and configmaps
kubectl apply -f k8s/mysql-secret.yaml
kubectl apply -f k8s/mysql-init-configmap.yaml

# Create storage
kubectl apply -f k8s/mysql-pvc.yaml

# Deploy database
kubectl apply -f k8s/mysql-deployment.yaml

# Deploy application
kubectl apply -f k8s/nodejs-deployment.yaml

# Deploy phpMyAdmin
kubectl apply -f k8s/phpmyadmin-deployment.yaml

# Configure ingress
kubectl apply -f k8s/ingress.yaml
```

### 4. Verify Deployment

```bash
# Check pod status
kubectl get pods

# Check services
kubectl get svc

# Check ingress
kubectl get ingress
```

## Accessing the Application

- Main Application: http://localhost/
- phpMyAdmin: http://localhost/phpmyadmin/

## Kubernetes Manifests Overview

### MySQL Deployment
- Persistent volume for data storage
- Root password stored in Kubernetes secret
- Automatic database and table creation through init scripts

### Node.js Application
- Two replicas for high availability
- Environment variables for database connection
- Health checks for reliability
- Service for internal communication

### phpMyAdmin
- Single replica deployment
- Configured to connect to MySQL service
- Accessible through ingress

### Ingress Configuration
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: nodejs-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2
    nginx.ingress.kubernetes.io/use-regex: "true"
    nginx.ingress.kubernetes.io/ssl-redirect: "false"
spec:
  ingressClassName: nginx
  rules:
  - http:
      paths:
      - path: /phpmyadmin(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: phpmyadmin
            port:
              number: 80
      - path: /()(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: nodejs-app
            port:
              number: 80
```

## Troubleshooting

1. **Pod Status Issues**
   ```bash
   kubectl describe pod <pod-name>
   kubectl logs <pod-name>
   ```

2. **Database Connection Issues**
   - Verify MySQL pod is running
   - Check environment variables in Node.js deployment
   - Verify MySQL service is accessible

3. **Ingress Issues**
   - Check ingress controller logs:
     ```bash
     kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller
     ```
   - Verify ingress rules are properly configured

## Cleanup

To delete the entire deployment:
```bash
# Delete all resources
kubectl delete -f k8s/

# Delete the cluster
kind delete cluster --name dev
```

## Security Considerations

1. Database passwords are stored in Kubernetes secrets
2. SSL redirect is disabled for local development
3. Session management is implemented for user authentication
4. Environment variables are used for sensitive configuration

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
