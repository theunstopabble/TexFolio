# Base image with Node.js
FROM node:18-bullseye-slim

# Install TeX Live (LaTeX) and basic utilities
# We use --no-install-recommends to keep the image smaller, but meaningful packages are needed.
# texlive-latex-base: Basic LaTeX
# texlive-fonts-recommended: Standard fonts
# texlive-latex-extra: Additional packages often used in resumes (e.g., moderncv dependencies might be here)
RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-latex-extra \
    python3 \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy workspace package files
# We need to preserve directory structure for workspaces
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies (including workspace links)
RUN npm ci

# Copy source code
COPY . .

# Build the project (Shared first, then API)
RUN npm run build:deploy

# Expose the API port
EXPOSE 10000
# We will use the PORT env var provided by Render

# Start command
CMD ["npm", "run", "start:deploy"]
