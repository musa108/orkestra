# Multi-stage build for the Next.js frontend, using Next's standalone
# output for a minimal runtime image. NOT build-tested in the sandbox
# this project was developed in (no docker daemon available there) — see
# root README's "what's honestly not live" section.

FROM node:20-slim AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund

FROM node:20-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
