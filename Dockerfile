FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ARG SERVICE_NAME

RUN if [ -f "apps/${SERVICE_NAME}/prisma/schema.prisma" ]; then \
      npx prisma generate --schema=apps/${SERVICE_NAME}/prisma/schema.prisma; \
    fi

RUN npx nest build ${SERVICE_NAME}

RUN npm prune --omit=dev

FROM node:20-alpine

WORKDIR /app

ARG SERVICE_NAME
ENV SERVICE=${SERVICE_NAME}

COPY package*.json ./

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

CMD node dist/apps/${SERVICE}/main.js