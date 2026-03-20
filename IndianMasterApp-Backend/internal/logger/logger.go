package logger

import (
	"fmt"
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// Logger wraps zap.Logger for application-wide logging
var Logger *zap.Logger

// Init initializes the global logger with JSON format for production
func Init(environment string) error {
	var config zap.Config

	if environment == "production" {
		// Production config: JSON format, Info level and above
		config = zap.Config{
			Level:             zap.NewAtomicLevelAt(zapcore.InfoLevel),
			Development:       false,
			DisableCaller:     false,
			DisableStacktrace: true,
			Encoding:          "json",
			EncoderConfig: zapcore.EncoderConfig{
				MessageKey:     "message",
				LevelKey:       "level",
				TimeKey:        "timestamp",
				NameKey:        "logger",
				CallerKey:      "caller",
				StacktraceKey:  "stacktrace",
				LineEnding:     zapcore.DefaultLineEnding,
				EncodeLevel:    zapcore.LowercaseLevelEncoder,
				EncodeTime:     zapcore.ISO8601TimeEncoder,
				EncodeDuration: zapcore.MillisDurationEncoder,
				EncodeCaller:   zapcore.ShortCallerEncoder,
			},
			OutputPaths:      []string{"stdout"},
			ErrorOutputPaths: []string{"stderr"},
		}
	} else {
		// Development config: Console format, Debug level and above
		config = zap.Config{
			Level:             zap.NewAtomicLevelAt(zapcore.DebugLevel),
			Development:       true,
			DisableCaller:     false,
			DisableStacktrace: false,
			Encoding:          "console",
			EncoderConfig: zapcore.EncoderConfig{
				MessageKey:     "message",
				LevelKey:       "level",
				TimeKey:        "timestamp",
				NameKey:        "logger",
				CallerKey:      "caller",
				StacktraceKey:  "stacktrace",
				LineEnding:     zapcore.DefaultLineEnding,
				EncodeLevel:    zapcore.CapitalColorLevelEncoder,
				EncodeTime:     zapcore.ISO8601TimeEncoder,
				EncodeDuration: zapcore.MillisDurationEncoder,
				EncodeCaller:   zapcore.ShortCallerEncoder,
			},
			OutputPaths:      []string{"stdout"},
			ErrorOutputPaths: []string{"stderr"},
		}
	}

	logger, err := config.Build()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to initialize logger: %v\n", err)
		return err
	}

	Logger = logger
	return nil
}

// Info logs an info level message with context fields
func Info(message string, fields ...zap.Field) {
	if Logger != nil {
		Logger.Info(message, fields...)
	}
}

// Error logs an error level message with context fields
func Error(message string, fields ...zap.Field) {
	if Logger != nil {
		Logger.Error(message, fields...)
	}
}

// Debug logs a debug level message with context fields
func Debug(message string, fields ...zap.Field) {
	if Logger != nil {
		Logger.Debug(message, fields...)
	}
}

// Warn logs a warn level message with context fields
func Warn(message string, fields ...zap.Field) {
	if Logger != nil {
		Logger.Warn(message, fields...)
	}
}

// Fatal logs a fatal level message and exits
func Fatal(message string, fields ...zap.Field) {
	if Logger != nil {
		Logger.Fatal(message, fields...)
	}
}

// Sync flushes any buffered log entries; call this before exiting
func Sync() error {
	if Logger != nil {
		return Logger.Sync()
	}
	return nil
}
