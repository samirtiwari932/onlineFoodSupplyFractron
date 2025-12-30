import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCart } from '../context/CartContext';

const Cart = () => {
    const { cartItems, addToCart, removeFromCart } = useCart();
    const navigate = useNavigate();

    const itemsPrice = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
    const shippingPrice = itemsPrice > 100 ? 0 : 10;
    const taxPrice = Number((0.15 * itemsPrice).toFixed(2));
    const totalPrice = (itemsPrice + shippingPrice + taxPrice).toFixed(2);

    const checkoutHandler = () => {
        // Check if user is logged in
        // We can check localStorage 'userInfo' or access user from context, but context is safer if available
        // Assuming simplistic check for now or redirect
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            navigate('/checkout');
        } else {
            navigate('/login?redirect=checkout');
        }
    };

    return (
        <div className="container py-8">
            <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
            {cartItems.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-xl text-muted-foreground mb-4">Your cart is empty.</p>
                    <Link to="/shop">
                        <Button>Go Shopping</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-4">
                        {cartItems.map((item) => (
                            <Card key={item._id}>
                                <CardContent className="flex items-center p-4 gap-4">
                                    <img src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=2670&auto=format&fit=crop" alt={item.name} className="w-20 h-20 object-cover rounded-md" />
                                    <div className="flex-1">
                                        <Link to={`/product/${item._id}`} className="font-semibold hover:underline">
                                            {item.name}
                                        </Link>
                                        <p className="text-sm text-muted-foreground">NPR {item.price}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => addToCart(item, -1)} disabled={item.qty <= 1}>
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="w-6 text-center">{item.qty}</span>
                                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => addToCart(item, 1)} disabled={item.qty >= item.countInStock}>
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => removeFromCart(item._id)}>
                                        <Trash2 className="h-5 w-5 text-destructive" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span>NPR {itemsPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping</span>
                                    <span>NPR {shippingPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tax estimate</span>
                                    <span>NPR {taxPrice.toFixed(2)}</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>NPR {totalPrice}</span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="w-full" size="lg" onClick={checkoutHandler}>
                                    Checkout
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
