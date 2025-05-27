# Dockerfile

FROM node:20-alpine

# Install git
RUN apk add --no-cache git

WORKDIR /app

# Clone the repository
ARG GITHUB_REPO
RUN git clone ${GITHUB_REPO} .

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Build the application
RUN npm run build

EXPOSE 3000

# Start the production server
CMD ["npm", "start"]
