// src/lib/zibal.ts
const ZIBAL_REQUEST_URL = 'https://gateway.zibal.ir/v1/request'
const ZIBAL_VERIFY_URL = 'https://gateway.zibal.ir/v1/verify'
const ZIBAL_START_URL = 'https://gateway.zibal.ir/start/'

export interface ZibalRequestParams {
  merchant: string
  amount: number // مبلغ به ریال
  callbackUrl: string
  description?: string
  orderId?: string
  mobile?: string
  allowedCards?: string[]
  ledgerId?: string
  linkToPay?: boolean
  sms?: boolean
}

export interface ZibalRequestResponse {
  result: number
  message: string
  trackId?: number
}

export interface ZibalVerifyParams {
  merchant: string
  trackId: number
}

export interface ZibalVerifyResponse {
  paidAt: string
  amount: number
  result: number
  status: number
  refNumber: number
  description: string
  cardNumber: string
  orderId: string
  message: string
}

export class ZibalService {
  private merchantId: string

  constructor(merchantId: string) {
    if (!merchantId) {
      throw new Error('Zibal Merchant ID is required')
    }
    this.merchantId = merchantId
  }

  /**
   * ایجاد درخواست پرداخت
   */
  async createPaymentRequest(params: Omit<ZibalRequestParams, 'merchant'>): Promise<ZibalRequestResponse> {
    try {
      const response = await fetch(ZIBAL_REQUEST_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchant: this.merchantId,
          ...params,
        }),
      })

      const data: ZibalRequestResponse = await response.json()

      // بررسی نتیجه
      if (data.result !== 100) {
        throw new Error(this.getErrorMessage(data.result))
      }

      return data
    } catch (error) {
      console.error('Zibal request error:', error)
      throw error
    }
  }

  /**
   * تایید پرداخت
   */
  async verifyPayment(trackId: number): Promise<ZibalVerifyResponse> {
    try {
      const response = await fetch(ZIBAL_VERIFY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchant: this.merchantId,
          trackId,
        }),
      })

      const data: ZibalVerifyResponse = await response.json()

      // بررسی نتیجه - 100 یعنی موفق
      if (data.result !== 100) {
        throw new Error(this.getErrorMessage(data.result))
      }

      // بررسی وضعیت - 1 یعنی پرداخت شده
      if (data.status !== 1) {
        throw new Error('پرداخت تایید نشده است')
      }

      return data
    } catch (error) {
      console.error('Zibal verify error:', error)
      throw error
    }
  }

  /**
   * دریافت لینک پرداخت
   */
  getPaymentUrl(trackId: number): string {
    return `${ZIBAL_START_URL}${trackId}`
  }

  /**
   * دریافت پیام خطا بر اساس کد
   */
  private getErrorMessage(code: number): string {
    const errors: Record<number, string> = {
      100: 'با موفقیت تایید شد',
      102: 'merchant یافت نشد',
      103: 'merchant غیرفعال',
      104: 'merchant نامعتبر',
      105: 'amount بایستی بزرگتر از 1,000 ریال باشد',
      106: 'callbackUrl نامعتبر می‌باشد',
      113: 'amount مبلغ تراکنش از سقف میزان تراکنش بیشتر است',
      201: 'قبلا تایید شده',
      202: 'سفارش پرداخت نشده یا ناموفق بوده است',
      203: 'trackId نامعتبر می‌باشد',
    }

    return errors[code] || `خطای ناشناخته: ${code}`
  }
}

// تابع کمکی برای ایجاد نمونه سرویس
export function createZibalService(): ZibalService {
  const merchantId = process.env.ZIBAL_MERCHANT_ID
  if (!merchantId) {
    throw new Error('ZIBAL_MERCHANT_ID is not defined in environment variables')
  }
  return new ZibalService(merchantId)
}

