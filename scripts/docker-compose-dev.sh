#!/bin/bash
# docker-compose.sh
# dev environment
if ! docker network ls --format '{{.Name}}' | grep -q '^frontend-network-dev$'; then
    docker network create --driver bridge --attachable frontend-network-dev
fi
if ! docker network ls --format '{{.Name}}' | grep -q '^backend-network-dev$'; then
    docker network create --driver bridge --attachable backend-network-dev
fi
docker compose --env-file .env.dev -p node-app-dev -f docker-compose.dev.yml up -d