FROM node:22-alpine
WORKDIR /app
COPY api/package.json api/package-lock.json ./
RUN npm ci --omit=dev
COPY api/src ./src
RUN mkdir -p /data/blobs && chown node:node /data/blobs
ENV NODE_ENV=production
USER node
EXPOSE 8787
CMD ["node", "src/server.js"]
