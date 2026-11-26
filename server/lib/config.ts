export type PaymentEnvironment = 'sandbox' | 'production';

export interface ServerConfig {
  port: number;
  appUrl: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  pesepayEnv: PaymentEnvironment;
  pesepayIntegrationKey: string;
  pesepayEncryptionKey: string;
  pesepayResultUrl: string;
  pesepayReturnUrl: string;
  pesepaySplitRefundsVerified: boolean;
  paymentLiveEnabled: boolean;
  payonifyApiKey: string;
  payonifyRelayBaseUrl: string;
  companyLegalName: string;
  publicBrandName: string;
  companyRegistrationNumber: string;
  companyTaxNumber: string;
  companySupportEmail: string;
  companySupportPhone: string;
  companyRegisteredAddress: string;
}

export function getServerConfig(): ServerConfig {
  const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const pesepayEnv: PaymentEnvironment =
    process.env.PESEPAY_ENV === 'production' ? 'production' : 'sandbox';

  return {
    port: Number(process.env.PORT || 3000),
    appUrl,
    supabaseUrl: (process.env.SUPABASE_URL || '').trim(),
    supabaseServiceRoleKey: (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim(),
    pesepayEnv,
    pesepayIntegrationKey: (process.env.PESEPAY_INTEGRATION_KEY || '').trim(),
    pesepayEncryptionKey: (process.env.PESEPAY_ENCRYPTION_KEY || '').trim(),
    pesepayResultUrl:
      (process.env.PESEPAY_RESULT_URL || '').trim() || `${appUrl}/api/payments/pesepay/result`,
    pesepayReturnUrl:
      (process.env.PESEPAY_RETURN_URL || '').trim() || `${appUrl}/checkout/return`,
    pesepaySplitRefundsVerified: process.env.PESEPAY_SPLIT_REFUNDS_VERIFIED === 'true',
    paymentLiveEnabled: process.env.PAYMENT_LIVE_ENABLED === 'true',
    payonifyApiKey: (process.env.PAYONIFY_API_KEY || '').trim(),
    payonifyRelayBaseUrl: (process.env.PAYONIFY_RELAY_BASE_URL || '').trim(),
    companyLegalName: 'TRANSEND TOURS (PRIVATE) LIMITED',
    publicBrandName: 'Transend Tours',
    companyRegistrationNumber: (process.env.COMPANY_REGISTRATION_NUMBER || '').trim(),
    companyTaxNumber: (process.env.COMPANY_TAX_NUMBER || '').trim(),
    companySupportEmail: (process.env.COMPANY_SUPPORT_EMAIL || '').trim(),
    companySupportPhone: (process.env.COMPANY_SUPPORT_PHONE || '').trim(),
    companyRegisteredAddress: (process.env.COMPANY_REGISTERED_ADDRESS || '').trim(),
  };
}

export function isSupabaseConfigured(): boolean {
  const cfg = getServerConfig();
  return Boolean(cfg.supabaseUrl && cfg.supabaseServiceRoleKey);
}

export function isPesepayConfigured(): boolean {
  const cfg = getServerConfig();
  return Boolean(cfg.pesepayIntegrationKey && cfg.pesepayEncryptionKey.length === 32);
}
