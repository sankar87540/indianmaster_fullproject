package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq" // PostgreSQL driver
)

// Connect establishes a connection to PostgreSQL using environment variables.
// It retries a few times if the database is not ready yet.
func Connect() (*sql.DB, error) {
	// Read DB config from environment variables
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")
	sslMode := os.Getenv("DB_SSLMODE")
	if sslMode == "" {
		sslMode = "disable" // default to disable if not set
	}

	// Build DSN (Data Source Name)
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		dbHost, dbPort, dbUser, dbPass, dbName, sslMode,
	)

	// Open DB connection (does not ping yet)
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("db open error: %w", err)
	}

	// Retry loop: wait until Postgres is ready
	for i := 1; i <= 5; i++ {
		err = db.Ping()
		if err == nil {
			log.Println("✅ Connected to PostgreSQL")
			return db, nil
		}

		log.Printf("⏳ DB not ready (attempt %d/5): %v\n", i, err)
		time.Sleep(2 * time.Second)
	}

	// If still failing after retries, return error
	return nil, fmt.Errorf("❌ could not connect to database after retries: %w", err)
}
