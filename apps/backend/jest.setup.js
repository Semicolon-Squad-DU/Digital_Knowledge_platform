// Dummy values so importing app modules (which load config at import time)
// doesn't throw in unit tests — these are never used to make a real connection.
process.env.DATABASE_URL ||= "postgresql://test:test@localhost:5432/test";
process.env.JWT_SECRET ||= "test-jwt-secret";
