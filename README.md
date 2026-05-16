# Marketplace Microservices Backend

Комплексна мікросервісна система для e-commerce маркетплейсу, побудована на базі **NestJS Monorepo**, що забезпечує високу масштабованість, відмовостійкість та гнучкість розгортання.

## Про систему
Система реалізує архітектурний патерн **API Gateway**, де всі запити клієнтів проходять через єдину точку входу, яка маршрутизує їх до відповідних ізольованих мікросервісів. Кожен сервіс має власну сферу відповідальності та базу даних (Database per Service), що дозволяє незалежно оновлювати та масштабувати компоненти.

---

## Технологічний стек

| Сфера | Технології |
| :--- | :--- |
| **Framework** | NestJS (Node.js 20+) |
| **Мова** | TypeScript |
| **ORM** | Prisma |
| **Бази даних** | PostgreSQL, Redis (Caching) |
| **Контейнеризація** | Docker, Docker Compose |
| **Оркестрація** | Kubernetes (Minikube) |
| **Хмарні сервіси** | Cloudinary (Image Storage) |
| **Автентифікація** | JWT (JSON Web Tokens) |

---

## Структура проєкту
Проєкт побудований за принципом **Monorepo**, що дозволяє зручно керувати спільними модулями та типами.

```text
.
├── apps/                    # Основні мікросервіси
│   ├── api-gateway/         # Єдина точка входу, агрегація запитів
│   ├── seller-service/      # Керування профілями продавців
│   ├── catalog-service/     # Каталог товарів та категорій
│   ├── order-service/       # Обробка замовлень та кошика
│   ├── payment-service/     # Обробка транзакцій
│   └── review-service/      # Відгуки та рейтинги
├── libs/                    # Спільний код
│   └── shared/              # Типи, інтерцептори, спільні сервіси
├── k8s/                     # Маніфести Kubernetes
│   ├── infrastructure/      # Redis, PostgreSQL, Ingress
│   └── services/            # Деплойменти мікросервісів
├── Dockerfile               # Універсальний Multi-stage Dockerfile
├── docker-compose.yaml      # Локальне оточення
└── package.json
```

---

##  Вимоги до системи
Для успішного запуску системи вам знадобляться:
* **Node.js** (v20.x або новіша)
* **Docker Desktop**
* **Minikube** (для запуску в Kubernetes)
* **kubectl** (CLI для керування кластером)
* **Git**

---

##  Варіанти запуску

### 1. Локальний запуск (Development)
Найкращий варіант для швидкої розробки та дебагу.
1. Встановіть залежності: `npm install`
2. Запустіть інфраструктуру (БД та Redis): `docker-compose up postgres redis -d`
3. Запустіть необхідний сервіс: `npm run start:dev [service-name]`

### 2. Docker Compose (Containerized)
Запуск усієї системи однією командою.
```bash
docker-compose up --build
```
*Система буде доступна на `http://localhost:3000` (Gateway).*

### 3. Kubernetes (Orchestration) — Стандарт Production
1. **Запуск кластера:** `minikube start`
2. **Синхронізація образів:**
   `& minikube -p minikube docker-env --shell powershell | Invoke-Expression`
3. **Збірка образів:**
   `docker build -t [service-name]:v1 --build-arg SERVICE_NAME=[service-name] .`
4. **Розгортання:**
   `kubectl apply -f k8s/infrastructure/`
   `kubectl apply -f k8s/services/`
5. **Доступ:** `minikube tunnel` (для Ingress) або `kubectl port-forward svc/api-gateway-service 3000:3000`

---

## Аналіз та моніторинг

### Перевірка працездатності (Health Check)
* **Kubernetes:** `kubectl get pods` — всі поди мають бути в статусі `Running`.
* **Logs:** `kubectl logs -l app=[service-name]` — перегляд логів для діагностики помилок.
* **Dashboard:** `minikube dashboard` — візуальний моніторинг ресурсів.

### Тестування взаємодії
1. **Redis:** Перевірка швидкості відповіді (TTFB) у вкладці Network браузера. Перший запит (Cache MISS) > 100ms, другий (Cache HIT) < 20ms.
2. **Self-Healing:** Видаліть под командою `kubectl delete pod [name]`. Kubernetes має миттєво створити новий.
3. **Scaling:** Збільште кількість реплік: `kubectl scale deployment [name] --replicas=3`.

---

## Змінні оточення (.env)
Обов'язкові змінні для кожного сервісу:
* `DATABASE_URL`: Шлях до PostgreSQL.
* `REDIS_HOST`/`REDIS_PORT`: Параметри підключення до Redis.
* `JWT_SECRET`: Ключ для підпису токенів.
* `CLOUDINARY_CLOUD_NAME`/`API_KEY`/`API_SECRET`: Доступ до сховища зображень.

---

## Переваги поточної реалізації
* **Автоматичне відновлення:** K8s перезапускає сервіси у разі збоїв.
* **Zero Downtime:** Оновлення версій відбувається поступово (Rolling Update).
* **Ізоляція:** Помилка в `review-service` не зупиняє процес оплати в `payment-service`.
* **Масштабованість:** Можливість незалежно збільшувати потужність найбільш навантажених частин системи.

---
*Розроблено в рамках лабораторної роботи з мікросервісних архітектур. © 2026*