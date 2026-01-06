#!/bin/bash
# docker-compose.sh
# test environment
if ! docker network ls --format '{{.Name}}' | grep -q '^frontend-network-test$'; then
    docker network create --driver bridge --attachable frontend-network-test
fi
if ! docker network ls --format '{{.Name}}' | grep -q '^backend-network-test$'; then
    docker network create --driver bridge --attachable backend-network-test
fi
docker compose --env-file .env.test -p node-app-test -f docker-compose.test.yml up -d