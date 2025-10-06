#!/bin/bash
# docker-compose-prod.sh
# production environment
docker compose --env-file .env.staging -p node-app-staging -f docker-compose-staging.yml up -d --build
