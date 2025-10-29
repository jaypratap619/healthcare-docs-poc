import '@testing-library/jest-dom'
// Force-mock optional native canvas to avoid loading global/native builds
jest.mock('canvas', () => ({}), { virtual: true })


