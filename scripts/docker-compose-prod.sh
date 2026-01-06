#!/bin/bash
# docker-compose-prod.sh
# production environment
if ! docker network ls --format '{{.Name}}' | grep -q '^frontend-network-prod$'; then
    docker network create --driver bridge --attachable frontend-network-prod
fi
if ! docker network ls --format '{{.Name}}' | grep -q '^backend-network-prod$'; then
    docker network create --driver bridge --attachable backend-network-prod
fi
docker compose --env-file .env.prod -p node-app-prod -f docker-compose.prod.yml up -d --build
