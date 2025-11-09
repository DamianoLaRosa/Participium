const request = require('supertest');
const crypto = require('crypto');

// Mock express so we can grab the server instance and close it later
jest.mock('express', () => {
    const realExpress = jest.requireActual('express');

    // function that builds the app and exposes server instance for tests
    const expressFn = (...args) => {
        const app = realExpress(...args);
        const realListen = app.listen.bind(app);
        app.listen = (port, cb) => {
            const server = realListen(port, cb);
            global.__TEST_SERVER__ = server;
            return server;
        };
        return app;
    };

    // copy commonly used express properties so express.json() etc. work
    Object.assign(expressFn, {
        json: realExpress.json,
        urlencoded: realExpress.urlencoded,
        Router: realExpress.Router,
        static: realExpress.static,
    });

    return expressFn;
});

// Provide a pg mock that exposes the internal query mock we can configure
jest.mock('pg', () => {
    const mQuery = jest.fn();
    const Pool = jest.fn().mockImplementation(() => ({ query: mQuery }));
    return { Pool, __queryMock: mQuery };
});

describe('API (index.mjs) - Jest tests with pg/crypto mocks (fixed)', () => {
    let agent;
    let queryMock;
    beforeAll(async () => {
        // get the mock query reference from the mocked module
        const pg = require('pg');
        queryMock = pg.__queryMock;

        // deterministic crypto.scrypt stub
        jest.spyOn(crypto, 'scrypt').mockImplementation((password, salt, len, cb) => {
            const hex = (password === 'correct') ? '01'.repeat(32) : '02'.repeat(32);
            const buf = Buffer.from(hex, 'hex');
            process.nextTick(() => cb(null, buf));
        });

        // configure pg query behaviour
        queryMock.mockImplementation((sql, values) => {
            const s = (sql || '').toString().toLowerCase();

            if (s.includes('from "citizens"') || s.includes('from citizens')) {
                const email = Array.isArray(values) ? values[0] : undefined;
                if (email === 'found@citizen') {
                    return Promise.resolve({
                        rows: [{
                            citizen_id: 101,
                            username: 'citizen_user',
                            salt: 'citizen_salt',
                            password_hash: '01'.repeat(32)
                        }]
                    });
                }
                if (email === 'admin') return Promise.resolve({ rows: [] });
                return Promise.resolve({ rows: [] });
            }

            if (s.includes('from "operators"') && s.includes('where')) {
                const email = Array.isArray(values) ? values[0] : undefined;
                if (email === 'admin') {
                    return Promise.resolve({
                        rows: [{
                            operator_id: 900,
                            username: 'admin',
                            salt: 'op_salt',
                            password_hash: '01'.repeat(32)
                        }]
                    });
                }
                if (email === 'found@operator') {
                    return Promise.resolve({
                        rows: [{
                            operator_id: 201,
                            username: 'operator_user',
                            salt: 'op_salt',
                            password_hash: '01'.repeat(32)
                        }]
                    });
                }
                return Promise.resolve({ rows: [] });
            }

            if (s.includes('insert into citizens')) {
                return Promise.resolve({ rows: [{ citizen_id: 111 }] });
            }

            if (s.includes('insert into operators')) {
                return Promise.resolve({ rows: [{ operator_id: 222 }] });
            }

            if (s.includes('select * from offices') || s.includes('from offices')) {
                return Promise.resolve({
                    rows: [
                        { office_id: 1, name: 'Office A' },
                        { office_id: 2, name: 'Office B' }
                    ]
                });
            }

            if (s.includes('join offices') || (s.includes('from operators') && s.includes('order'))) {
                return Promise.resolve({
                    rows: [
                        { operator_id: 301, email: 'op1@example.com', username: 'op1', office_id: 1, office_name: 'Office A' },
                        { operator_id: 302, email: 'op2@example.com', username: 'op2', office_id: 2, office_name: 'Office B' }
                    ]
                });
            }

            return Promise.resolve({ rows: [] });
        });

        await import('../index.mjs');

        agent = request.agent('http://localhost:3001');

        // small delay to ensure server listening
        await new Promise((r) => setTimeout(r, 100));
    });

    afterAll(async () => {
        jest.restoreAllMocks();
        if (global.__TEST_SERVER__ && typeof global.__TEST_SERVER__.close === 'function') {
            await new Promise((resolve) => global.__TEST_SERVER__.close(resolve));
            global.__TEST_SERVER__ = undefined;
        }
    });

    test('POST /api/registration with empty body -> 422', async () => {
        const res = await agent.post('/api/registration').send({});
        expect(res.status).toBe(422);
        expect(Array.isArray(res.body.errors)).toBe(true);
        expect(res.body.errors.length).toBeGreaterThan(0);
    });

    test('POST /api/registration invalid email & short password -> 422 with messages', async () => {
        const payload = {
            username: 't',
            first_name: 'F',
            last_name: 'L',
            email_notifications: true,
            email: 'bad',
            password: '123'
        };
        const res = await agent.post('/api/registration').send(payload);
        expect(res.status).toBe(422);
        const msgs = res.body.errors.map(e => e.msg.toLowerCase());
        expect(msgs.some(m => m.includes('invalid email'))).toBe(true);
        expect(msgs.some(m => m.includes('at least 6'))).toBe(true);
    });

    test('POST /api/registration valid -> 201 created user', async () => {
        const payload = {
            username: 'newuser',
            first_name: 'First',
            last_name: 'Last',
            email_notifications: true,
            email: 'new@user.it',
            password: 'validpassword'
        };
        const res = await agent.post('/api/registration').send(payload);
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ id: 111, username: 'newuser' });
    });

    test('GET /api/offices -> 200 offices', async () => {
        const res = await agent.get('/api/offices');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0]).toEqual({ id: 1, name: 'Office A' });
    });

    test('GET /api/sessions/current unauthenticated -> 401', async () => {
        const res = await request('http://localhost:3001').get('/api/sessions/current');
        expect(res.status).toBe(401);
        expect(res.body).toMatchObject({ error: 'Not authenticated' });
    });

    test('login as admin, access /api/admin and create user', async () => {
        const loginRes = await agent.post('/api/sessions').send({ username: 'admin', password: 'correct' });
        expect(loginRes.status).toBe(201);
        expect(loginRes.body).toMatchObject({ username: 'admin', type: 'operator' });

        const adminRes = await agent.get('/api/admin');
        expect(adminRes.status).toBe(200);
        expect(Array.isArray(adminRes.body)).toBe(true);
        expect(adminRes.body[0]).toHaveProperty('role', 'municipality_user');

        const createPayload = { username: 'newop', email: 'newop@example.com', password: 'validpass', office_id: 1 };
        const createRes = await agent.post('/api/admin/createuser').send(createPayload);
        expect(createRes.status).toBe(201);
        expect(createRes.body).toMatchObject({ id: 222, username: 'newop' });
    });

    test('DELETE /api/sessions/current logs out', async () => {
        const res = await agent.delete('/api/sessions/current');
        expect([200, 204]).toContain(res.status);
    });


    test('login as admin, access /api/admin and create user', async () => {
        const loginRes = await agent.post('/api/sessions').send({ username: 'admin', password: 'correct' });
        expect(loginRes.status).toBe(201);
        expect(loginRes.body).toMatchObject({ username: 'admin', type: 'operator' });

        const adminRes = await agent.get('/api/admin');
        expect(adminRes.status).toBe(200);
        expect(Array.isArray(adminRes.body)).toBe(true);
        expect(adminRes.body[0]).toHaveProperty('role', 'municipality_user');

        const createPayload = { username: 'newop', email: 'newop@example.com', password: 'validpass', office_id: 1 };
        const createRes = await agent.post('/api/admin/createuser').send(createPayload);
        expect(createRes.status).toBe(201);
        expect(createRes.body).toMatchObject({ id: 222, username: 'newop' });
    });

    test('POST /api/sessions with wrong password -> 401', async () => {
        const res = await agent.post('/api/sessions').send({ username: 'admin', password: 'wrong' });
        expect(res.status).toBe(401);
    });

    test('POST /api/admin/createuser without authentication -> 401', async () => {
        const res = await request('http://localhost:3001').post('/api/admin/createuser').send({
            username: 'x'
        });
        expect(res.status).toBe(401);
    });

    test('POST /api/admin/createuser with invalid payload while authenticated -> 422', async () => {
        // ensure logged in as admin
        await agent.post('/api/sessions').send({ username: 'admin', password: 'correct' });
        const res = await agent.post('/api/admin/createuser').send({
            username: '',
            email: 'bad-email',
            password: '123',
            office_id: 'not-an-int'
        });
        expect(res.status).toBe(422);
        expect(Array.isArray(res.body.errors)).toBe(true);
        expect(res.body.errors.length).toBeGreaterThan(0);
    });

    test('GET /api/sessions/current after login returns authenticated user', async () => {
        await agent.post('/api/sessions').send({ username: 'admin', password: 'correct' });
        const res = await agent.get('/api/sessions/current');
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ username: 'admin', type: 'operator' });
    });

    test('DELETE /api/sessions/current logs out', async () => {
        const res = await agent.delete('/api/sessions/current');
        expect([200, 204]).toContain(res.status);
    });


});