# Multi-stage build for the NestJS backend.
# NOTE: `prisma generate` here needs network access to binaries.prisma.sh —
# fine in a normal build environment (Cloud Build, GitHub Actions, local
# machine); this Dockerfile was written but NOT build-tested in the
# sandbox this project was developed in, which blocks that exact domain.
# See root README's "what's honestly not live" section.

FROM node:20-slim AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund

FROM node:20-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
EXPOSE 4000
CMD ["node", "dist/main.js"]
