let sendMailMock;
let createTransportMock;

jest.mock('nodemailer', () => {
  sendMailMock = jest.fn();
  createTransportMock = jest.fn(() => ({ sendMail: sendMailMock }));
  // export createTransport both as default.createTransport (ESM import) and top-level createTransport (CJS/interop)
  return {
    __esModule: true,
    default: {
      createTransport: createTransportMock,
    },
    createTransport: createTransportMock,
    __sendMailMock: sendMailMock,
    __createTransportMock: createTransportMock,
  };
});

const nodemailer = require('nodemailer');

describe('sendEmail (server/services/utils.mjs) - CommonJS test file', () => {
  let sendEmail;
  beforeAll(async () => {
    // Set environment variables before importing
    process.env.ETHEREAL_HOST = 'smtp.ethereal.email';
    process.env.ETHEREAL_PORT = '587';
    process.env.ETHEREAL_USER = 'alan.okeefe54@ethereal.email';
    process.env.ETHEREAL_PASS = 'dnyNWufZpf4PZ9EvtB';
    
    const utils = await import('../../services/utils.mjs');
    sendEmail = utils.sendEmail;
  });

  afterEach(() => {
    nodemailer.__sendMailMock.mockReset();
    nodemailer.__createTransportMock.mockClear();
  });

  test('creates transporter with expected SMTP config', () => {
    expect(nodemailer.__createTransportMock).toHaveBeenCalledTimes(1);
    expect(nodemailer.__createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: expect.objectContaining({
          user: 'alan.okeefe54@ethereal.email',
          pass: 'dnyNWufZpf4PZ9EvtB',
        }),
      })
    );
  });

  test('calls transporter.sendMail with correct fields and returns info', async () => {
    const fakeInfo = { messageId: 'fake-id' };
    nodemailer.__sendMailMock.mockResolvedValue(fakeInfo);

    const to = 'recipient@example.com';
    const subject = 'Test Subject';
    const text = 'Hello world';

    const result = await sendEmail(to, subject, text);

    expect(nodemailer.__sendMailMock).toHaveBeenCalledTimes(1);
    expect(nodemailer.__sendMailMock).toHaveBeenCalledWith({
      from: `"Participium" <alan.okeefe54@ethereal.email>`,
      to,
      subject,
      text,
    });
    expect(result).toBe(fakeInfo);
  });

  test('propagates errors from transporter.sendMail', async () => {
    const err = new Error('SMTP failure');
    nodemailer.__sendMailMock.mockRejectedValue(err);

    await expect(sendEmail('a@b.com', 's', 't')).rejects.toThrow('SMTP failure');
    expect(nodemailer.__sendMailMock).toHaveBeenCalledTimes(1);
  });

  test('supports multiple consecutive sendEmail calls', async () => {
    nodemailer.__sendMailMock
      .mockResolvedValueOnce({ messageId: 'm1' })
      .mockResolvedValueOnce({ messageId: 'm2' });

    const p1 = sendEmail('one@example.com', 'sub1', 'text1');
    const p2 = sendEmail('two@example.com', 'sub2', 'text2');

    const [r1, r2] = await Promise.all([p1, p2]);

    expect(r1).toEqual({ messageId: 'm1' });
    expect(r2).toEqual({ messageId: 'm2' });
    expect(nodemailer.__sendMailMock).toHaveBeenCalledTimes(2);
    expect(nodemailer.__sendMailMock.mock.calls[0][0]).toEqual(
      expect.objectContaining({ to: 'one@example.com', subject: 'sub1', text: 'text1' })
    );
    expect(nodemailer.__sendMailMock.mock.calls[1][0]).toEqual(
      expect.objectContaining({ to: 'two@example.com', subject: 'sub2', text: 'text2' })
    );
  });
});