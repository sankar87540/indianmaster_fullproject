package repositories

import (
	"database/sql"
	"errors"
	"strings"

	apperrors "myapp/internal/errors"

	"github.com/lib/pq"
)

// =======================================
// Database Error Mapping Utility
// =======================================
// Maps PostgreSQL errors to application errors
// This ensures consistent error handling across all repositories
// and prevents internal database errors from leaking to the client
// =======================================

// MapDatabaseError converts PostgreSQL errors to application errors
// This function should be called in all repository methods that interact with the database
// It provides intelligent error mapping based on error codes and messages
func MapDatabaseError(err error, context string) *apperrors.AppError {
	if err == nil {
		return nil
	}

	// Handle specific database errors
	var pgErr *pq.Error
	if errors.As(err, &pgErr) {
		return mapPostgresError(pgErr, context)
	}

	// Handle no rows error
	if errors.Is(err, sql.ErrNoRows) {
		return apperrors.NewResourceNotFoundError("record", "")
	}

	// Handle generic database errors
	errStr := err.Error()

	// Check for "value too long" error
	if strings.Contains(errStr, "value too long for type") {
		// Extract field name from error message if possible
		// Error format: pq: value too long for type character varying(X)
		fieldName := extractFieldNameFromError(errStr)
		return apperrors.NewValidationError(
			"value too long for field: "+fieldName,
			map[string]interface{}{
				"field": fieldName,
				"error": "value_too_long",
			},
		)
	}

	// Check for constraint violation
	if strings.Contains(errStr, "violates check constraint") {
		fieldName := extractFieldFromConstraintError(errStr)
		return apperrors.NewValidationError(
			"invalid value for field: "+fieldName,
			map[string]interface{}{
				"field": fieldName,
				"error": "constraint_violation",
			},
		)
	}

	// Check for not null violation
	if strings.Contains(errStr, "null value in column") {
		fieldName := extractFieldFromNullError(errStr)
		return apperrors.NewValidationError(
			"required field missing: "+fieldName,
			map[string]interface{}{
				"field": fieldName,
				"error": "required_field",
			},
		)
	}

	// Default to internal error
	return apperrors.NewInternalError("database operation failed", err)
}

// mapPostgresError handles specific PostgreSQL error codes
// See: https://www.postgresql.org/docs/current/errcodes-appendix.html
func mapPostgresError(pgErr *pq.Error, context string) *apperrors.AppError {
	switch pgErr.Code {
	case "23505": // unique_violation
		return apperrors.NewConflictError(
			"duplicate entry: " + context + " already exists",
		)

	case "23503": // foreign_key_violation
		fieldName := pgErr.Constraint
		return apperrors.NewForeignKeyError(fieldName, extractTableName(pgErr.Table))

	case "23514": // check_violation
		fieldName := pgErr.Constraint
		return apperrors.NewValidationError(
			"invalid value for field: "+fieldName,
			map[string]interface{}{
				"field":      fieldName,
				"constraint": pgErr.Constraint,
				"error":      "constraint_violation",
			},
		)

	case "23502": // not_null_violation
		return apperrors.NewValidationError(
			"required field missing: "+pgErr.Column,
			map[string]interface{}{
				"field": pgErr.Column,
				"error": "required_field",
			},
		)

	case "22001": // string_data_right_truncation (value too long)
		return apperrors.NewValidationError(
			"value too long for field: "+pgErr.Column,
			map[string]interface{}{
				"field": pgErr.Column,
				"error": "value_too_long",
			},
		)

	case "42P01": // undefined_table
		return apperrors.NewInternalError("table not found", pgErr)

	case "42703": // undefined_column
		return apperrors.NewInternalError("column not found", pgErr)

	case "08006", "08003", "08001": // Connection errors
		return apperrors.NewAppError(
			apperrors.ErrServiceUnavail,
			"database connection failed",
			500,
			nil,
		)

	case "57P03": // cannot_connect_now
		return apperrors.NewAppError(
			apperrors.ErrServiceUnavail,
			"database is in standby mode",
			503,
			nil,
		)

	default:
		// Generic database error
		return apperrors.NewInternalError("database operation failed", pgErr)
	}
}

// extractFieldNameFromError tries to extract field name from error message
// Example: "pq: value too long for type character varying(5)"
func extractFieldNameFromError(errStr string) string {
	if strings.Contains(errStr, "character varying") {
		return "string_field"
	}
	if strings.Contains(errStr, "integer") {
		return "integer_field"
	}
	if strings.Contains(errStr, "timestamp") {
		return "timestamp_field"
	}
	return "unknown_field"
}

// extractFieldFromConstraintError extracts field name from check constraint error
// Example: "pq: new row for relation "users" violates check constraint "chk_users_role""
func extractFieldFromConstraintError(errStr string) string {
	// Try to extract from constraint name chk_[table]_[field]
	if idx := strings.Index(errStr, "chk_"); idx != -1 {
		constraint := errStr[idx:]
		parts := strings.Split(constraint, "\"")
		if len(parts) > 0 {
			constraintName := parts[0]
			// Format: chk_table_field
			nameParts := strings.Split(constraintName, "_")
			if len(nameParts) >= 3 {
				return nameParts[2] // Return the field part
			}
			return constraintName
		}
	}
	return "unknown_field"
}

// extractFieldFromNullError extracts field name from null violation error
// Example: "pq: null value in column "phone" of relation "users" violates not-null constraint"
func extractFieldFromNullError(errStr string) string {
	// Look for "column "fieldname""
	if idx := strings.Index(errStr, "column \""); idx != -1 {
		start := idx + len("column \"")
		if endIdx := strings.Index(errStr[start:], "\""); endIdx != -1 {
			return errStr[start : start+endIdx]
		}
	}
	return "unknown_field"
}

// extractTableName attempts to extract table name from error context
func extractTableName(tableName string) string {
	if tableName == "" {
		return "table"
	}
	return tableName
}

// =======================================
// Usage in Repository Methods
// =======================================
// Example:
//
// err := row.Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)
// if err != nil {
//     return nil, MapDatabaseError(err, "create user")
// }
// return user, nil
//
// This ensures:
// 1. "value too long" → 400 Bad Request
// 2. "unique violation" → 409 Conflict
// 3. "foreign key violation" → 400 Bad Request
// 4. "check constraint violation" → 400 Bad Request
// 5. Unknown errors → 500 Internal Server Error
