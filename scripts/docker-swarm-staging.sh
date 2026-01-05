#!/bin/bash
# Start Backend stack for staging
set -a
source .env.staging
set +a

if ! docker network ls --format '{{.Name}}' | grep -q '^backend-swarm-network-staging$'; then
    docker network create --driver overlay --attachable backend-swarm-network-staging
fi

if ! docker network ls --format '{{.Name}}' | grep -q '^frontend-swarm-network-staging'; then
    docker network create --driver overlay --attachable frontend-swarm-network-staging
fi

docker stack deploy -c docker-compose.swarm.staging.yml backend-swarm-staging --detach=false