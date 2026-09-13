FROM node:22-bookworm-slim

ARG BUILD_ID
ENV NODE_ENV=production \
    TOP_DEPLOYMENT_PROFILE=field-test

# Keep the identity in the artifact rather than in runtime-overridable
# environment.  The label supports image inspection and the file is what the
# application/rehearsal reads from the running filesystem.
RUN case "$BUILD_ID" in \
      *[!0-9a-f]*|'') echo "BUILD_ID must be a 40-character lowercase Git SHA" >&2; exit 1 ;; \
    esac && \
    test "${#BUILD_ID}" -eq 40 || (echo "BUILD_ID must be a 40-character lowercase Git SHA" >&2; exit 1) && \
    printf '%s\n' "$BUILD_ID" > /opt/top-build-id
LABEL org.opencontainers.image.revision=$BUILD_ID

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --chown=node:node . .

RUN cp /opt/top-build-id /app/.build-id && chown node:node /app/.build-id

USER node
EXPOSE 3000
CMD ["node", "server.js"]
