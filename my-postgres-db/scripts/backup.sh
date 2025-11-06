#!/bin/bash

# Backup PostgreSQL database

# Load environment variables from .env file
if [ -f ../.env ]; then
    export $(grep -v '^#' ../.env | xargs)
fi

# Set default values for variables if not set
DB_NAME=${DB_NAME:-my_database}
DB_USER=${DB_USER:-my_user}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
BACKUP_FILE="backup_$(date +'%Y%m%d_%H%M%S').sql"

# Create a backup of the database
pg_dump -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Backup successful! File: $BACKUP_FILE"
else
    echo "Backup failed!"
fi