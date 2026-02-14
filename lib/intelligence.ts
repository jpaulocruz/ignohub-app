import axios from 'axios'

/**
 * AI Intelligence client for communicating with the Agno service (Python).
 * Configured with internal Railway URL and security headers.
 */
const intelligence = axios.create({
    baseURL: process.env.AGNO_API_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
        'X-Agno-Key': process.env.AGNO_API_KEY
    },
    timeout: 30000 // 30s timeout for complex AI processing
})

// Add response interceptor for error handling
intelligence.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('AI Intelligence API Error:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        })
        return Promise.reject(error)
    }
)

export default intelligence
