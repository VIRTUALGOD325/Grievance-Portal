# My PostgreSQL Database Project

This project sets up a PostgreSQL database with a defined schema and initial data. It includes scripts for backup and restoration, as well as Docker configurations for easy deployment.

## Project Structure

```
my-postgres-db
├── src
│   ├── migrations
│   │   └── 20251106084933_init.sql
│   ├── seeds
│   │   └── initial_data.sql
│   └── functions
│       └── triggers.sql
├── scripts
│   ├── backup.sh
│   └── restore.sh
├── docker
│   ├── Dockerfile
│   └── docker-compose.yml
├── .env.example
└── README.md
```

## Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd my-postgres-db
   ```

2. **Set up environment variables**:
   Copy `.env.example` to `.env` and fill in the necessary database connection details.

3. **Run migrations**:
   Execute the SQL commands in `src/migrations/20251106084933_init.sql` to create the database schema.

4. **Seed initial data**:
   Run the SQL commands in `src/seeds/initial_data.sql` to populate the database with default values.

5. **Backup and Restore**:
   Use the scripts in the `scripts` directory to back up and restore your database as needed.

6. **Docker Setup**:
   Build and run the Docker container using the provided `Dockerfile` and `docker-compose.yml`.

## Usage

- After setting up the database, you can connect to it using your preferred PostgreSQL client.
- Refer to the individual SQL files for details on the database schema and initial data.

## Contributing

Feel free to submit issues or pull requests for improvements or bug fixes.