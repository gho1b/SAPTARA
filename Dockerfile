FROM node:22-alpine

WORKDIR /app

# ── Install nginx ──
RUN apk add --no-cache nginx

# ── Server dependencies & build ──
COPY ./server/package*.json ./server/
RUN cd server && npm install

COPY ./server ./server
RUN cd server && npm run build

# ── Client dependencies & build ──
COPY ./client/package*.json ./client/
RUN cd client && npm install

COPY ./client ./client
RUN cd client && npm run build

# ── Nginx config ──
COPY ./nginx.conf /etc/nginx/http.d/default.conf

# ── Startup script ──
COPY ./start.sh /app/start.sh
RUN chmod +x /app/start.sh

# ── Environment ──
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=./server/saptara.db
ENV BETTER_AUTH_SECRET=saptara-secret-key-change-in-production
ENV BETTER_AUTH_URL=http://localhost:3000
ENV JWT_SECRET=saptara-student-jwt-secret-change-in-production
ENV UPLOAD_DIR=./server/uploads

EXPOSE 80

CMD ["/app/start.sh"]
