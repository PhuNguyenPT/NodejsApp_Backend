#!/bin/bash

# dev environment
docker compose --env-file .env.dev -p node-app -f docker-compose.yml up -d

# production environment
# docker compose --env-file .env.prod -p cleaning-service -f docker-compose.yml up -d

# staging environment
# docker compose --env-file .env.staging -p cleaning-service -f docker-compose.yml up -d