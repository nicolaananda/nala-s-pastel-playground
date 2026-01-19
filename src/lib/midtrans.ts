// Midtrans Payment Link Service
// Note: Payment link creation requires backend API for security
// This service expects a backend endpoint at /api/midtrans/create-payment-link

// Helper function to handle API errors with user-friendly messages
const handlePaymentError = async (response: Response): Promise<never> => {
  const error = await response.json().catch(async () => {
    const fallbackText = await response.text().catch(() => '');
    return { message: fallbackText || 'Failed to create payment link' };
  });

  // Extract detailed error message
  const errorCode = error.error_code || 'UNKNOWN_ERROR';
  const errorDetails = error.details?.join(', ') || '';
  const detailedMessage = error.message || error.error?.message || 'Failed to create payment link';

  // User-friendly error messages
  let userMessage = detailedMessage;

  if (errorCode === 'MIDTRANS_AUTH_FAILED' || response.status === 401) {
    userMessage = 'Payment gateway authentication failed. Please try again later or contact support.';
  } else if (errorCode === 'MIDTRANS_NOT_CONFIGURED') {
    userMessage = 'Payment system is temporarily unavailable. Please contact support.';
  } else if (errorCode === 'INVALID_REQUEST') {
    userMessage = 'Invalid payment request. Please check your information and try again.';
  } else if (response.status === 500) {
    userMessage = 'Server error occurred. Please try again later.';
  } else if (response.status >= 400 && response.status < 500) {
    userMessage = 'Invalid request. Please check your information and try again.';
  }

  console.error('Payment creation failed:', {
    status: response.status,
    errorCode,
    message: detailedMessage,
    details: errorDetails
  });

  throw new Error(userMessage);
};

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
      await handlePaymentError(response);
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
  additionalDetails?: {
    childName: string;
    childDob: string;
    parentWhatsapp: string;
    domicileAddress: string;
    socialMediaUsername: string;
    classDay: string;
  };
}

export const createMidtransClassPaymentLink = async (
  request: MidtransClassPaymentRequest
): Promise<MidtransPaymentResponse> => {
  // Use BELAJAR- prefix as requested
  const orderId = `BELAJAR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  // Prepare request body for backend API
  const requestBody = {
    transaction_details: {
      order_id: orderId,
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
      billing_address: request.additionalDetails ? {
        first_name: request.additionalDetails.childName, // Using child name in billing for easy ref
        address: request.additionalDetails.domicileAddress,
        phone: request.additionalDetails.parentWhatsapp,
        country_code: 'IDN'
      } : undefined
    },
    // Using custom fields to pass extra data to Midtrans (and retrieve it in webhook)
    custom_field1: request.additionalDetails ?
      `Anak: ${request.additionalDetails.childName} (${request.additionalDetails.childDob})` : '',
    custom_field2: request.additionalDetails ?
      `IG: ${request.additionalDetails.socialMediaUsername} | WA: ${request.additionalDetails.parentWhatsapp}` : '',
    custom_field3: request.additionalDetails ?
      `Kelas: ${request.className} | Hari: ${request.additionalDetails.classDay}` : '',
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
      await handlePaymentError(response);
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

// Sketch Purchase Payment
export interface MidtransSketchPaymentRequest {
  sketchId: string;
  sketchTitle: string;
  price: number;
  customerDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export const createMidtransSketchPaymentLink = async (
  request: MidtransSketchPaymentRequest
): Promise<MidtransPaymentResponse> => {
  // Prepare request body for backend API
  const requestBody = {
    transaction_details: {
      order_id: `SKET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      gross_amount: request.price,
    },
    item_details: [
      {
        id: request.sketchId,
        price: request.price,
        quantity: 1,
        name: request.sketchTitle,
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
      await handlePaymentError(response);
    }

    const data = await response.json();

    return {
      paymentUrl: data.payment_url || data.snap_url || data.redirect_url,
      orderId: data.order_id || requestBody.transaction_details.order_id,
      token: data.token,
    };
  } catch (error) {
    console.error('Midtrans sketch payment link creation error:', error);
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

