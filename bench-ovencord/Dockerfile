FROM bun:latest
WORKDIR /app
COPY package.json ./
RUN bun install
COPY . .
CMD ["bun", "index.ts"]
