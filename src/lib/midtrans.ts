// Midtrans Payment Link Service
// Note: Payment link creation requires backend API for security
// This service expects a backend endpoint at /api/midtrans/create-payment-link

export interface MidtransPaymentRequest {
  bookId: string;
  bookTitle: string;
  price: number;
  shippingCost: number;
  customerDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    province: string;
  };
}

export interface MidtransPaymentResponse {
  paymentUrl: string;
  orderId: string;
  token?: string;
}

export const createMidtransPaymentLink = async (
  request: MidtransPaymentRequest
): Promise<MidtransPaymentResponse> => {
  // Calculate total amount
  const totalAmount = request.price + request.shippingCost;

  // Prepare request body for backend API
  const requestBody = {
    transaction_details: {
      order_id: `BOOK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      gross_amount: totalAmount,
    },
    item_details: [
      {
        id: request.bookId,
        price: request.price,
        quantity: 1,
        name: request.bookTitle,
      },
      {
        id: 'shipping',
        price: request.shippingCost,
        quantity: 1,
        name: 'Ongkir',
      },
    ],
    customer_details: {
      first_name: request.customerDetails.firstName,
      last_name: request.customerDetails.lastName,
      email: request.customerDetails.email,
      phone: request.customerDetails.phone,
      billing_address: {
        first_name: request.customerDetails.firstName,
        last_name: request.customerDetails.lastName,
        phone: request.customerDetails.phone,
        address: request.customerDetails.address,
        city: request.customerDetails.city,
        postal_code: request.customerDetails.postalCode,
        country_code: 'IDN',
      },
      shipping_address: {
        first_name: request.customerDetails.firstName,
        last_name: request.customerDetails.lastName,
        phone: request.customerDetails.phone,
        address: request.customerDetails.address,
        city: request.customerDetails.city,
        postal_code: request.customerDetails.postalCode,
        country_code: 'IDN',
      },
    },
  };

  try {
    // Call backend API endpoint
    // In development, Vite proxy will forward /api/* to backend
    // In production, use VITE_API_URL environment variable
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const apiUrl = `${baseUrl}/api/midtrans/create-payment-link`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(async () => {
        const fallbackText = await response.text().catch(() => '');
        return { message: fallbackText || 'Failed to create payment link' };
      });
      const detailedMessage = error.error?.message || error.message || 'Failed to create payment link';
      throw new Error(detailedMessage);
    }

    const data = await response.json();
    
    return {
      paymentUrl: data.payment_url || data.snap_url || data.redirect_url,
      orderId: data.order_id || requestBody.transaction_details.order_id,
      token: data.token,
    };
  } catch (error) {
    console.error('Midtrans payment link creation error:', error);
    throw error;
  }
};

// Class Registration Payment
export interface MidtransClassPaymentRequest {
  classId: string;
  className: string;
  price: number;
  customerDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export const createMidtransClassPaymentLink = async (
  request: MidtransClassPaymentRequest
): Promise<MidtransPaymentResponse> => {
  // Prepare request body for backend API
  const requestBody = {
    transaction_details: {
      order_id: `CLASS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      gross_amount: request.price,
    },
    item_details: [
      {
        id: request.classId,
        price: request.price,
        quantity: 1,
        name: request.className,
      },
    ],
    customer_details: {
      first_name: request.customerDetails.firstName,
      last_name: request.customerDetails.lastName,
      email: request.customerDetails.email,
      phone: request.customerDetails.phone,
    },
  };

  try {
    // Call backend API endpoint
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const apiUrl = `${baseUrl}/api/midtrans/create-payment-link`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json().catch(async () => {
        const fallbackText = await response.text().catch(() => '');
        return { message: fallbackText || 'Failed to create payment link' };
      });
      const detailedMessage = error.error?.message || error.message || 'Failed to create payment link';
      throw new Error(detailedMessage);
    }

    const data = await response.json();
    
    return {
      paymentUrl: data.payment_url || data.snap_url || data.redirect_url,
      orderId: data.order_id || requestBody.transaction_details.order_id,
      token: data.token,
    };
  } catch (error) {
    console.error('Midtrans class payment link creation error:', error);
    throw error;
  }
};

export interface SaveAccessCodeRequest {
  transactionId: string;
  orderId: string;
  code: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export const saveGraspGuideAccessCode = async (payload: SaveAccessCodeRequest) => {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const apiUrl = `${baseUrl}/api/grasp-guide/access-code`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(async () => {
      const fallbackText = await response.text().catch(() => '');
      return { message: fallbackText || 'Failed to save access code' };
    });
    throw new Error(error.message || 'Failed to save access code');
  }

  return response.json();
};

export interface VerifyAccessCodeResponse {
  valid: boolean;
  record?: {
    transactionId: string;
    orderId: string;
    code: string;
    customer?: SaveAccessCodeRequest['customer'];
  };
  message?: string;
}

export const verifyGraspGuideAccessCode = async (
  code: string
): Promise<VerifyAccessCodeResponse> => {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const apiUrl = `${baseUrl}/api/grasp-guide/verify-code`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const error = await response.json().catch(async () => {
      const fallbackText = await response.text().catch(() => '');
      return { message: fallbackText || 'Failed to verify code' };
    });
    throw new Error(error.message || 'Failed to verify code');
  }

  return response.json();
};

