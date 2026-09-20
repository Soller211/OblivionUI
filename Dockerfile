FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY index.html tsconfig.json vite.config.ts ./
COPY src ./src
COPY opencode.mjs opencode.test.mjs provision.mjs provision.test.mjs server.mjs server.test.mjs ./
RUN npm run typecheck && npm test && npm run build

FROM node:24-alpine
ENV NODE_ENV=production PORT=8080
WORKDIR /app
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node server.mjs ./server.mjs
COPY --chown=node:node opencode.mjs ./opencode.mjs
COPY --chown=node:node provision.mjs ./provision.mjs
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD node -e "fetch('http://127.0.0.1:8080/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.mjs"]
