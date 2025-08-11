#!/bin/bash
# docker-compose.sh
# dev environment
docker compose --env-file .env.dev -p node-app -f docker-compose.yml up -d

# production environment
# docker compose --env-file .env.prod -p node-app-prod -f docker-compose.yml up -d

# staging environment
# docker compose --env-file .env.staging -p node-app-staging -f docker-compose.yml up -d