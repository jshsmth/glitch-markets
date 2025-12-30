/**
 * Withdrawal Service
 * Handles gasless USDC withdrawals from proxy wallets to external addresses
 */

import { relayerService } from './relayer-service.js';
import { getUSDCBalance } from '../utils/balance.js';
import { validateEthereumAddress } from '../validation/input-validator.js';
import { Logger } from '$lib/utils/logger';
import { parseUnits } from 'viem';

const log = Logger.forComponent('WithdrawalService');

const USDC_E_CONTRACT = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
const USDC_DECIMALS = 6;

export interface WithdrawalRequest {
	userId: string;
	fromAddress: string;
	toAddress: string;
	amount: string;
}

export interface WithdrawalResult {
	success: boolean;
	transactionHash?: string;
	error?: string;
	estimatedNetworkFee?: string;
}

export interface WithdrawalValidation {
	isValid: boolean;
	error?: string;
	availableBalance?: string;
	requestedAmount?: string;
}

/**
 * Withdrawal Service
 * Orchestrates gasless USDC withdrawals via the relayer
 */
export class WithdrawalService {
	/**
	 * Validate withdrawal request before execution
	 *
	 * @param request - Withdrawal request to validate
	 * @returns Validation result with details
	 */
	async validateWithdrawal(request: WithdrawalRequest): Promise<WithdrawalValidation> {
		const { userId, fromAddress, toAddress, amount } = request;

		try {
			validateEthereumAddress(fromAddress);
			validateEthereumAddress(toAddress);
		} catch (error) {
			return {
				isValid: false,
				error: error instanceof Error ? error.message : 'Invalid address format'
			};
		}

		if (!amount || parseFloat(amount) <= 0) {
			return {
				isValid: false,
				error: 'Amount must be greater than 0'
			};
		}

		try {
			const { balance, balanceRaw } = await getUSDCBalance(fromAddress);
			const amountRaw = parseUnits(amount, USDC_DECIMALS);

			if (amountRaw > balanceRaw) {
				return {
					isValid: false,
					error: 'Insufficient balance',
					availableBalance: balance,
					requestedAmount: amount
				};
			}

			const isDeployed = await relayerService.isWalletDeployed(userId, fromAddress);
			if (!isDeployed) {
				return {
					isValid: false,
					error: 'Wallet is not deployed. Only Safe or Proxy wallets can use gasless withdrawals.'
				};
			}

			return {
				isValid: true,
				availableBalance: balance,
				requestedAmount: amount
			};
		} catch (error) {
			log.error('Withdrawal validation failed', {
				fromAddress,
				toAddress,
				amount,
				error: error instanceof Error ? error.message : 'Unknown error'
			});

			return {
				isValid: false,
				error: 'Failed to validate withdrawal. Please try again.'
			};
		}
	}

	/**
	 * Execute gasless USDC withdrawal
	 *
	 * @param request - Withdrawal request
	 * @returns Withdrawal result with transaction hash
	 *
	 * @example
	 * ```typescript
	 * const result = await withdrawalService.executeWithdrawal({
	 *   userId: 'user-uuid',
	 *   fromAddress: '0xUserProxyWallet...',
	 *   toAddress: '0xDestination...',
	 *   amount: '10.50' // 10.50 USDC
	 * });
	 * ```
	 */
	async executeWithdrawal(request: WithdrawalRequest): Promise<WithdrawalResult> {
		const { userId, fromAddress, toAddress, amount } = request;

		log.info('Executing withdrawal', {
			userId,
			fromAddress,
			toAddress,
			amount
		});

		const validation = await this.validateWithdrawal(request);
		if (!validation.isValid) {
			log.warn('Withdrawal validation failed', {
				userId,
				fromAddress,
				toAddress,
				amount,
				error: validation.error
			});

			return {
				success: false,
				error: validation.error || 'Withdrawal validation failed'
			};
		}

		try {
			const amountRaw = parseUnits(amount, USDC_DECIMALS);

			const result = await relayerService.transferERC20(userId, {
				from: fromAddress,
				to: toAddress,
				amount: amountRaw.toString(),
				tokenAddress: USDC_E_CONTRACT
			});

			if (result.success) {
				log.info('Withdrawal executed successfully', {
					userId,
					fromAddress,
					toAddress,
					amount,
					transactionHash: result.transactionHash
				});

				return {
					success: true,
					transactionHash: result.transactionHash,
					estimatedNetworkFee: '0.00'
				};
			} else {
				log.error('Withdrawal execution failed', {
					userId,
					fromAddress,
					toAddress,
					amount,
					error: result.error
				});

				return {
					success: false,
					error: result.error || 'Withdrawal failed'
				};
			}
		} catch (error) {
			log.error('Unexpected error during withdrawal', {
				userId,
				fromAddress,
				toAddress,
				amount,
				error: error instanceof Error ? error.message : 'Unknown error'
			});

			return {
				success: false,
				error: 'An unexpected error occurred. Please try again.'
			};
		}
	}

	/**
	 * Get estimated network fee for withdrawal
	 * For gasless withdrawals, this is always $0.00
	 *
	 * @returns Estimated fee in USD
	 */
	getEstimatedNetworkFee(): string {
		return '0.00';
	}
}

/**
 * Singleton instance for use across the application
 */
export const withdrawalService = new WithdrawalService();
