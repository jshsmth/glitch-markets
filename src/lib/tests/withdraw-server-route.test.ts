/**
 * Tests for /api/withdraw server route
 * Tests gasless USDC withdrawal endpoint
 */

import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { POST } from '../../routes/api/withdraw/+server.js';
import type { RequestEvent } from '@sveltejs/kit';

vi.mock('$lib/server/services/withdrawal-service.js');
vi.mock('$lib/utils/logger', () => {
	const mockLogger = {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn()
	};
	return {
		Logger: class {
			static forComponent = vi.fn().mockReturnValue(mockLogger);
			constructor() {
				return mockLogger;
			}
		}
	};
});
vi.mock('$env/static/public', () => ({
	PUBLIC_SUPABASE_URL: 'https://test.supabase.co'
}));
vi.mock('$env/static/private', () => ({
	SERVER_WALLET_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
	SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key'
}));

const TEST_USER_ID = 'user-123';
const TEST_FROM_ADDRESS = '0x1234567890123456789012345678901234567890';
const TEST_TO_ADDRESS = '0x0987654321098765432109876543210987654321';
const TEST_AMOUNT = '10.50';
const TEST_TX_HASH = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

describe('POST /api/withdraw', () => {
	let mockWithdrawalService: {
		executeWithdrawal: Mock;
	};
	let mockRequest: Partial<Request>;
	let mockLocals: {
		supabase: {
			auth: {
				getUser: Mock;
			};
		};
	};

	beforeEach(async () => {
		vi.resetAllMocks();

		const withdrawalModule = await import('$lib/server/services/withdrawal-service.js');
		mockWithdrawalService = {
			executeWithdrawal: vi.fn()
		};
		vi.mocked(withdrawalModule.withdrawalService).executeWithdrawal =
			mockWithdrawalService.executeWithdrawal;

		mockLocals = {
			supabase: {
				auth: {
					getUser: vi.fn().mockResolvedValue({
						data: { user: { id: TEST_USER_ID } },
						error: null
					})
				}
			}
		};

		mockRequest = {
			json: vi.fn().mockResolvedValue({
				fromAddress: TEST_FROM_ADDRESS,
				toAddress: TEST_TO_ADDRESS,
				amount: TEST_AMOUNT
			})
		};
	});

	describe('Authentication', () => {
		it('should reject unauthenticated requests', async () => {
			mockLocals.supabase.auth.getUser.mockResolvedValue({
				data: { user: null },
				error: { message: 'Not authenticated' }
			});

			const event = {
				request: mockRequest,
				locals: mockLocals
			} as unknown as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.error).toBe('VALIDATION_ERROR');
			expect(data.message).toBe('Unauthorized');
		});

		it('should reject requests with missing user', async () => {
			mockLocals.supabase.auth.getUser.mockResolvedValue({
				data: { user: null },
				error: null
			});

			const event = {
				request: mockRequest,
				locals: mockLocals
			} as unknown as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(401);
			expect(data.error).toBe('VALIDATION_ERROR');
			expect(data.message).toBe('Unauthorized');
		});

		it('should accept authenticated requests', async () => {
			mockWithdrawalService.executeWithdrawal.mockResolvedValue({
				success: true,
				transactionHash: TEST_TX_HASH,
				estimatedNetworkFee: '0.00'
			});

			const event = {
				request: mockRequest,
				locals: mockLocals
			} as unknown as RequestEvent;

			const response = await POST(event);

			expect(response.status).toBe(200);
			expect(mockLocals.supabase.auth.getUser).toHaveBeenCalled();
		});
	});

	describe('Request Validation', () => {
		it('should reject invalid JSON', async () => {
			mockRequest.json = vi.fn().mockRejectedValue(new Error('Invalid JSON'));

			const event = {
				request: mockRequest,
				locals: mockLocals
			} as unknown as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.message).toBe('Invalid JSON in request body');
		});

		it('should reject non-object request body', async () => {
			mockRequest.json = vi.fn().mockResolvedValue('not an object');

			const event = {
				request: mockRequest,
				locals: mockLocals
			} as unknown as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.message).toBe('Request body must be a JSON object');
		});

		it('should reject missing fromAddress', async () => {
			mockRequest.json = vi.fn().mockResolvedValue({
				toAddress: TEST_TO_ADDRESS,
				amount: TEST_AMOUNT
			});

			const event = {
				request: mockRequest,
				locals: mockLocals
			} as unknown as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.message).toBe('fromAddress field is required and must be a string');
		});

		it('should reject non-string fromAddress', async () => {
			mockRequest.json = vi.fn().mockResolvedValue({
				fromAddress: 123,
				toAddress: TEST_TO_ADDRESS,
				amount: TEST_AMOUNT
			});

			const event = {
				request: mockRequest,
				locals: mockLocals
			} as unknown as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.message).toBe('fromAddress field is required and must be a string');
		});

		it('should reject missing toAddress', async () => {
			mockRequest.json = vi.fn().mockResolvedValue({
				fromAddress: TEST_FROM_ADDRESS,
				amount: TEST_AMOUNT
			});

			const event = {
				request: mockRequest,
				locals: mockLocals
			} as unknown as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.message).toBe('toAddress field is required and must be a string');
		});

		it('should reject non-string toAddress', async () => {
			mockRequest.json = vi.fn().mockResolvedValue({
				fromAddress: TEST_FROM_ADDRESS,
				toAddress: null,
				amount: TEST_AMOUNT
			});

			const event = {
				request: mockRequest,
				locals: mockLocals
			} as unknown as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.message).toBe('toAddress field is required and must be a string');
		});

		it('should reject missing amount', async () => {
			mockRequest.json = vi.fn().mockResolvedValue({
				fromAddress: TEST_FROM_ADDRESS,
				toAddress: TEST_TO_ADDRESS
			});

			const event = {
				request: mockRequest,
				locals: mockLocals
			} as unknown as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.message).toBe('amount field is required and must be a string');
		});

		it('should reject non-string amount', async () => {
			mockRequest.json = vi.fn().mockResolvedValue({
				fromAddress: TEST_FROM_ADDRESS,
				toAddress: TEST_TO_ADDRESS,
				amount: 10.5
			});

			const event = {
				request: mockRequest,
				locals: mockLocals
			} as unknown as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.message).toBe('amount field is required and must be a string');
		});
	});

	describe('Success Cases', () => {
		it('should return 200 with transaction hash on success', async () => {
			mockWithdrawalService.executeWithdrawal.mockResolvedValue({
				success: true,
				transactionHash: TEST_TX_HASH,
				estimatedNetworkFee: '0.00'
			});

			const event = {
				request: mockRequest,
				locals: mockLocals
			} as unknown as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.transactionHash).toBe(TEST_TX_HASH);
			expect(data.estimatedNetworkFee).toBe('0.00');
		});

		it('should call withdrawal service with correct parameters', async () => {
			mockWithdrawalService.executeWithdrawal.mockResolvedValue({
				success: true,
				transactionHash: TEST_TX_HASH,
				estimatedNetworkFee: '0.00'
			});

			const event = {
				request: mockRequest,
				locals: mockLocals
			} as unknown as RequestEvent;

			await POST(event);

			expect(mockWithdrawalService.executeWithdrawal).toHaveBeenCalledWith({
				userId: TEST_USER_ID,
				fromAddress: TEST_FROM_ADDRESS,
				toAddress: TEST_TO_ADDRESS,
				amount: TEST_AMOUNT
			});
		});

		it('should set Cache-Control header to no-store', async () => {
			mockWithdrawalService.executeWithdrawal.mockResolvedValue({
				success: true,
				transactionHash: TEST_TX_HASH,
				estimatedNetworkFee: '0.00'
			});

			const event = {
				request: mockRequest,
				locals: mockLocals
			} as unknown as RequestEvent;

			const response = await POST(event);

			expect(response.headers.get('Cache-Control')).toBe('no-store');
		});
	});

	describe('Error Handling', () => {
		it('should return 400 for withdrawal validation failures', async () => {
			mockWithdrawalService.executeWithdrawal.mockResolvedValue({
				success: false,
				error: 'Insufficient balance'
			});

			const event = {
				request: mockRequest,
				locals: mockLocals
			} as unknown as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.success).toBe(false);
			expect(data.error).toBe('Insufficient balance');
		});

		it('should return 400 for withdrawal execution failures', async () => {
			mockWithdrawalService.executeWithdrawal.mockResolvedValue({
				success: false,
				error: 'Wallet is not deployed'
			});

			const event = {
				request: mockRequest,
				locals: mockLocals
			} as unknown as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.success).toBe(false);
			expect(data.error).toBe('Wallet is not deployed');
		});

		it('should set Cache-Control header on error responses', async () => {
			mockWithdrawalService.executeWithdrawal.mockResolvedValue({
				success: false,
				error: 'Test error'
			});

			const event = {
				request: mockRequest,
				locals: mockLocals
			} as unknown as RequestEvent;

			const response = await POST(event);

			expect(response.headers.get('Cache-Control')).toBe('no-store');
		});

		it('should handle unexpected errors with 500 status', async () => {
			mockWithdrawalService.executeWithdrawal.mockRejectedValue(
				new Error('Database connection failed')
			);

			const event = {
				request: mockRequest,
				locals: mockLocals
			} as unknown as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe('INTERNAL_ERROR');
			expect(data.message).toBe('Database connection failed');
		});

		it('should handle non-Error exceptions', async () => {
			mockWithdrawalService.executeWithdrawal.mockRejectedValue('unknown error');

			const event = {
				request: mockRequest,
				locals: mockLocals
			} as unknown as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.error).toBe('INTERNAL_ERROR');
			expect(data.message).toBe('Unknown error occurred');
		});
	});

	describe('Edge Cases', () => {
		it('should handle very large amounts', async () => {
			const largeAmount = '999999999.999999';
			mockRequest.json = vi.fn().mockResolvedValue({
				fromAddress: TEST_FROM_ADDRESS,
				toAddress: TEST_TO_ADDRESS,
				amount: largeAmount
			});

			mockWithdrawalService.executeWithdrawal.mockResolvedValue({
				success: true,
				transactionHash: TEST_TX_HASH,
				estimatedNetworkFee: '0.00'
			});

			const event = {
				request: mockRequest,
				locals: mockLocals
			} as unknown as RequestEvent;

			const response = await POST(event);

			expect(response.status).toBe(200);
			expect(mockWithdrawalService.executeWithdrawal).toHaveBeenCalledWith(
				expect.objectContaining({
					amount: largeAmount
				})
			);
		});

		it('should handle very small amounts', async () => {
			const smallAmount = '0.000001';
			mockRequest.json = vi.fn().mockResolvedValue({
				fromAddress: TEST_FROM_ADDRESS,
				toAddress: TEST_TO_ADDRESS,
				amount: smallAmount
			});

			mockWithdrawalService.executeWithdrawal.mockResolvedValue({
				success: true,
				transactionHash: TEST_TX_HASH,
				estimatedNetworkFee: '0.00'
			});

			const event = {
				request: mockRequest,
				locals: mockLocals
			} as unknown as RequestEvent;

			const response = await POST(event);

			expect(response.status).toBe(200);
			expect(mockWithdrawalService.executeWithdrawal).toHaveBeenCalledWith(
				expect.objectContaining({
					amount: smallAmount
				})
			);
		});

		it('should handle checksum addresses', async () => {
			const checksumFrom = '0xAbCdEf1234567890AbCdEf1234567890AbCdEf12';
			const checksumTo = '0x0987654321098765432109876543210987654321';

			mockRequest.json = vi.fn().mockResolvedValue({
				fromAddress: checksumFrom,
				toAddress: checksumTo,
				amount: TEST_AMOUNT
			});

			mockWithdrawalService.executeWithdrawal.mockResolvedValue({
				success: true,
				transactionHash: TEST_TX_HASH,
				estimatedNetworkFee: '0.00'
			});

			const event = {
				request: mockRequest,
				locals: mockLocals
			} as unknown as RequestEvent;

			const response = await POST(event);

			expect(response.status).toBe(200);
			expect(mockWithdrawalService.executeWithdrawal).toHaveBeenCalledWith({
				userId: TEST_USER_ID,
				fromAddress: checksumFrom,
				toAddress: checksumTo,
				amount: TEST_AMOUNT
			});
		});

		it('should handle withdrawal with no transactionHash', async () => {
			mockWithdrawalService.executeWithdrawal.mockResolvedValue({
				success: true,
				estimatedNetworkFee: '0.00'
			});

			const event = {
				request: mockRequest,
				locals: mockLocals
			} as unknown as RequestEvent;

			const response = await POST(event);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.transactionHash).toBeUndefined();
		});
	});
});
