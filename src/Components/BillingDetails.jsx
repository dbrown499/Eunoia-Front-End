import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
// import { useParams } from 'react-router-dom';


const API = import.meta.env.VITE_API_URL;


const BillingDetails = () => {
    // const param = useParams();
    const navigate = useNavigate();
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [succeeded, setSucceeded] = useState(false);

    // console.log(param)

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsProcessing(true);

        if (!stripe || !elements) {
            setError('Stripe has not loaded correctly. Please refresh and try again.');
            setIsProcessing(false);
            return;
        };
        const cardElement = elements.getElement(CardElement);

        // Create payment method
        const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
        });

        if (paymentMethodError) {
            setError(paymentMethodError.message);
            setIsProcessing(false);
            return;
        };

        try {
            const response = await fetch(`${API}/payments/`, {
                method: 'PUT',
                body: JSON.stringify({
                    payment_method: paymentMethod.id, // Send the payment method ID to your backend
                    // amount: 12500, // Amount in the smallest unit (e.g., cents for USD)
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok) {
                const { clientSecret } = data;

                // Use the clientSecret to confirm the payment
                const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                    payment_method: paymentMethod.id,
                });

                if (confirmError) {
                    setError(confirmError.message);
                } else {
                    setSucceeded(true);
                    alert('Payment succeeded!');
                    navigate(`/`);
                }
            } else {
                setError(data.error || 'Payment failed');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
        
    };


    return (
        <div className="payment-form-container">
            <h2 className="payment-form-title">Complete Your Payment</h2>
            <form onSubmit={handleSubmit} className="payment-form">
                {/* Billing Details */}
                <div className="form-section">
                    <h3>Billing Details</h3>
                    <div className="form-group">
                        <label htmlFor="fullName">Full Name</label>
                        <input type="text" id="fullName" placeholder="John Doe" required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input type="email" id="email" placeholder="youremail@example.com" required />
                    </div>
                    <div className='form-group'>
                        <label htmlFor="phone-number">Phone Number</label>
                        <input type="phone number" id="phone-number" placeholder='(123) 456-7890' required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="address">Address</label>
                        <input type="text" id="address" placeholder="123 Main Street" required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="city">City</label>
                        <input type="text" id="city" placeholder="" required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="state">State</label>
                        <input type="text" id="state" placeholder="" required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="zipcode">Zip Code</label>
                        <input type="text" id="zipcode" placeholder="12345" required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="country">Country</label>
                        <select id="country" required>
                            <option value="">
                                Select your country
                            </option>
                            <option value="usa">USA</option>
                        </select>
                    </div>
                </div>

                {/* Payment Details */}
                <div className="form-section">
                    <h3>Payment Details</h3>
                    <div className="form-group">
                        {/* <label htmlFor="cardNumber">Card Number</label> */}
                        <CardElement id="cardNumber" />
                    </div>
                </div>

                {/* Submit Button */}
                <button type="submit" className="submit-btn" disabled={!stripe || isProcessing}>
                    {isProcessing ? 'Processing...' : 'Pay Now'}
                </button>

                {error && <div className='error'>{error}</div>}
            </form>
        </div>
    );
};

export default BillingDetails;
