import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Replace with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = () => {
    const stripe = useStripe();
    const elements = useElements();
    const { cartItems, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [country, setCountry] = useState('NP'); // Nepal ISO code
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    // Redirect if no user or empty cart
    useEffect(() => {
        if (!user) {
            navigate('/login?redirect=checkout');
        }
        if (cartItems.length === 0) {
            navigate('/cart');
        }
    }, [user, cartItems, navigate]);

    const itemsPrice = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
    const shippingPrice = itemsPrice > 100 ? 0 : 10;
    const taxPrice = Number((0.15 * itemsPrice).toFixed(2));
    const totalPrice = (itemsPrice + shippingPrice + taxPrice).toFixed(2);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setProcessing(true);

        if (!stripe || !elements) {
            setProcessing(false);
            return;
        }

        const cardElement = elements.getElement(CardElement);

        try {
            // 1. Create Order & PaymentIntent on Backend
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                },
            };

            // Format cart items for order creation
            const formattedOrderItems = cartItems.map(item => ({
                name: item.name,
                qty: item.qty,
                image: item.image,
                price: item.price,
                product: item._id, // Product reference ID
            }));

            const orderData = {
                orderItems: formattedOrderItems,
                shippingAddress: { address, city, postalCode, country },
                paymentMethod: 'Stripe',
                itemsPrice,
                taxPrice,
                shippingPrice,
                totalPrice,
            };

            const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/orders`, orderData, config);
            const clientSecret = data.clientSecret;

            // 2. Confirm Card Payment
            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: user.name,
                        email: user.email,
                        address: {
                            line1: address,
                            city: city,
                            postal_code: postalCode,
                            country: country,
                        },
                    },
                },
            });

            if (result.error) {
                setError(result.error.message);
                setProcessing(false);
            } else {
                if (result.paymentIntent.status === 'succeeded') {
                    // 3. Mark Order as Paid
                    await axios.put(`${import.meta.env.VITE_API_URL}/orders/${data.order._id}/pay`, {
                        paymentResult: result.paymentIntent
                    }, config);

                    clearCart();
                    navigate('/');
                    alert('Payment Successful!');
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message);
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="city">City</Label>
                            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="postalCode">Postal Code</Label>
                            <Input id="postalCode" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                            id="country"
                            type="text"
                            value="Nepal"
                            disabled
                            className="bg-muted"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Payment Details</CardTitle>
                    <CardDescription>Total: NPR {totalPrice}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="p-4 border rounded-md">
                        <CardElement options={{
                            style: {
                                base: {
                                    fontSize: '16px',
                                    color: '#424770',
                                    '::placeholder': {
                                        color: '#aab7c4',
                                    },
                                },
                                invalid: {
                                    color: '#9e2146',
                                },
                            },
                        }} />
                    </div>
                    {error && <div className="text-red-500 mt-2 text-sm">{error}</div>}
                </CardContent>
                <div className="p-6 pt-0">
                    <Button type="submit" className="w-full" disabled={!stripe || processing}>
                        {processing ? 'Processing...' : `Pay NPR ${totalPrice}`}
                    </Button>
                </div>
            </Card>
        </form>
    );
};

const Checkout = () => {
    return (
        <div className="container max-w-2xl py-8">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>
            <Elements stripe={stripePromise}>
                <CheckoutForm />
            </Elements>
        </div>
    );
};

export default Checkout;
