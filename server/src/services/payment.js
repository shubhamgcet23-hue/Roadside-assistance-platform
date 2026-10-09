// Payment abstraction. Phase 1 only supports offline payment; a Stripe/Razorpay provider can implement
// the same interface (createPayment, confirm, refund) and be returned from getPaymentProvider().
export const PAYMENT_STATUS = ['PAYMENT_PENDING', 'OFFLINE_PAYMENT', 'PAID', 'REFUNDED'];

const offlineProvider = {
  name: 'offline',
  async createPayment() { return { status: 'OFFLINE_PAYMENT' }; },
  async confirm() { return { status: 'PAID' }; },
  async refund() { return { status: 'REFUNDED' }; },
};

export const getPaymentProvider = () => offlineProvider;
