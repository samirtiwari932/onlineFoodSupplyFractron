import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [loading, setLoading] = useState(true);
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

    return (
        <div className="container mx-auto py-8">
            <section className="text-center mb-12">
                <h1 className="text-4xl font-bold text-primary mb-4">Organic Food Supply</h1>
                <p className="text-lg text-muted-foreground mb-6">
                    Fresh, Sustainable, and Organic Produce Delivered to Your Doorstep.
                </p>
                <Link to="/shop">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-white">
                        Shop Now
                    </Button>
                </Link>
            </section>

            {/* Category Tabs */}
            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Browse by Category</h2>
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

            <h2 className="text-2xl font-semibold mb-6">
                {selectedCategory === 'All' ? 'Featured Products' : selectedCategory}
            </h2>

            {loading ? (
                <div className="text-center py-8">Loading products...</div>
            ) : products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    No products found in this category.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <Card key={product._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                            <CardHeader className="p-0">
                                <img
                                    src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=2670&auto=format&fit=crop"
                                    alt={product.name}
                                    className="w-full h-48 object-cover"
                                />
                            </CardHeader>
                            <CardContent className="p-4">
                                <CardTitle className="text-lg truncate">{product.name}</CardTitle>
                                <CardDescription className="text-sm line-clamp-2 mt-2">{product.description}</CardDescription>
                                <div className="mt-2 font-bold text-lg">NPR {product.price}</div>
                                <div className="text-xs text-muted-foreground mt-1">{product.category}</div>
                            </CardContent>
                            <CardFooter className="p-4 pt-0">
                                <Link to={`/product/${product._id}`} className="w-full">
                                    <Button className="w-full">View Details</Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Home;
