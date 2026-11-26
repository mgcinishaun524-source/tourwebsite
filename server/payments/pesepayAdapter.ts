import crypto from 'node:crypto';
import { getServerConfig, isPesepayConfigured } from '../lib/config.ts';
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
 * Pesepay Marketplace Split Payments Adapter.
 * Verified technical references:
 *   - https://developers.pesepay.com/payments/split-payments/
 *   - https://developers.pesepay.com/getting-started/onboarding/
 *
 * Security & correctness invariants:
 *   - Payloads are AES-256-CBC encrypted using the 32-character encryption key,
 *     with the IV derived strictly from the first 16 characters of that key.
 *   - Only ONE beneficiaryMerchantEmail is supported per Pesepay transaction.
 *   - Multi-supplier checkouts must issue separately tracked transactions per supplier.
 */
export class PesepayAdapter implements PaymentProviderAdapter {
  public readonly code = 'pesepay' as const;

  public getBaseUrl(): string {
    const cfg = getServerConfig();
    if (cfg.pesepayEnv === 'production') {
      if (!cfg.paymentLiveEnabled) {
        throw new Error(
          'Production Pesepay calls are blocked while PAYMENT_LIVE_ENABLED is false.',
        );
      }
      return 'https://api.pesepay.com/api/payments-engine/v1';
    }
    return 'https://api.test.sandbox.pesepay.com/payments-engine/v1';
  }

  public getCapabilities(): PaymentProviderCapabilities {
    const cfg = getServerConfig();
    return {
      providerCode: 'pesepay',
      displayName: 'Pesepay Marketplace Split Payments',
      environment: cfg.pesepayEnv,
      configured: isPesepayConfigured(),
      liveEnabled: cfg.paymentLiveEnabled && cfg.pesepayEnv === 'production',
      supportsSingleBeneficiarySplit: true,
      supportsMultiBeneficiarySplit: false,
      splitRefundsVerified: cfg.pesepaySplitRefundsVerified,
      notes: [
        'One beneficiary merchant per Pesepay transaction (paymentMetadata.beneficiaryMerchantEmail).',
        'Multi-supplier customer checkouts split cleanly into per-supplier payment transactions.',
        cfg.pesepaySplitRefundsVerified
          ? 'Split refund reversal capability confirmed.'
          : 'Live split refunds remain disabled until Pesepay confirms split reversal rules.',
      ],
    };
  }

  public encryptPayload(plaintextObject: Record<string, unknown>, keyOverride?: string): string {
    const key = (keyOverride ?? getServerConfig().pesepayEncryptionKey).trim();
    if (Buffer.byteLength(key, 'utf8') !== 32) {
      throw new Error('PESEPAY_ENCRYPTION_KEY must be exactly 32 bytes for AES-256-CBC.');
    }
    const iv = Buffer.from(key.slice(0, 16), 'utf8');
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'utf8'), iv);
    const json = JSON.stringify(plaintextObject);
    const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
    return encrypted.toString('base64');
  }

  public decryptPayload(base64Payload: string, keyOverride?: string): Record<string, unknown> {
    const key = (keyOverride ?? getServerConfig().pesepayEncryptionKey).trim();
    if (Buffer.byteLength(key, 'utf8') !== 32) {
      throw new Error('PESEPAY_ENCRYPTION_KEY must be exactly 32 bytes for AES-256-CBC.');
    }
    const iv = Buffer.from(key.slice(0, 16), 'utf8');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'utf8'), iv);
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(base64Payload, 'base64')),
      decipher.final(),
    ]).toString('utf8');
    const parsed = JSON.parse(decrypted) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Decrypted Pesepay payload must be a JSON object');
    }
    return parsed as Record<string, unknown>;
  }

  public async initiatePayment(
    input: InitiateSplitPaymentInput,
  ): Promise<InitiateSplitPaymentResult> {
    const cfg = getServerConfig();
    if (!isPesepayConfigured()) {
      throw new Error(
        'Pesepay sandbox/live credentials (PESEPAY_INTEGRATION_KEY and 32-char PESEPAY_ENCRYPTION_KEY) are not configured.',
      );
    }
    if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor <= 0) {
      throw new Error('Payment amountMinor must be a positive integer minor unit.');
    }
    if (!input.beneficiaryMerchantEmail || !input.beneficiaryMerchantEmail.includes('@')) {
      throw new Error(
        'Verified supplier beneficiaryMerchantEmail is required for Pesepay split payments.',
      );
    }

    const baseUrl = this.getBaseUrl();
    const plaintextRequest = {
      amountDetails: {
        amount: Number((input.amountMinor / 100).toFixed(2)),
        currencyCode: input.currencyCode,
      },
      reasonForPayment: input.reasonForPayment.slice(0, 120),
      resultUrl: input.resultUrl,
      returnUrl: input.returnUrl,
      merchantReference: input.merchantReference,
      paymentMetadata: {
        beneficiaryMerchantEmail: input.beneficiaryMerchantEmail,
      },
    };

    const encrypted = this.encryptPayload(plaintextRequest);
    const response = await fetch(`${baseUrl}/payments/initiate`, {
      method: 'POST',
      headers: {
        authorization: cfg.pesepayIntegrationKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ payload: encrypted }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Pesepay initiation failed (${response.status}): ${errorText.slice(0, 200)}`);
    }

    const body = (await response.json()) as { payload?: string };
    if (!body?.payload || typeof body.payload !== 'string') {
      throw new Error('Pesepay initiate response missing encrypted payload field.');
    }

    const decoded = this.decryptPayload(body.payload);
    const referenceNumber = String(decoded.referenceNumber || '');
    const redirectUrl = String(decoded.redirectUrl || '');
    const pollUrl = String(decoded.pollUrl || '');

    if (!referenceNumber || !redirectUrl) {
      throw new Error('Pesepay initiate response missing referenceNumber or redirectUrl.');
    }

    return {
      providerReference: referenceNumber,
      redirectUrl,
      pollUrl,
      rawSummary: {
        referenceNumber,
        pollUrl,
      },
    };
  }

  public async verifyTransaction(providerReference: string): Promise<VerifiedTransactionResult> {
    const cfg = getServerConfig();
    if (!isPesepayConfigured()) {
      throw new Error('Pesepay credentials are not configured on the server.');
    }

    const baseUrl = this.getBaseUrl();
    const url = new URL(`${baseUrl}/payments/check-payment`);
    url.searchParams.set('referenceNumber', providerReference);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        authorization: cfg.pesepayIntegrationKey,
        'content-type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Pesepay transaction verification failed with status ${response.status}.`);
    }

    const body = (await response.json()) as { payload?: string };
    if (!body?.payload || typeof body.payload !== 'string') {
      throw new Error('Pesepay check-payment response missing encrypted payload.');
    }

    const decoded = this.decryptPayload(body.payload);
    const transactionStatus = String(decoded.transactionStatus || 'UNKNOWN').toUpperCase();
    const amountObj = decoded.amountDetails as { amount?: number | string; currencyCode?: string } | undefined;
    const rawAmount = amountObj?.amount ?? decoded.amount ?? 0;
    const amountMinor = Math.round(Number(rawAmount) * 100);
    const currencyCode = String(amountObj?.currencyCode || decoded.currencyCode || '');
    const metadata = decoded.paymentMetadata as { beneficiaryMerchantEmail?: string } | undefined;

    return {
      providerReference: String(decoded.referenceNumber || providerReference),
      merchantReference: decoded.merchantReference ? String(decoded.merchantReference) : undefined,
      transactionStatus,
      paid: transactionStatus === 'SUCCESS',
      amountMinor: Number.isSafeInteger(amountMinor) ? amountMinor : 0,
      currencyCode,
      paymentMethodUsed: decoded.paymentMethodDetails
        ? String((decoded.paymentMethodDetails as { paymentMethodName?: string }).paymentMethodName || '')
        : undefined,
      beneficiaryMerchantEmail: metadata?.beneficiaryMerchantEmail,
      rawPayload: decoded,
    };
  }

  public parseCallbackPayload(rawBody: unknown): Record<string, unknown> {
    if (!rawBody || typeof rawBody !== 'object') {
      throw new Error('Invalid Pesepay callback request body.');
    }
    const candidate = rawBody as { payload?: unknown };
    if (typeof candidate.payload !== 'string' || !candidate.payload) {
      throw new Error('Pesepay callback must carry an AES-256-CBC encrypted payload string.');
    }
    return this.decryptPayload(candidate.payload);
  }

  public async refundTransaction(_input: RefundPaymentInput): Promise<RefundPaymentResult> {
    const cfg = getServerConfig();
    if (!cfg.pesepaySplitRefundsVerified) {
      throw new Error(
        'Live Pesepay split refunds are disabled until Pesepay confirms master/beneficiary reversal rules, partial refund support, and fee recovery handling.',
      );
    }

    throw new Error(
      'Direct Pesepay split-refund endpoint integration requires confirmed merchant refund API specifications from Pesepay.',
    );
  }
}

export const pesepayAdapter = new PesepayAdapter();
