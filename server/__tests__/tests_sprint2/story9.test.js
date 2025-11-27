const { Pool } = require('pg');
const request = require('supertest');

describe('Story 9 - update user, get info', () => {
    describe('DAO - update user, get all info', () => {
        let dao;
        let querySpy;
        let queryMock;


        beforeAll(async () => {
            queryMock = jest.fn();
            querySpy = jest.spyOn(Pool.prototype, 'query').mockImplementation((...args) => queryMock(...args));
            dao = await import('../../dao.mjs');
        });
        afterAll(() => {
            querySpy && querySpy.mockRestore();
        });

        beforeEach(() => {
            queryMock.mockReset();
        });
        afterEach(() => {
            queryMock.mockReset();
        });


        test('updateUserById: updates and returns the updated user', async () => {
            const userId = 777;
            const updates = { first_name: 'Mario', last_name: 'Rossi', email: 'mario@example.com' };
            queryMock.mockResolvedValueOnce({ rows: [{ citizen_id: userId, ...updates }] });

            const res = await dao.updateUserById(userId, updates);

            expect(res).toEqual({ citizen_id: userId, ...updates });

            expect(queryMock).toHaveBeenCalled();
            const [sqlCalled, paramsCalled] = queryMock.mock.calls[0];
            expect(sqlCalled).toMatch(/UPDATE\s+citizens/i);
            expect(paramsCalled[paramsCalled.length - 1]).toBe(userId);
            const keys = Object.keys(updates);
            keys.forEach((k, i) => {
                expect(paramsCalled[i]).toBe(updates[k]);
            });
        });

        test('updateUserById: returns null when no updates provided', async () => {
            queryMock.mockReset();
            const res = await dao.updateUserById(1, {});
            expect(res).toBeNull();
            expect(queryMock).not.toHaveBeenCalled();
        });

        test('updateUserById: propagates DB errors', async () => {
            const testErr = new Error('db update failed');
            queryMock.mockRejectedValueOnce(testErr);

            await expect(dao.updateUserById(5, { first_name: 'Err' })).rejects.toBe(testErr);
        });
        test('getUserInfoById: returns user when found', async () => {
            const userRow = {
                email: 'citizen@test.com',
                username: 'citizen',
                first_name: 'John',
                last_name: 'Doe',
                profile_photo_url: 'photo.png',
                telegram_username: 'tg_user',
                email_notifications: true
            };
            queryMock.mockResolvedValueOnce({ rows: [userRow] });

            const res = await dao.getUserInfoById(555);
            expect(res).toEqual(userRow);

            expect(queryMock).toHaveBeenCalled();
            const [sqlCalled, paramsCalled] = queryMock.mock.calls[0];
            expect(sqlCalled).toMatch(/SELECT\s+email,\s+username/i);
            expect(paramsCalled).toEqual([555]);
        });

        test('getUserInfoById: returns null when no user found', async () => {
            queryMock.mockResolvedValueOnce({ rows: [] });

            const res = await dao.getUserInfoById(999999);
            expect(res).toBeNull();
        });

        test('getUserInfoById: propagates DB error', async () => {
            const testErr = new Error('db failed');
            queryMock.mockRejectedValueOnce(testErr);

            await expect(dao.getUserInfoById(1)).rejects.toBe(testErr);
        });

    });
});