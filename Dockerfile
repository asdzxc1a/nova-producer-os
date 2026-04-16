# Build stage
FROM rust:1.85-slim AS builder
WORKDIR /app

# Copy shared crates first (better layer caching)
COPY my-agent-cli/rust/crates/ /app/my-agent-cli/rust/crates/

# Copy server source
COPY nova-producer-os-web/server/ /app/nova-producer-os-web/server/

WORKDIR /app/nova-producer-os-web/server
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN mkdir -p /data

COPY --from=builder /app/nova-producer-os-web/server/target/release/nova-producer-web-server /app/nova-producer-web-server

ENV PORT=3001
ENV WORKSPACE_ROOT=/data

EXPOSE 3001

CMD ["/app/nova-producer-web-server"]
