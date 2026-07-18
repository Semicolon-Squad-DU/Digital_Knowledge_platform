// isDomainAllowed enforces the "institutional email only" registration rule
// (see the FR-045 scope note in auth.routes.ts) — this is the actual gate
// keeping self-service registration restricted to allowed domains when
// ALLOWED_EMAIL_DOMAINS is configured.
//
// Rather than mocking core/config wholesale (which cascades into every other
// module auth.routes.ts transitively imports — pool.ts, s3.service.ts,
// etc. — since they all read from the same config object), each test sets
// ALLOWED_EMAIL_DOMAINS in process.env and uses jest.isolateModules so
// config/index.ts picks it up fresh, exactly like a real deployment with
// that env var set. Each test gets its own isolateModules call (rather than
// sharing one from a beforeAll) so env changes never leak between tests.
function loadIsDomainAllowed(allowedDomainsEnv: string | undefined): (email: string) => boolean {
  const previous = process.env.ALLOWED_EMAIL_DOMAINS;
  if (allowedDomainsEnv === undefined) {
    delete process.env.ALLOWED_EMAIL_DOMAINS;
  } else {
    process.env.ALLOWED_EMAIL_DOMAINS = allowedDomainsEnv;
  }

  let isDomainAllowed!: (email: string) => boolean;
  jest.isolateModules(() => {
    isDomainAllowed = (jest.requireActual("../auth.routes") as typeof import("../auth.routes")).isDomainAllowed;
  });

  if (previous === undefined) delete process.env.ALLOWED_EMAIL_DOMAINS;
  else process.env.ALLOWED_EMAIL_DOMAINS = previous;

  return isDomainAllowed;
}

describe("isDomainAllowed with a configured allowlist", () => {
  const isDomainAllowed = loadIsDomainAllowed("du.ac.bd");

  it("accepts an exact-match domain", () => {
    expect(isDomainAllowed("student@du.ac.bd")).toBe(true);
  });

  it("accepts a subdomain of an allowed domain", () => {
    expect(isDomainAllowed("student@cse.du.ac.bd")).toBe(true);
  });

  it("rejects a domain that isn't in the allowlist", () => {
    expect(isDomainAllowed("someone@gmail.com")).toBe(false);
  });

  it("rejects a domain that merely contains the allowed domain as a substring, not a real subdomain", () => {
    // "notdu.ac.bd" is not the same as, nor a subdomain of, "du.ac.bd" —
    // this guards against a naive .includes()-style check that would
    // wrongly accept it.
    expect(isDomainAllowed("student@notdu.ac.bd")).toBe(false);
  });

  it("rejects malformed input with no @ or no domain part", () => {
    expect(isDomainAllowed("not-an-email")).toBe(false);
    expect(isDomainAllowed("student@")).toBe(false);
  });

  it("is case-insensitive on the domain part", () => {
    expect(isDomainAllowed("student@DU.AC.BD")).toBe(true);
  });
});

describe("isDomainAllowed with no domain restriction configured", () => {
  const isDomainAllowed = loadIsDomainAllowed(undefined);

  it("allows any domain when ALLOWED_EMAIL_DOMAINS is unset (self-service registration open to all)", () => {
    expect(isDomainAllowed("anyone@gmail.com")).toBe(true);
  });
});
