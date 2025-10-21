#!/bin/bash
# docker-compose.sh
# dev environment
docker compose --env-file .env.dev -p node-app-dev -f docker-compose.dev.yml up -d