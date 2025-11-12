// ...existing code...
const crypto = require('crypto');
const { Pool } = require('pg');

let dao;
let queryMock;
let poolQuerySpy;
let scryptSpy;

beforeAll(async () => {
  queryMock = jest.fn();
  poolQuerySpy = jest.spyOn(Pool.prototype, 'query').mockImplementation(function (...args) {
    return queryMock(...args);
  });

  // import ESM dao after stubbing Pool.prototype.query
  dao = await import('../dao.mjs');
});

afterAll(() => {
  poolQuerySpy && poolQuerySpy.mockRestore();
});

beforeEach(() => {
  if (scryptSpy) {
    scryptSpy.mockRestore();
    scryptSpy = null;
  }
  queryMock.mockReset();
});

afterEach(() => {
  if (scryptSpy) {
    scryptSpy.mockRestore();
    scryptSpy = null;
  }
  queryMock.mockReset();
});

const mkHex32 = (fill = 0x11) => Buffer.alloc(32, fill).toString('hex');

test('getOperators: returns false when no operator found', async () => {
  queryMock.mockResolvedValueOnce({ rows: [] });

  const res = await dao.getOperators('noone@example.com', 'password');
  expect(res).toBe(false);
});

test('getOperators: returns operator object when password matches', async () => {
  const passwordHashHex = mkHex32(0x22);
  const fakeRow = {
    operator_id: 42,
    username: 'opuser',
    salt: 'somesalt',
    password_hash: passwordHashHex,
    email: 'op@example.com'
  };

  queryMock.mockResolvedValueOnce({ rows: [fakeRow] });

  scryptSpy = jest.spyOn(crypto, 'scrypt').mockImplementation((password, salt, len, cb) => {
    cb(null, Buffer.from(passwordHashHex, 'hex'));
  });

  const res = await dao.getOperators(fakeRow.email, 'irrelevant');
  expect(res).toEqual({ id: fakeRow.operator_id, username: fakeRow.username, type: 'operator' });
});

test('getOperators: returns false when password does not match', async () => {
  const passwordHashHex = mkHex32(0x33);
  const fakeRow = {
    operator_id: 43,
    username: 'opuser2',
    salt: 'othersalt',
    password_hash: passwordHashHex,
    email: 'op2@example.com'
  };

  queryMock.mockResolvedValueOnce({ rows: [fakeRow] });

  scryptSpy = jest.spyOn(crypto, 'scrypt').mockImplementation((password, salt, len, cb) => {
    // different buffer same length
    cb(null, Buffer.from(mkHex32(0x44), 'hex'));
  });

  const res = await dao.getOperators(fakeRow.email, 'wrongpass');
  expect(res).toBe(false);
});

test('getOperators: propagates scrypt error', async () => {
  const passwordHashHex = mkHex32(0x55);
  const fakeRow = {
    operator_id: 44,
    username: 'opuser3',
    salt: 'salt3',
    password_hash: passwordHashHex,
    email: 'op3@example.com'
  };

  queryMock.mockResolvedValueOnce({ rows: [fakeRow] });

  const testErr = new Error('scrypt failed');
  scryptSpy = jest.spyOn(crypto, 'scrypt').mockImplementation((password, salt, len, cb) => {
    cb(testErr);
  });

  await expect(dao.getOperators(fakeRow.email, 'any')).rejects.toBe(testErr);
});

test('getUser: returns user when citizen found and password matches', async () => {
  const passwordHashHex = mkHex32(0x66);
  const fakeOperator = {
    operator_id: 101,
    username: 'citizen1',
    salt: 'salt-citizen',
    password_hash: passwordHashHex,
    email: 'citizen@example.com'
  };

  // first query is citizens -> return the citizen row
  queryMock.mockResolvedValueOnce({ rows: [fakeOperator] });

  scryptSpy = jest.spyOn(crypto, 'scrypt').mockImplementation((password, salt, len, cb) => {
    cb(null, Buffer.from(passwordHashHex, 'hex'));
  });

  const res = await dao.getUser(fakeOperator.email, 'pw');
  expect(res).toEqual({ id: fakeOperator.operator_id, username: fakeOperator.username, type: 'operator' });
});

test('getUser: falls back to operators when citizen not found', async () => {
  const opHashHex = mkHex32(0x77);
  const fakeOperator = {
    operator_id: 202,
    username: 'opfallback',
    salt: 'salt-op',
    password_hash: opHashHex,
    email: 'opfallback@example.com'
  };

  // first call (citizens) -> no rows, second call (operators) -> operator row
  queryMock.mockImplementation((sql, params) => {
    if (sql && sql.includes('"citizens"')) return Promise.resolve({ rows: [] });
    return Promise.resolve({ rows: [fakeOperator] });
  });

  scryptSpy = jest.spyOn(crypto, 'scrypt').mockImplementation((password, salt, len, cb) => {
    cb(null, Buffer.from(opHashHex, 'hex'));
  });

  const res = await dao.getUser(fakeOperator.email, 'pw');
  expect(res).toEqual({ id: fakeOperator.operator_id, username: fakeOperator.username, type: 'operator' });
});

test('createUser: inserts and returns new citizen id', async () => {
  const hashedBuf = Buffer.alloc(32, 0x88);
  const fakeId = 555;
  // scrypt should return a 32-byte buffer
  scryptSpy = jest.spyOn(crypto, 'scrypt').mockImplementation((password, salt, len, cb) => {
    cb(null, hashedBuf);
  });

  // Expect INSERT to return the new citizen_id
  queryMock.mockResolvedValueOnce({ rows: [{ citizen_id: fakeId }] });

  const res = await dao.createUser('u1', 'u1@example.com', 'First', 'Last', true, 'password123');
  expect(res.id).toBe(fakeId);
});

test('createMunicipalityUser: inserts and returns operator id', async () => {
  const hashedBuf = Buffer.alloc(32, 0x99);
  const fakeOpId = 777;
  scryptSpy = jest.spyOn(crypto, 'scrypt').mockImplementation((password, salt, len, cb) => {
    cb(null, hashedBuf);
  });

  queryMock.mockResolvedValueOnce({ rows: [{ operator_id: fakeOpId }] });

  const res = await dao.createMunicipalityUser('op@example.com', 'opname', 'opPass', 3);
  expect(res.id).toBe(fakeOpId);
});

test('getAllOffices: maps rows to id/name', async () => {
  const rows = [
    { office_id: 1, name: 'Office A' },
    { office_id: 2, name: 'Office B' }
  ];
  queryMock.mockResolvedValueOnce({ rows });

  const res = await dao.getAllOffices();
  expect(res).toEqual([
    { id: 1, name: 'Office A' },
    { id: 2, name: 'Office B' }
  ]);
});

test('getAllOperators: maps rows and includes office_name', async () => {
  const rows = [
    { operator_id: 10, email: 'a@x', username: 'a', office_id: 5, office_name: 'Off1', role_name: 'municipality_user'  },
    { operator_id: 11, email: 'b@x', username: 'b', office_id: null, office_name: null, role_name: 'municipality_user'  }
  ];
  queryMock.mockResolvedValueOnce({ rows });

  const res = await dao.getAllOperators();
  expect(res).toEqual([
    { id: 10, email: 'a@x', username: 'a', office_id: 5, office_name: 'Off1', role: 'municipality_user' },
    { id: 11, email: 'b@x', username: 'b', office_id: null, office_name: null, role: 'municipality_user' }
  ]);
});


test('returns false when no operator found', async () => {
  queryMock.mockResolvedValue({ rows: [] });

  const result = await dao.getOperators('noone@example.com', 'password');
  expect(result).toBe(false);
});

test('returns operator object when password matches', async () => {
  const passwordHashHex = 'a'.repeat(64);
  const fakeRow = {
    operator_id: 42,
    username: 'opuser',
    salt: 'somesalt',
    password_hash: passwordHashHex,
    email: 'op@example.com'
  };
  queryMock.mockResolvedValue({ rows: [fakeRow] });

  cryptoScryptSpy = jest.spyOn(crypto, 'scrypt').mockImplementation((password, salt, len, cb) => {
    cb(null, Buffer.from(passwordHashHex, 'hex'));
  });

  const result = await dao.getOperators(fakeRow.email, 'irrelevant');
  expect(result).toEqual({ id: fakeRow.operator_id, username: fakeRow.username, type: 'operator' });
});

test('returns false when password does not match', async () => {
  const passwordHashHex = 'a'.repeat(64);
  const fakeRow = {
    operator_id: 43,
    username: 'opuser2',
    salt: 'othersalt',
    password_hash: passwordHashHex,
    email: 'op2@example.com'
  };
  queryMock.mockResolvedValue({ rows: [fakeRow] });

  // Return a different 32-byte buffer so timingSafeEqual is false
  cryptoScryptSpy = jest.spyOn(crypto, 'scrypt').mockImplementation((password, salt, len, cb) => {
    cb(null, Buffer.from('b'.repeat(64), 'hex'));
  });

  const result = await dao.getOperators(fakeRow.email, 'wrongpass');
  expect(result).toBe(false);
});

test('propagates scrypt error', async () => {
  const passwordHashHex = 'a'.repeat(64);
  const fakeRow = {
    operator_id: 44,
    username: 'opuser3',
    salt: 'salt3',
    password_hash: passwordHashHex,
    email: 'op3@example.com'
  };
  queryMock.mockResolvedValue({ rows: [fakeRow] });

  const testErr = new Error('scrypt failed');
  cryptoScryptSpy = jest.spyOn(crypto, 'scrypt').mockImplementation((password, salt, len, cb) => {
    cb(testErr);
  });

  await expect(dao.getOperators(fakeRow.email, 'any')).rejects.toBe(testErr);
});