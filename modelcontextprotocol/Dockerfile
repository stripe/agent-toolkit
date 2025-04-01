# syntax=docker/dockerfile:1
# check=experimental=all

FROM node:22.12-alpine@sha256:51eff88af6dff26f59316b6e356188ffa2c422bd3c3b76f2556a2e7e89d080bd
RUN npm install -g typescript pnpm
WORKDIR /app
COPY . .
RUN --mount=type=cache,target=/root/.local \
    pnpm install --frozen-lockfile && pnpm run build
ENTRYPOINT ["node", "/app/dist/index.js"]
