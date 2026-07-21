FROM python:3.12-slim

# Install Node.js 20 + system libraries needed by node-canvas
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Install mind-compiler Node dependencies
COPY mind-compiler/package.json mind-compiler/package-lock.json* ./mind-compiler/
RUN cd mind-compiler && npm install --omit=dev

# Copy the rest of the project
COPY backend ./backend
COPY mind-compiler ./mind-compiler

WORKDIR /app/backend

# Railway provides $PORT at runtime
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}