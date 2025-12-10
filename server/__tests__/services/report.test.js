const mockQuery = jest.fn();
const mockClientQuery = jest.fn();
const mockRelease = jest.fn();
const mockConnect = jest.fn();

const mockClient = {
  query: mockClientQuery,
  release: mockRelease,
};

mockConnect.mockResolvedValue(mockClient);

const MockPool = jest.fn().mockImplementation(() => ({
  query: mockQuery,
  connect: mockConnect,
}));

// Mock 'pg' and '../dao.mjs' before importing the module under test
jest.unstable_mockModule('pg', () => ({ Pool: MockPool }));
const getUserInfoByIdMock = jest.fn();
jest.unstable_mockModule('../../dao.mjs', () => ({ getUserInfoById: getUserInfoByIdMock }));

// Now import the module under test (dynamic import so mocks take effect)
let reportsService;
beforeAll(async () => {
  reportsService = await import('../../services/report.mjs');
});

beforeEach(() => {
  jest.clearAllMocks();
  // default: pool.query resolves to empty result to avoid accidental failures
  mockQuery.mockResolvedValue({ rows: [] });
  mockClientQuery.mockResolvedValue({ rows: [] });
  getUserInfoByIdMock.mockResolvedValue(null);
});

describe('report service unit tests', () => {
  test('insertReport - success inserts report and photos and returns combined object', async () => {
    // Arrange
    const citizen_id = 1;
    getUserInfoByIdMock.mockResolvedValue({ citizen_id, verified: true });

    const categoryId = 5;
    const statusId = 2;
    const reportRow = {
      report_id: 100,
      citizen_id,
      category_id: categoryId,
      office_id: 10,
      status_id: statusId,
      title: 'Pothole',
      description: 'Big pothole',
      latitude: 45.0,
      longitude: 9.0,
      anonymous: false,
      created_at: new Date(),
    };

    const imageUrls = ['http://img/1.jpg', 'http://img/2.jpg'];

    // Implementation of client.query mock to return appropriate responses based on SQL text
    mockClientQuery.mockImplementation(async (text, params) => {
      if (text.startsWith('BEGIN')) return { rows: [] };
      if (text.includes('FROM categories WHERE category_id')) {
        return { rows: [{ office_id: 10 }] };
      }
      if (text.includes('FROM statuses WHERE name')) {
        return { rows: [{ status_id: statusId }] };
      }
      if (text.includes('INSERT INTO reports')) {
        return { rows: [reportRow] };
      }
      if (text.includes('INSERT INTO photos')) {
        // simulate returning a photo row; params: [report_id, url]
        const url = params[1];
        return { rows: [{ photo_id: Math.floor(Math.random() * 1000), report_id: reportRow.report_id, image_url: url, uploaded_at: new Date() }] };
      }
      if (text.startsWith('COMMIT')) return { rows: [] };
      if (text.startsWith('ROLLBACK')) return { rows: [] };
      return { rows: [] };
    });

    // Act
    const result = await reportsService.insertReport({
      title: reportRow.title,
      citizen_id,
      description: reportRow.description,
      image_urls: imageUrls,
      latitude: reportRow.latitude,
      longitude: reportRow.longitude,
      category_id: categoryId,
      anonymous: false,
    });

    // Assert
    expect(result).toBeDefined();
    expect(result.report_id).toBe(reportRow.report_id);
    expect(result.images).toHaveLength(imageUrls.length);
    expect(mockClientQuery).toHaveBeenCalled(); // ensure queries executed
    // ensure COMMIT called (last calls include COMMIT)
    const calledSqls = mockClientQuery.mock.calls.map(call => call[0]);
    expect(calledSqls.some(sql => typeof sql === 'string' && sql.startsWith('COMMIT'))).toBe(true);
  });

  test('insertReport - throws when citizen not found or not verified', async () => {
    // citizen not found
    getUserInfoByIdMock.mockResolvedValue(null);
    await expect(reportsService.insertReport({
      title: 't',
      citizen_id: 999,
      description: 'd',
      image_urls: [],
      latitude: 0,
      longitude: 0,
      category_id: 1,
      anonymous: false,
    })).rejects.toThrow('Citizen not found');

    // citizen found but not verified
    getUserInfoByIdMock.mockResolvedValue({ citizen_id: 999, verified: false });
    await expect(reportsService.insertReport({
      title: 't',
      citizen_id: 999,
      description: 'd',
      image_urls: [],
      latitude: 0,
      longitude: 0,
      category_id: 1,
      anonymous: false,
    })).rejects.toThrow('Only verified citizens can submit reports');
  });

  test('updateReportStatus - returns null when report not found', async () => {
    // client.query for check returns empty rows
    mockClientQuery.mockResolvedValueOnce({ rows: [] });
    const res = await reportsService.updateReportStatus(123, 2, null);
    expect(res).toBeNull();
  });

  test('updateReportStatus - skip update when current status is 5 and still return mapped report', async () => {
    // When current status is 5, the update block must be skipped.
    // Sequence:
    // - checkStatusSql -> rows [{status_id:5}]
    // - selectSql -> rows [full row]
    mockClientQuery.mockImplementation(async (text, params) => {
      if (text.includes('SELECT status_id FROM reports')) {
        return { rows: [{ status_id: 5 }] };
      }
      if (text.includes('FROM reports r') && text.includes('WHERE r.report_id = $1')) {
        // simulate the select used to return the report
        return {
          rows: [{
            report_id: 200,
            title: 'Broken Light',
            description: 'Light not working',
            latitude: 0,
            longitude: 0,
            anonymous: false,
            rejection_reason: null,
            created_at: new Date(),
            updated_at: new Date(),
            citizen_id: 2,
            citizen_username: 'user2',
            citizen_first_name: 'First',
            citizen_last_name: 'Last',
            category_id: 3,
            category_name: 'Lighting',
            office_id: 4,
            office_name: 'Public Works',
            status_id: 5,
            status_name: 'Resolved',
            assigned_to_operator_id: null,
            operator_username: null,
            operator_email: null,
            assigned_to_external_id: null,
            external_operator_username: null,
            external_operator_email: null,
            external_company_name: null,
            photos: [],
          }],
        };
      }
      return { rows: [] };
    });

    const result = await reportsService.updateReportStatus(200, 3, null);
    expect(result).toBeDefined();
    expect(result.id).toBe(200);

    // Ensure that no UPDATE was executed: none of the mock calls contain the update SET status_id text
    const calledSqls = mockClientQuery.mock.calls.map(call => call[0]);
    const updateCalled = calledSqls.some(sql => typeof sql === 'string' && sql.includes('UPDATE reports') && sql.includes('SET status_id'));
    expect(updateCalled).toBe(false);
  });

  test('setOperatorByReport - returns null if no row', async () => {
    // pool.query is mockQuery
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await reportsService.setOperatorByReport(1, 2);
    expect(res).toBeNull();
    expect(mockQuery).toHaveBeenCalled();
  });

  test('setOperatorByReport - returns row when update succeeds', async () => {
    const row = { report_id: 10, assigned_to_operator_id: 2, title: 't', status_id: 1, updated_at: new Date() };
    mockQuery.mockResolvedValueOnce({ rows: [row] });
    const res = await reportsService.setOperatorByReport(10, 2);
    expect(res).toEqual(row);
  });

  test('setMainteinerByReport - returns null when none updated and row when updated', async () => {
    // null case
    mockQuery.mockResolvedValueOnce({ rows: [] });
    const r1 = await reportsService.setMainteinerByReport(5, 7);
    expect(r1).toBeNull();

    // success case
    const row = { report_id: 5, assigned_to_external_id: 7, title: 't', status_id: 1, updated_at: new Date() };
    mockQuery.mockResolvedValueOnce({ rows: [row] });
    const r2 = await reportsService.setMainteinerByReport(5, 7);
    expect(r2).toEqual(row);
  });

  test('getAllReports maps rows into expected shape', async () => {
    const sampleRow = {
      report_id: 1,
      title: 'A',
      description: 'B',
      latitude: 44,
      longitude: 11,
      anonymous: false,
      rejection_reason: null,
      created_at: new Date(),
      updated_at: new Date(),
      citizen_id: 2,
      citizen_username: 'u',
      citizen_first_name: 'f',
      citizen_last_name: 'l',
      category_id: 3,
      category_name: 'cat',
      office_id: 4,
      office_name: 'office',
      status_id: 2,
      status_name: 'Approved',
      assigned_to_external_id: null,
      external_username: null,
      external_company_name: null,
      photos: [{ photo_id: 10, image_url: 'u.jpg' }],
    };
    mockQuery.mockResolvedValueOnce({ rows: [sampleRow] });

    const list = await reportsService.getAllReports();
    expect(Array.isArray(list)).toBe(true);
    expect(list[0]).toMatchObject({
      id: sampleRow.report_id,
      title: sampleRow.title,
      photos: sampleRow.photos,
      citizen: {
        id: sampleRow.citizen_id,
        username: sampleRow.citizen_username,
      },
    });
  });

  test('getAllApprovedReports filters statuses and maps citizen to null when anonymous', async () => {
    const anonRow = {
      report_id: 2,
      title: 'X',
      description: 'Y',
      latitude: 0,
      longitude: 0,
      anonymous: true,
      created_at: new Date(),
      updated_at: new Date(),
      citizen_id: 99,
      citizen_username: 'an',
      citizen_first_name: 'A',
      citizen_last_name: 'N',
      category_id: 1,
      category_name: 'c',
      office_id: 1,
      office_name: 'o',
      status_id: 2,
      status_name: 'Approved',
      photos: [],
    };
    mockQuery.mockResolvedValueOnce({ rows: [anonRow] });

    const res = await reportsService.getAllApprovedReports();
    expect(res[0].citizen).toBeNull();
    expect(res[0].status.name).toBe('Approved');
  });

  test('getReportsAssigned maps assigned operator and external correctly', async () => {
    const assignedRow = {
      report_id: 3,
      title: 'T',
      description: 'D',
      latitude: 0,
      longitude: 0,
      anonymous: false,
      rejection_reason: null,
      created_at: new Date(),
      updated_at: new Date(),
      citizen_id: 7,
      citizen_username: 'u7',
      citizen_first_name: 'F7',
      citizen_last_name: 'L7',
      category_id: 11,
      category_name: 'c11',
      office_id: 12,
      office_name: 'o12',
      status_id: 2,
      status_name: 'In Progress',
      assigned_to_operator_id: 99,
      assigned_to_external_id: null,
      operator_username: 'op99',
      operator_email: 'op@example.com',
      company_name: 'Comp',
      photos: [],
    };
    mockQuery.mockResolvedValueOnce({ rows: [assignedRow] });

    const res = await reportsService.getReportsAssigned(99);
    expect(res[0].assigned_to_operator).toMatchObject({
      id: 99,
      username: 'op99',
      company: 'Comp',
    });
  });
});