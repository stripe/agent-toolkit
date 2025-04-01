# syntax=docker/dockerfile:1
# check=experimental=all

FROM node:22-alpine@sha256:9bef0ef1e268f60627da9ba7d7605e8831d5b56ad07487d24d1aa386336d1944
RUN npm install -g typescript pnpm
RUN addgroup -S group && adduser -S user -G group
WORKDIR /app
COPY . .
RUN --mount=type=cache,target=/root/.local \
    pnpm install --frozen-lockfile && pnpm run build

USER user
ENTRYPOINT ["node", "/app/dist/index.js"]
