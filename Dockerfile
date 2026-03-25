# Step 1: Builder stage
FROM node:20-slim AS builder

WORKDIR /app

# Install openssl for Prisma (needed on slim images)
RUN apt-get update && apt-get install -y openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Step 2: Runtime stage
FROM node:20-slim
WORKDIR /app

# Install openssl for Prisma runtime
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app ./

EXPOSE 3000

CMD ["npm", "run", "start"]
