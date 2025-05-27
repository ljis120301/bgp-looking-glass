# Dockerfile

FROM node:20-alpine

# Install git
RUN apk add --no-cache git

WORKDIR /app

# Clone the repository
ARG GITHUB_REPO
RUN git clone ${GITHUB_REPO} .

# Create startup script
RUN echo '#!/bin/sh\n\
cd /app\n\
git pull\n\
npm install\n\
npm run build\n\
npm start' > /app/start.sh && \
chmod +x /app/start.sh

EXPOSE 3000

# Use the startup script
CMD ["/app/start.sh"]
