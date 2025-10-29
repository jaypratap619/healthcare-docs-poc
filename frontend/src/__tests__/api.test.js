import { uploadDocument } from '../api'

beforeEach(() => {
  global.fetch = jest.fn()
  global.localStorage.setItem('token', 't')
})

afterEach(() => {
  jest.resetAllMocks()
})

test('maps 409 to Already uploaded', async () => {
  fetch.mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: 'dup' }) })
  await expect(uploadDocument(new File([new Blob(['x'], { type: 'application/pdf' })], 'a.pdf', { type: 'application/pdf' })) ).rejects.toThrow('Already uploaded')
})


