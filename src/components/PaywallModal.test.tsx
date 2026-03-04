import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PaywallModal from './PaywallModal'
import { useStore } from '../store'

// Mock the store
vi.mock('../store', () => ({
    useStore: vi.fn()
}))

// Mock fetch globally
global.fetch = vi.fn()

describe('PaywallModal', () => {
    const mockOnClose = vi.fn()
    const defaultProps = {
        isOpen: true,
        onClose: mockOnClose,
        featureName: 'Test Feature'
    }

    beforeEach(() => {
        vi.clearAllMocks()
        // Default store mock state
        ;(useStore as unknown as any).mockImplementation((selector: any) =>
            selector({
                authToken: 'test-token',
                userEmail: 'test@example.com'
            })
        )
    })

    it('returns null when isOpen is false', () => {
        const { container } = render(<PaywallModal {...defaultProps} isOpen={false} />)
        expect(container).toBeEmptyDOMElement()
    })

    it('renders correctly with the provided featureName when isOpen is true', () => {
        render(<PaywallModal {...defaultProps} />)
        expect(screen.getByText('Unlock Broono Pro')).toBeInTheDocument()
        expect(screen.getByText(/Test Feature/)).toBeInTheDocument()
        expect(screen.getByText(/is a Premium feature/)).toBeInTheDocument()
    })

    it('calls onClose when close button is clicked', () => {
        render(<PaywallModal {...defaultProps} />)
        const closeBtn = screen.getByText('×')
        fireEvent.click(closeBtn)
        expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('triggers fetch request and handles redirect on "Upgrade Now" click', async () => {
        // Mock window.location.href assignment
        const originalLocation = window.location
        delete (window as any).location
        window.location = { ...originalLocation, href: '' } as any

        const mockResponse = { url: 'https://checkout.stripe.com/test' }
        ;(global.fetch as any).mockResolvedValueOnce({
            json: async () => mockResponse
        })

        render(<PaywallModal {...defaultProps} />)
        const upgradeBtn = screen.getByText(/Upgrade Now/i)

        fireEvent.click(upgradeBtn)

        // Assert fetch was called correctly
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:8787/api/stripe/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token'
            },
            body: JSON.stringify({ email: 'test@example.com' })
        })

        // Assert button goes into loading state temporarily
        expect(screen.getByText(/Routing to Stripe/i)).toBeInTheDocument()

        await waitFor(() => {
            expect(window.location.href).toBe(mockResponse.url)
        })

        // Restore window.location
        window.location = originalLocation
    })

    it('handles errors gracefully and stops loading', async () => {
        // Mock console.error to avoid test output noise
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        // Mock alert
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

        ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

        render(<PaywallModal {...defaultProps} />)
        const upgradeBtn = screen.getByText(/Upgrade Now/i)

        fireEvent.click(upgradeBtn)

        await waitFor(() => {
            expect(alertSpy).toHaveBeenCalledWith('Checkout is currently unavailable.')
        })

        // Should return to normal state
        expect(screen.getByText(/Upgrade Now/i)).toBeInTheDocument()

        consoleSpy.mockRestore()
        alertSpy.mockRestore()
    })

    it('does not make a request if there is no authToken', async () => {
        ;(useStore as unknown as any).mockImplementation((selector: any) =>
            selector({
                authToken: null,
                userEmail: 'test@example.com'
            })
        )

        render(<PaywallModal {...defaultProps} />)
        const upgradeBtn = screen.getByText(/Upgrade Now/i)

        fireEvent.click(upgradeBtn)

        expect(global.fetch).not.toHaveBeenCalled()
    })
})
