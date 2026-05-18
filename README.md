# Marketplace Microservices

![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/postgresql-4169e1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

A comprehensive, scalable microservices backend for an e-commerce marketplace. Built using a **NestJS Monorepo**, this system provides a robust architecture designed for high availability, independent deployment, and fault tolerance.

This repository serves as a complete backend solution, implementing industry-standard patterns such as API Gateway and Database-per-Service.

## Project Strengths
* **Scalability:** The microservices architecture allows independent scaling of high-traffic services (like the Catalog Service) without affecting the rest of the system.
* **Resilience:** If the Review Service fails, the core functionality (ordering and payments) remains unaffected.
* **Performance:** Catalog queries are aggressively cached using Redis to ensure lightning-fast response times.
* **Maintainability:** Shared code (DTOs, filters, auth guards) is extracted into a common `libs/shared` directory within the Nx/Nest Monorepo setup.

---

## System Architecture

The project strictly follows the **API Gateway** pattern. Clients never communicate directly with the underlying services. Instead, all requests hit the Gateway (running on port `:3000`), which proxies and routes traffic to the appropriate isolated microservice.

**Data Isolation:** Each microservice manages its own separate schema within the PostgreSQL database, ensuring true decoupling.

```text
[ Client Request ]
        │
        ▼
[ API Gateway (:3000) ] ─ (Handles Auth, File Uploads, Swagger)
        │
        ├──► Catalog Service (:3002) ──► PostgreSQL (catalog) & Redis (Cache)
        ├──► Order Service   (:3003) ──► PostgreSQL (order)
        ├──► Seller Service  (:3001) ──► PostgreSQL (seller)
        ├──► Payment Service (:3004) ──► PostgreSQL (payment)
        └──► Review Service  (:3005) ──► PostgreSQL (review)
```

---

## Project Structure

```text
marketplace/microservices/
├── apps/                    # Microservices Source Code
│   ├── api-gateway/         # Entry point, Swagger docs, routing
│   ├── catalog-service/     # Product management and caching
│   ├── order-service/       # Order processing
│   ├── payment-service/     # Payment transactions
│   ├── review-service/      # Product reviews and ratings
│   └── seller-service/      # Users, Profiles, and Authentication
├── libs/                    # Shared code across all apps
│   └── shared/              # Common Types, DTOs, Exception Filters
├── k8s/                     # Kubernetes Deployment Manifests
├── docker-compose.yml       # Docker Compose for local infrastructure
└── package.json
```

---

## Prerequisites

Before starting, ensure you have the following installed on your machine:
* **Node.js** (v20+ recommended)
* **Docker & Docker Compose** (for containerized deployment)
* **Git**
* *(Optional)* **Minikube & kubectl** (if deploying to Kubernetes)

---

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Yushchyk-Roman/marketplace.git
cd marketplace/microservices
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the sample environment file and configure your local variables. 
```bash
cp .env.example .env
```
*Note: Make sure to fill in your Cloudinary API keys if you plan to test file/image uploading.*

---

## Running the Application

There are three main ways to run this project, depending on your needs.

### Option 1: Docker Compose (Recommended for Testing)
The fastest way to get the entire infrastructure, databases, and all microservices running simultaneously.

```bash
docker-compose up --build -d
```
Once the containers are built and running, the API Gateway will be accessible at `http://localhost:3000`.

### Option 2: Local Development (For Coding)
If you are actively developing, you will want to run the infrastructure via Docker, but run the NestJS apps natively.

1. Start the databases and cache:
   ```bash
   docker-compose up postgres redis -d
   ```
2. Run the services you need in development mode:
   ```bash
   npm run start:dev api-gateway
   npm run start:dev seller-service
   npm run start:dev catalog-service
   ```

### Option 3: Kubernetes Deployment
For a production-like environment, deploy the system to a Kubernetes cluster (e.g., Minikube).

```bash
minikube start
# Execute the provided deployment script
./deploy-k8s.ps1
```
Access the gateway via port-forwarding:
```bash
kubectl port-forward svc/api-gateway-service 3000:3000
```

---

## Database Management & Seeding

The project uses Prisma ORM. When running via `docker-compose`, migrations are generally applied. If you are running locally, you might need to apply schemas and seed the database.

**To seed the database with test data:**
The `seller-service` and `catalog-service` include seed scripts to generate initial users and products. You can run them using Prisma commands within their respective directories:
```bash
npx prisma db seed
```

### Default Test Credentials
The seeding process creates the following default accounts for immediate API testing:

* **Admin User:** 
  * Email: `admin@marketplace.com`
  * Password: `Admin123!`
* **Seller User:**
  * Email: `seller@marketplace.com`
  * Password: `Seller123!`

---

## API Endpoints & Documentation

All external communication must pass through the API Gateway. 

| Service Scope | Endpoints | Description |
| :--- | :--- | :--- |
| **Authentication** | `/auth/*`, `/users/*` | Login, Registration, JWT generation, User management |
| **Catalog** | `/products/*` | Product browsing, searching, and details (Cached via Redis) |
| **Orders** | `/orders/*` | Placing orders, viewing order history |
| **Payments** | `/payments/*` | Processing transactions |
| **Reviews** | `/reviews/*` | Submitting and fetching product reviews |

**Swagger Documentation:**
Once the API Gateway is running, an interactive Swagger API manual is available at:
```text
http://localhost:3000/api/docs
```

---

## Quick Start (cURL Example)

To quickly verify that the system is running, request an authentication token using the seeded Admin account:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@marketplace.com", "password": "Admin123!"}'
```
You will receive an `access_token` in the response, which should be included as a `Bearer` token in the `Authorization` header for all subsequent protected requests.

---

## Monitoring and Health

* **Container Health:** When using Docker Compose, check container status using `docker ps`.
* **Kubernetes Pods:** Run `kubectl get pods` to ensure all services report a `Running` status.
* **Logs:** Inspect application logs using `docker logs <container_name>` or `kubectl logs -l app=<service_name>`.