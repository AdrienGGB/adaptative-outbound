// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54331'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
