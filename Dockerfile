FROM node:24-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++
ARG APP_BASE_PATH=/__NEXT_RUNTIME_BASE_PATH__
ENV NEXT_TELEMETRY_DISABLED=1
ENV APP_BASE_PATH=${APP_BASE_PATH}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ARG APP_BASE_PATH=/__NEXT_RUNTIME_BASE_PATH__
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV APP_BASE_PATH=${APP_BASE_PATH}
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV CSG_DATA_DIR=/data
RUN apk add --no-cache libstdc++ && addgroup -S nextjs && adduser -S nextjs -G nextjs
RUN mkdir -p /data && chown -R nextjs:nextjs /data
COPY --from=builder --chown=nextjs:nextjs /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --chown=nextjs:nextjs docker-entrypoint.sh ./docker-entrypoint.sh
COPY --chown=nextjs:nextjs scripts/replace-base-path.mjs ./scripts/replace-base-path.mjs
RUN chown -R nextjs:nextjs /app /data \
  && chmod -R a+rwX /app /data \
  && chmod +x ./docker-entrypoint.sh
USER nextjs
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
