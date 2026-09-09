FROM node:20-alpine

WORKDIR /app

# Install dependencies first for efficient caching
COPY package*.json ./
RUN npm install --omit=dev

# Copy application code
COPY . .

# Default environment
ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "server.js"]
