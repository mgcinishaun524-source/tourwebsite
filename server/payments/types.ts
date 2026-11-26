export type PaymentProviderCode = 'pesepay' | 'payonify_relay';

export interface PaymentProviderCapabilities {
  providerCode: PaymentProviderCode;
  displayName: string;
  environment: 'sandbox' | 'production';
  configured: boolean;
  liveEnabled: boolean;
  supportsSingleBeneficiarySplit: boolean;
  supportsMultiBeneficiarySplit: boolean;
  splitRefundsVerified: boolean;
  notes: string[];
}

export interface InitiateSplitPaymentInput {
  merchantReference: string;
  amountMinor: number;
  currencyCode: string;
  reasonForPayment: string;
  beneficiaryMerchantEmail: string;
  resultUrl: string;
  returnUrl: string;
}

export interface InitiateSplitPaymentResult {
  providerReference: string;
  redirectUrl: string;
  pollUrl: string;
  rawSummary: Record<string, unknown>;
}

export interface VerifiedTransactionResult {
  providerReference: string;
  merchantReference?: string;
  transactionStatus: string;
  paid: boolean;
  amountMinor: number;
  currencyCode: string;
  paymentMethodUsed?: string;
  beneficiaryMerchantEmail?: string;
  rawPayload: Record<string, unknown>;
}

export interface RefundPaymentInput {
  providerReference: string;
  amountMinor: number;
  currencyCode: string;
  reason: string;
  refundType: 'full' | 'partial';
}

export interface RefundPaymentResult {
  supported: boolean;
  providerRefundReference?: string;
  status: 'SUCCEEDED' | 'PROCESSING' | 'FAILED';
  message: string;
}

export interface PaymentProviderAdapter {
  readonly code: PaymentProviderCode;
  getCapabilities(): PaymentProviderCapabilities;
  initiatePayment(input: InitiateSplitPaymentInput): Promise<InitiateSplitPaymentResult>;
  verifyTransaction(providerReference: string): Promise<VerifiedTransactionResult>;
  parseCallbackPayload(rawBody: unknown): Record<string, unknown>;
  refundTransaction(input: RefundPaymentInput): Promise<RefundPaymentResult>;
}
