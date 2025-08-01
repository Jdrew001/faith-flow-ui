FROM jetbrains/teamcity-agent:latest

USER root

# Install basic dependencies and Chromium dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    ca-certificates \
    unzip \
    wget \
    xdg-utils \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    && apt-get clean

# Detect codename manually and install Docker CLI
RUN echo "deb [arch=amd64] https://download.docker.com/linux/debian bookworm stable" > /etc/apt/sources.list.d/docker.list \
    && curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg \
    && apt-get update \
    && apt-get install -y docker-ce-cli

# Install Node.js (v18) & Angular CLI
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g @angular/cli puppeteer

# Puppeteer config
ENV PUPPETEER_SKIP_DOWNLOAD=false
ENV CHROME_BIN=/usr/bin/google-chrome

USER buildagent
