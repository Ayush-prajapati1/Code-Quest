import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { app } from '../server.js'

let server
let baseUrl

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve)
  })

  const address = server.address()
  baseUrl = `http://127.0.0.1:${address.port}`
})

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
})

test('health endpoint reports API and database state without exposing secrets', async () => {
  const response = await fetch(`${baseUrl}/api/health`)
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.status, 'ok')
  assert.equal(body.database, 'disconnected')
  assert.deepEqual(Object.keys(body).sort(), ['database', 'status'])
})

test('player progress rejects requests without a bearer token', async () => {
  const response = await fetch(`${baseUrl}/api/player/progress`)
  const body = await response.json()

  assert.equal(response.status, 401)
  assert.equal(body.message, 'Authentication required')
})

test('unknown API routes use the consistent JSON error shape', async () => {
  const response = await fetch(`${baseUrl}/api/not-a-route`)
  const body = await response.json()

  assert.equal(response.status, 404)
  assert.equal(body.message, 'Route not found')
})

test('CORS rejects origins outside CLIENT_URL', async () => {
  const response = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: 'https://untrusted.example' },
  })
  const body = await response.json()

  assert.equal(response.status, 403)
  assert.equal(body.message, 'Origin is not allowed by CORS')
})
