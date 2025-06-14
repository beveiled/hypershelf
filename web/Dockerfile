FROM node:20-alpine AS base
WORKDIR /app

RUN apk add --no-cache curl bash \
    && curl -fsSL https://bun.sh/install | bash

COPY bun.lock package.json tsconfig.json .
RUN /root/.bun/bin/bun install --frozen-lockfile

FROM base AS builder
COPY . .
RUN /root/.bun/bin/bun run build

FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache curl bash \
    && curl -fsSL https://bun.sh/install | bash

ENV NODE_ENV=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/bun.lock ./bun.lock

RUN /root/.bun/bin/bun install --production --frozen-lockfile

EXPOSE 3000
CMD ["/root/.bun/bin/bun", "run", "start"]
