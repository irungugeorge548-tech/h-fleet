// Runs the real H-Fleet API on port 5002 with an in-memory database (to try the screens without Prisma).
// Needs H-Pesa running at HPESA_API.
const Module = require('module')
const { createFakePrisma } = require('./fakePrisma')
const fake = createFakePrisma()
const realLoad = Module._load
Module._load = function (request, ...rest) {
  if (request === '@prisma/client') return { PrismaClient: function PrismaClient() { return fake } }
  return realLoad.call(this, request, ...rest)
}
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS || 'http://localhost:5175,http://127.0.0.1:5175'
require('../src/index.js').listen(process.env.PORT || 5002, () => console.log('H-Fleet dev API on 5002'))
