import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Minus, Plus } from 'lucide-react';
import { toast } from "sonner"

const ProductDetails = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [qty, setQty] = useState(1);
    const { addToCart } = useCart();
    const { user } = useAuth();

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const { data } = await axios.get(`http://localhost:5001/api/products/${id}`);
                setProduct(data);
            } catch (error) {
                console.error('Error fetching product:', error);
            }
        };
        fetchProduct();
    }, [id]);

    const handleAddToCart = () => {
        addToCart(product, qty);
        toast("Added to cart", {
            description: `${product.name} (x${qty}) added to cart.`
        });
    };

    if (!product) return <div className="container py-8">Loading...</div>;

    return (
        <div className="container py-8">
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <img
                        src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=2670&auto=format&fit=crop"
                        alt={product.name}
                        className="w-full rounded-lg shadow-md"
                    />
                </div>
                <div className="space-y-6">
                    <h1 className="text-3xl font-bold">{product.name}</h1>
                    <div className="mt-2 font-bold text-lg">NPR {product.price}</div>
                    <p className="text-muted-foreground">{product.description}</p>

                    {user && user.role === 'seller' ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <p className="text-amber-800 font-medium">Sellers cannot purchase products.</p>
                            <p className="text-amber-700 text-sm mt-1">You can manage your products from the Dashboard.</p>
                        </div>
                    ) : (
                        <>
                            <div className="border-t border-b py-4">
                                <div className="flex items-center space-x-4">
                                    <span className="font-semibold">Quantity:</span>
                                    <div className="flex items-center border rounded-md">
                                        <Button variant="ghost" size="icon" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1}>
                                            <Minus className="h-4 w-4" />
                                        </Button>
                                        <span className="w-8 text-center">{qty}</span>
                                        <Button variant="ghost" size="icon" onClick={() => setQty(qty + 1)} disabled={qty >= product.countInStock}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <Button size="lg" className="w-full md:w-auto" onClick={handleAddToCart} disabled={product.countInStock === 0}>
                                {product.countInStock > 0 ? 'Add to Cart' : 'Out of Stock'}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
