import { getServerConfig } from '../lib/config.ts';
import type {
  InitiateSplitPaymentInput,
  InitiateSplitPaymentResult,
  PaymentProviderAdapter,
  PaymentProviderCapabilities,
  RefundPaymentInput,
  RefundPaymentResult,
  VerifiedTransactionResult,
} from './types.ts';

/**
 * Alternative Provider Adapter Scaffold: Payonify Relay.
 * Reference: https://docs.payonify.com/relay
 *
 * Kept strictly unconfigured until Payonify Relay merchant onboarding,
 * settlement rules, supported currencies, and payout webhook contracts
 * are evaluated and credentials supplied.
 */
export class PayonifyRelayAdapter implements PaymentProviderAdapter {
  public readonly code = 'payonify_relay' as const;

  public getCapabilities(): PaymentProviderCapabilities {
    const cfg = getServerConfig();
    return {
      providerCode: 'payonify_relay',
      displayName: 'Payonify Relay',
      environment: cfg.paymentLiveEnabled ? 'production' : 'sandbox',
      configured: Boolean(cfg.payonifyApiKey && cfg.payonifyRelayBaseUrl),
      liveEnabled: false,
      supportsSingleBeneficiarySplit: true,
      supportsMultiBeneficiarySplit: true,
      splitRefundsVerified: false,
      notes: [
        'Scaffolded for provider independence (https://docs.payonify.com/relay).',
        'Do not assume identical settlement, refund, or fee semantics to Pesepay.',
      ],
    };
  }

  public async initiatePayment(
    _input: InitiateSplitPaymentInput,
  ): Promise<InitiateSplitPaymentResult> {
    throw new Error(
      'Payonify Relay adapter is disabled until PAYONIFY_API_KEY, PAYONIFY_RELAY_BASE_URL, and verified schema contracts are supplied.',
    );
  }

  public async verifyTransaction(
    _providerReference: string,
  ): Promise<VerifiedTransactionResult> {
    throw new Error('Payonify Relay verification requires configured credentials.');
  }

  public parseCallbackPayload(_rawBody: unknown): Record<string, unknown> {
    throw new Error('Payonify Relay webhook verification requires configured credentials.');
  }

  public async refundTransaction(_input: RefundPaymentInput): Promise<RefundPaymentResult> {
    throw new Error('Payonify Relay refunds are not verified or enabled.');
  }
}

export const payonifyRelayAdapter = new PayonifyRelayAdapter();
