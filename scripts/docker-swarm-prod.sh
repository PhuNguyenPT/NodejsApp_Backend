#!/bin/bash
# Start Backend stack for prod
set -a
source .env.prod
set +a

if ! docker network ls --format '{{.Name}}' | grep -q '^backend-swarm-network-prod$'; then
    docker network create --driver overlay --attachable backend-swarm-network-prod
fi

if ! docker network ls --format '{{.Name}}' | grep -q '^frontend-swarm-network-prod'; then
    docker network create --driver overlay --attachable frontend-swarm-network-prod
fi

docker stack deploy -c docker-compose.swarm.prod.yml backend-swarm-prod --detach=false