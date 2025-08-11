#!/bin/bash
# docker-compose-prod.sh
# production environment
docker compose --env-file .env.prod -p node-app-prod -f docker-compose-prod.yml up -d --build
