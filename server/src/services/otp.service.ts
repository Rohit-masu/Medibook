import { env } from '../config/env.js';

/**
 * OTP provider abstraction. Swap MockOtpProvider for an MSG91 / Firebase
 * implementation later without touching routes or controllers.
 */
export interface OtpProvider {
  send(phone: string): Promise<void>;
  verify(phone: string, otp: string): Promise<boolean>;
}

class MockOtpProvider implements OtpProvider {
  async send(phone: string) {
    console.log(`[mock-otp] OTP for ${phone} is ${env.demoOtp} (no SMS sent)`);
  }

  async verify(_phone: string, otp: string) {
    return otp === env.demoOtp;
  }
}

export const otpService: OtpProvider = new MockOtpProvider();
