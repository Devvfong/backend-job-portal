FROM node:22-alpine

# Install openssl for Prisma (necessary for some alpine builds)
RUN apk add --no-cache openssl

# Create and set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Copy prisma schema first to generate client early
COPY prisma ./prisma/

# Install dependencies (use npm ci for more reliable builds)
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 3000

# Command to run for development with nodemon
CMD ["npm", "run", "dev"]
