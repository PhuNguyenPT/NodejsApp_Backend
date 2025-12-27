#!/bin/bash
# docker-compose-prod.sh
# staging environment
if ! docker network ls --format '{{.Name}}' | grep -q '^frontend-network-staging$'; then
    docker network create --driver bridge --attachable frontend-network-staging
fi
if ! docker network ls --format '{{.Name}}' | grep -q '^backend-network-staging$'; then
    docker network create --driver bridge --attachable backend-network-staging
fi
if ! docker network ls --format '{{.Name}}' | grep -q '^app-shared-network-staging$'; then
    docker network create --driver bridge --attachable app-shared-network-staging
fi
docker compose --env-file .env.staging -p node-app-staging -f docker-compose.staging.yml up -d --build
