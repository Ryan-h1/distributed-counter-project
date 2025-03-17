# Development stage with hot reloading
FROM oven/bun as development
WORKDIR /app

COPY package.json .
COPY bun.lock .

# Install all dependencies including dev dependencies
RUN bun install

# Copy source files
COPY src src
COPY tsconfig.json .

ENV NODE_ENV=development
CMD ["bun", "--hot", "src/index.ts"]

EXPOSE 3000

# Production stage
FROM oven/bun as production

WORKDIR /app

COPY package.json .
COPY bun.lock .

RUN bun install --production

COPY src src
COPY tsconfig.json .
# COPY public public

ENV NODE_ENV=production
CMD ["bun", "src/index.ts"]

EXPOSE 3000