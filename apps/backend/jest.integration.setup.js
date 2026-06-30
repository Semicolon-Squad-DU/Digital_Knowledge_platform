// Point at the disposable test database (docker-compose.test.yml), never the
// shared Supabase dev database, before any app module reads DATABASE_URL.
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://dkp_test_user:dkp_test_password@localhost:5433/dkp_test";
process.env.JWT_SECRET ||= "test-jwt-secret";
process.env.NODE_ENV = "test";
