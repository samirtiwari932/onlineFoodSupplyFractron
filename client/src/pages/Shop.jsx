import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from "sonner"
import { Link, useNavigate } from 'react-router-dom';

const Shop = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Redirect sellers to dashboard
    useEffect(() => {
        if (user && user.role === 'seller') {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await axios.get('http://localhost:5001/api/products/categories');
                setCategories(['All', ...data]);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const url = selectedCategory === 'All'
                    ? 'http://localhost:5001/api/products'
                    : `http://localhost:5001/api/products?category=${selectedCategory}`;
                const { data } = await axios.get(url);
                setProducts(data);
            } catch (error) {
                console.error('Error fetching products:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [selectedCategory]);

    const handleAddToCart = (product) => {
        addToCart(product);
        toast({
            title: "Added to cart",
            description: `${product.name} has been added to your cart.`,
        });
    };

    return (
        <div className="container py-8">
            <h1 className="text-3xl font-bold mb-6">Shop Organic</h1>

            {/* Category Tabs */}
            <div className="mb-8">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {categories.map((category) => (
                        <Button
                            key={category}
                            variant={selectedCategory === category ? "default" : "outline"}
                            onClick={() => setSelectedCategory(category)}
                            className="whitespace-nowrap"
                        >
                            {category}
                        </Button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading products...</div>
            ) : products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    No products found in this category.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <Card key={product._id} className="overflow-hidden flex flex-col">
                            <CardHeader className="p-0">
                                <img
                                    src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=2670&auto=format&fit=crop"
                                    alt={product.name}
                                    className="w-full h-48 object-cover transition-transform hover:scale-105"
                                />
                            </CardHeader>
                            <CardContent className="p-4 flex-1">
                                <CardTitle className="text-lg">{product.name}</CardTitle>
                                <CardDescription className="text-sm mt-2 line-clamp-2">{product.description}</CardDescription>
                                <div className="mt-2 font-bold text-lg">NPR {product.price}</div>
                                <div className="text-xs text-muted-foreground mt-1">{product.category}</div>
                            </CardContent>
                            <CardFooter className="p-4 pt-0 flex gap-2">
                                <Link to={`/product/${product._id}`} className="flex-1">
                                    <Button variant="outline" className="w-full">View</Button>
                                </Link>
                                {user && user.role === 'seller' ? (
                                    <Button variant="secondary" disabled className="flex-1">
                                        Sellers cannot buy
                                    </Button>
                                ) : (
                                    <Button onClick={() => handleAddToCart(product)} className="flex-1">
                                        Add to Cart
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Shop;
