import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AxiosError } from 'axios';
import { api, login, getSession } from '../customer/lib/api.ts';
import config from '../next.config.ts';

test('login and session requests use the same-origin cookie transport', async () => {
  assert.equal(api.defaults.baseURL, '/api');
  assert.equal(api.defaults.withCredentials, true);
  const user = { id: 'customer-1', role: 'CUSTOMER' };
  const calls = [];
  const previous = api.defaults.adapter;
  api.defaults.adapter = async (request) => {
    calls.push(request.url);
    assert.equal(request.headers['x-serenity-portal'], 'customer');
    return { data: request.url === '/auth/login' ? { user } : user,
      status: 200, statusText: 'OK', headers: {}, config: request };
  };
  try {
    assert.deepEqual(await login('customer@example.com', 'test-password'), user);
    assert.deepEqual(await getSession(), user);
    assert.deepEqual(calls, ['/auth/login', '/auth/me']);
  } finally { api.defaults.adapter = previous; }
});

test('unauthorized session checks do not send a destructive logout', async () => {
  const previous = api.defaults.adapter;
  const calls = [];
  api.defaults.adapter = async (request) => {
    calls.push(request.url);
    throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', request, null,
      { status: 401, data: {}, headers: {}, config: request, statusText: 'Unauthorized' });
  };
  try {
    assert.equal(await getSession(), null);
    assert.deepEqual(calls, ['/auth/me']);
  } finally { api.defaults.adapter = previous; }
});

test('proxy uses backend origin or legacy API URL without duplicating /api', async () => {
  const oldBackend = process.env.BACKEND_URL;
  const oldPublic = process.env.NEXT_PUBLIC_API_URL;
  try {
    for (const [backend, legacy, expected] of [
      ['https://backend.example/', 'https://legacy.example/api', 'https://backend.example/api/:path*'],
      ['https://backend.example/api/', '', 'https://backend.example/api/:path*'],
      ['', 'https://legacy.example/api/', 'https://legacy.example/api/:path*'],
      ['', '/api', 'http://127.0.0.1:4010/api/:path*'],
    ]) {
      process.env.BACKEND_URL = backend;
      process.env.NEXT_PUBLIC_API_URL = legacy;
      assert.deepEqual(await config.rewrites(), [{ source: '/api/:path*', destination: expected }]);
    }
  } finally {
    if (oldBackend === undefined) delete process.env.BACKEND_URL;
    else process.env.BACKEND_URL = oldBackend;
    if (oldPublic === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = oldPublic;
  }
});
