import { render, screen, fireEvent } from '@testing-library/react'
import UploadForm from '../components/UploadForm'

function fileWith(type, sizeBytes) {
  const blob = new Blob(['x'.repeat(sizeBytes)], { type })
  return new File([blob], 'test.pdf', { type })
}

test('rejects non-PDF files', async () => {
  const onUpload = jest.fn()
  render(<UploadForm onUpload={onUpload} />)
  const inputEl = screen.getByTestId('file-input')
  const file = fileWith('text/plain', 10)
  fireEvent.change(inputEl, { target: { files: [file] } })
  expect(await screen.findByText(/Only PDF files are allowed/)).toBeInTheDocument()
  expect(onUpload).not.toHaveBeenCalled()
})

test('rejects files larger than 10MB', async () => {
  const onUpload = jest.fn()
  render(<UploadForm onUpload={onUpload} />)
  const inputEl = screen.getByTestId('file-input')
  const big = fileWith('application/pdf', 10 * 1024 * 1024 + 1)
  fireEvent.change(inputEl, { target: { files: [big] } })
  expect(await screen.findByText(/File too large/)).toBeInTheDocument()
})


