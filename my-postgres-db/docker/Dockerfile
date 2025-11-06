# Use the official PostgreSQL image from the Docker Hub
FROM postgres:latest

# Set environment variables for the database
ENV POSTGRES_DB=mydatabase
ENV POSTGRES_USER=myuser
ENV POSTGRES_PASSWORD=mypassword

# Copy the initialization scripts into the Docker image
COPY ../src/migrations/ /docker-entrypoint-initdb.d/migrations/
COPY ../src/seeds/ /docker-entrypoint-initdb.d/seeds/
COPY ../src/functions/ /docker-entrypoint-initdb.d/functions/

# Expose the PostgreSQL port
EXPOSE 5432