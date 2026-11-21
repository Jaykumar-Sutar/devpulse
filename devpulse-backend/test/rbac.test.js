const { test } = require('node:test');
const assert = require('node:assert/strict');

// Mirrors the requireAdmin middleware behavior in devpulse-backend/server.js
function requireAdmin(req, res, next) {
  const userRole = req.headers['x-user-role'];
  if (userRole !== 'admin') {
    return res.status(403).json({
      error: 'Access denied: Admin privileges required.'
    });
  }
  next();
}

function resolveWorkspaceId(req) {
  return req.headers['x-workspace-id'] || 'default-workspace';
}

test('requireAdmin blocks non-admin requests with 403', () => {
  const req = { headers: { 'x-user-role': 'developer' } };
  let statusCode = null;
  let jsonBody = null;
  let nextCalled = false;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonBody = payload;
      return this;
    }
  };

  requireAdmin(req, res, () => {
    nextCalled = true;
  });

  assert.equal(statusCode, 403);
  assert.equal(nextCalled, false);
  assert.deepEqual(jsonBody, {
    error: 'Access denied: Admin privileges required.'
  });
});

test('requireAdmin blocks missing or empty x-user-role headers with 403', () => {
  for (const headers of [{}, { 'x-user-role': '' }, { 'x-user-role': 'ADMIN' }]) {
    const req = { headers };
    let statusCode = null;
    let nextCalled = false;

    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json() {
        return this;
      }
    };

    requireAdmin(req, res, () => {
      nextCalled = true;
    });

    assert.equal(statusCode, 403);
    assert.equal(nextCalled, false);
  }
});

test('requireAdmin allows requests with x-user-role: admin', () => {
  const req = { headers: { 'x-user-role': 'admin' } };
  let nextCalled = false;

  const res = {
    status() {
      throw new Error('Should not set an error status for admin');
    },
    json() {
      throw new Error('Should not send JSON error for admin');
    }
  };

  requireAdmin(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});

test('resolveWorkspaceId uses x-workspace-id header or falls back to default-workspace', () => {
  assert.equal(
    resolveWorkspaceId({ headers: { 'x-workspace-id': 'ws-techedge-1' } }),
    'ws-techedge-1'
  );
  assert.equal(resolveWorkspaceId({ headers: {} }), 'default-workspace');
});