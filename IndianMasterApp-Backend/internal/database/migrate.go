package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// baselineCutoff is the numeric prefix of the last migration that was already
// present in any existing database before the migration runner was introduced.
// In baseline mode all pending migrations whose numeric prefix is ≤ this value
// are recorded as applied WITHOUT being executed.
// Migrations with a higher prefix are always executed — they must therefore be
// written with IF NOT EXISTS / IF EXISTS so they are safe to run on any DB.
const baselineCutoff = "000016"

// RunMigrations applies all pending *.up.sql migrations from migrationsDir.
//
// Baseline safety for existing databases
// ────────────────────────────────────────
// If the server is started against a database that was initialised before the
// migration runner existed, schema_migrations will be empty even though all
// the old tables are already present.  In that situation the runner enters
// "baseline mode":
//
//   - Every pending migration whose numeric prefix is ≤ baselineCutoff is
//     recorded in schema_migrations WITHOUT being executed.  The DB already
//     contains those schema objects, so executing the DDL would fail.
//
//   - Every pending migration whose numeric prefix is > baselineCutoff IS
//     executed normally.  These migrations must use IF NOT EXISTS / IF EXISTS
//     so they are idempotent and safe to run even if some objects happen to
//     exist already.
//
// Fresh databases (schema_migrations empty AND users table absent) run every
// migration from scratch as before.
func RunMigrations(database *sql.DB, migrationsDir string) error {
	// ── 1. Ensure tracking table exists ──────────────────────────────────────
	if _, err := database.Exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version    VARCHAR(255) PRIMARY KEY,
			applied_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
		)
	`); err != nil {
		return fmt.Errorf("create schema_migrations table: %w", err)
	}

	// ── 2. Collect *.up.sql files sorted by name ──────────────────────────────
	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("read migrations dir %q: %w", migrationsDir, err)
	}

	var upFiles []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".up.sql") {
			upFiles = append(upFiles, e.Name())
		}
	}
	sort.Strings(upFiles)

	if len(upFiles) == 0 {
		log.Println("  No migration files found in", migrationsDir)
		return nil
	}

	// ── 3. Detect baseline mode ───────────────────────────────────────────────
	// Baseline mode = the DB is already initialised (users table present).
	// We do NOT gate on schema_migrations being empty: a previous failed run
	// may have recorded some entries before crashing, leaving trackedCount > 0
	// while other historical migrations remain untracked and would fail if
	// executed (e.g. 000006 referencing a column that no longer exists).
	// By always checking for the users table we correctly handle both the
	// "completely empty schema_migrations" case and the "partially filled
	// schema_migrations from a crashed prior run" case.
	baselineMode := false

	var usersExists bool
	if err := database.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM information_schema.tables
			WHERE table_schema = 'public' AND table_name = 'users'
		)
	`).Scan(&usersExists); err != nil {
		return fmt.Errorf("check users table existence: %w", err)
	}
	if usersExists {
		baselineMode = true
		log.Println("  Existing database detected; baselining historical migrations (cutoff:", baselineCutoff+")")
	}

	// ── 4. Apply / baseline each pending migration ────────────────────────────
	applied := 0
	baselined := 0

	for _, filename := range upFiles {
		version := strings.TrimSuffix(filename, ".up.sql")

		// Skip migrations already recorded
		var count int
		if err := database.QueryRow(
			"SELECT COUNT(*) FROM schema_migrations WHERE version = $1", version,
		).Scan(&count); err != nil {
			return fmt.Errorf("check migration %s: %w", version, err)
		}
		if count > 0 {
			continue
		}

		if baselineMode && numericPrefix(version) <= baselineCutoff {
			// Historical migration — record without executing.
			// The DB already has these schema objects; running the DDL would fail.
			if _, err := database.Exec(
				"INSERT INTO schema_migrations (version) VALUES ($1)", version,
			); err != nil {
				return fmt.Errorf("record baselined migration %s: %w", version, err)
			}
			log.Printf("  ~ Baselined (skipped): %s", filename)
			baselined++
			continue
		}

		// Read the SQL file
		sqlBytes, err := os.ReadFile(filepath.Join(migrationsDir, filename))
		if err != nil {
			return fmt.Errorf("read migration file %s: %w", filename, err)
		}

		// Execute the migration
		if _, err := database.Exec(string(sqlBytes)); err != nil {
			return fmt.Errorf("apply migration %s: %w", filename, err)
		}

		// Record as applied
		if _, err := database.Exec(
			"INSERT INTO schema_migrations (version) VALUES ($1)", version,
		); err != nil {
			return fmt.Errorf("record migration %s: %w", version, err)
		}

		log.Printf("  + Applied: %s", filename)
		applied++
	}

	// ── 5. Summary ────────────────────────────────────────────────────────────
	switch {
	case applied == 0 && baselined == 0:
		log.Println("  All migrations already up to date")
	case baselineMode && baselined > 0:
		log.Printf("  Baseline complete: %d applied, %d baselined (skipped)", applied, baselined)
	default:
		log.Printf("  %d migration(s) applied", applied)
	}

	return nil
}

// numericPrefix returns the leading zero-padded number from a migration version
// string (e.g. "000016_create_instant_job_applications" → "000016").
// If the version does not start with digits, it is returned as-is so that
// the comparison falls back gracefully.
func numericPrefix(version string) string {
	i := 0
	for i < len(version) && version[i] >= '0' && version[i] <= '9' {
		i++
	}
	if i == 0 {
		return version
	}
	return version[:i]
}
