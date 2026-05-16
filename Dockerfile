FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

ARG SERVICE_NAME
ENV DATABASE_URL="postgresql://placeholder:5432/db"
RUN mkdir -p apps/${SERVICE_NAME}/prisma

RUN if [ -f "apps/${SERVICE_NAME}/prisma/schema.prisma" ]; then \
      npx prisma generate --schema=apps/${SERVICE_NAME}/prisma/schema.prisma; \
    fi

RUN npx nest build ${SERVICE_NAME}
RUN if [ -f "apps/${SERVICE_NAME}/prisma/seed.ts" ]; then \
      npx tsc apps/${SERVICE_NAME}/prisma/seed.ts --esModuleInterop --skipLibCheck --target es2020 --module commonjs --outDir dist/apps/${SERVICE_NAME}/prisma --rootDir apps/${SERVICE_NAME}/prisma; \
    fi

RUN npm prune --omit=dev

FROM node:20-alpine
RUN apk add --no-cache openssl

WORKDIR /app

ARG SERVICE_NAME
ENV SERVICE=${SERVICE_NAME}

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/apps/${SERVICE_NAME}/prisma ./apps/${SERVICE_NAME}/prisma

RUN ln -s /app/node_modules /app/dist/node_modules

CMD ["sh", "-c", "\
if [ -f apps/${SERVICE}/prisma/schema.prisma ]; then \
  npx prisma db push --schema=apps/${SERVICE}/prisma/schema.prisma --accept-data-loss; \
  if [ -f dist/apps/${SERVICE}/prisma/seed.js ]; then \
    echo 'Running seed...'; \
    node dist/apps/${SERVICE}/prisma/seed.js; \
  fi; \
fi && \
node dist/apps/${SERVICE}/main.js"]