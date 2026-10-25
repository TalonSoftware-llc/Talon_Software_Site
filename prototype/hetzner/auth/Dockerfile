FROM node:22-alpine
WORKDIR /app
COPY auth/package.json auth/package-lock.json ./
RUN npm ci --omit=dev
COPY auth/src ./src
COPY fixtures.js ./fixtures.js
ENV NODE_ENV=production
USER node
EXPOSE 5556
CMD ["node", "src/server.js"]
