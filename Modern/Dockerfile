FROM node:22-bookworm-slim

ARG BUILD_ID=development
ENV NODE_ENV=production \
    TOP_DEPLOYMENT_PROFILE=field-test \
    BUILD_ID=${BUILD_ID}

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node . .

USER node
EXPOSE 3000
CMD ["node", "server.js"]
