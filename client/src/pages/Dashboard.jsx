import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useNavigate, Link } from 'react-router-dom';

const Dashboard = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !user) navigate('/login');
    }, [user, loading, navigate]);

    if (loading || !user) return <div>Loading...</div>;

    return (
        <div className="container py-8">
            <h1 className="text-3xl font-bold mb-8">Dashboard: {user.name}</h1>
            {user.role === 'seller' && <SellerView user={user} />}
            {user.role === 'admin' && <AdminView user={user} />}
            {user.role === 'user' && <UserView user={user} />}
        </div>
    );
};

const SellerView = ({ user }) => {
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState('');
    const [brand, setBrand] = useState('');
    const [category, setCategory] = useState('');
    const [countInStock, setCountInStock] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchMyProducts();
        fetchMyOrders();
    }, []);

    const fetchMyProducts = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('http://localhost:5001/api/products/seller/my-products', config);
            setProducts(data);
        } catch (error) {
            console.error(error);
        }
    };

    const uploadFileHandler = async (e) => {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('image', file);
        setUploading(true);

        try {
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.post('http://localhost:5001/api/products/upload', formData, config);
            setImage(data.url);
            setUploading(false);
        } catch (error) {
            console.error(error);
            setUploading(false);
            alert('Image upload failed');
        }
    };

    const fetchMyOrders = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('http://localhost:5001/api/orders/seller/my-orders', config);
            setOrders(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post('http://localhost:5001/api/products', {
                name, price, description, image, brand, category, countInStock
            }, config);
            alert('Product created! Waiting for Admin approval.');
            setName(''); setPrice(''); setDescription(''); setImage(''); setBrand(''); setCategory(''); setCountInStock('');
            fetchMyProducts();
        } catch (error) {
            alert(error.response?.data?.message || 'Error creating product');
        }
    };

    return (
        <div className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Product</CardTitle>
                        <CardDescription>List your organic product for admin approval</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateProduct} className="space-y-4">
                            <Input placeholder="Product Name" value={name} onChange={(e) => setName(e.target.value)} required />
                            <div className="space-y-1">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Product Image
                                </label>
                                <Input
                                    type="file"
                                    onChange={uploadFileHandler}
                                    className="cursor-pointer"
                                />
                                {uploading && <p className="text-xs text-muted-foreground animate-pulse">Uploading...</p>}
                                {image && (
                                    <div className="mt-2">
                                        <img src={image} alt="Preview" className="h-20 w-20 object-cover rounded-md border" />
                                        <p className="text-[10px] text-muted-foreground mt-1 truncate">{image}</p>
                                    </div>
                                )}
                            </div>
                            <Input placeholder="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} required />
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={category} onChange={(e) => setCategory(e.target.value)} required>
                                <option value="">Select Category</option>
                                <option value="Vegetables">Vegetables</option>
                                <option value="Fruits">Fruits</option>
                                <option value="Spices">Spices</option>
                                <option value="Dairy">Dairy</option>
                                <option value="Grains">Grains</option>
                                <option value="Meat & Poultry">Meat & Poultry</option>
                                <option value="Beverages">Beverages</option>
                            </select>
                            <Input placeholder="Price (NPR)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
                            <Input placeholder="Count In Stock" type="number" value={countInStock} onChange={(e) => setCountInStock(e.target.value)} required />
                            <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required />
                            <Button type="submit" className="w-full">Create Product</Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between"><span>Total Products:</span><Badge>{products.length}</Badge></div>
                        <div className="flex justify-between"><span>Approved:</span><Badge variant="success">{products.filter(p => p.isApproved).length}</Badge></div>
                        <div className="flex justify-between"><span>Pending:</span><Badge variant="secondary">{products.filter(p => !p.isApproved).length}</Badge></div>
                        <div className="flex justify-between"><span>Total Orders:</span><Badge>{orders.length}</Badge></div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Your Products</CardTitle>
                    <CardDescription>All products you have listed</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((product) => (
                                <TableRow key={product._id}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell>{product.category}</TableCell>
                                    <TableCell>NPR {product.price}</TableCell>
                                    <TableCell>{product.countInStock}</TableCell>
                                    <TableCell>
                                        {product.isApproved ? (
                                            <Badge className="bg-green-600">Approved</Badge>
                                        ) : (
                                            <Badge className="bg-amber-600">Pending</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Orders</CardTitle>
                    <CardDescription>Orders containing your products</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Paid</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order._id}>
                                    <TableCell className="font-mono text-xs">{order._id.substring(18)}</TableCell>
                                    <TableCell>{order.user.name}</TableCell>
                                    <TableCell>NPR {order.totalPrice}</TableCell>
                                    <TableCell>{order.isPaid ? <Badge className="bg-green-600">Yes</Badge> : <Badge variant="destructive">No</Badge>}</TableCell>
                                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

const AdminView = ({ user }) => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        fetchAllProducts();
    }, []);

    const fetchAllProducts = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('http://localhost:5001/api/products/admin/all', config);
            setProducts(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleApprove = async (id, status) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`http://localhost:5001/api/products/${id}/approve`, { isApproved: status }, config);
            fetchAllProducts();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>All Products (Approval Queue)</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Approved</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((product) => (
                            <TableRow key={product._id}>
                                <TableCell className="font-mono text-xs">{product._id.substring(20)}</TableCell>
                                <TableCell>{product.name}</TableCell>
                                <TableCell>NPR {product.price}</TableCell>
                                <TableCell>
                                    {product.isApproved ? <Badge className="bg-green-600">Yes</Badge> : <Badge variant="destructive">No</Badge>}
                                </TableCell>
                                <TableCell>
                                    {!product.isApproved ? (
                                        <Button size="sm" onClick={() => handleApprove(product._id, true)}>Approve</Button>
                                    ) : (
                                        <Button size="sm" variant="destructive" onClick={() => handleApprove(product._id, false)}>Reject</Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

const UserView = ({ user }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyOrders = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const { data } = await axios.get('http://localhost:5001/api/orders/myorders', config);
                setOrders(data);
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyOrders();
    }, [user.token]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>My Orders</CardTitle>
                    <CardDescription>View your order history and track deliveries</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-center py-8 text-muted-foreground">Loading orders...</p>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">You haven't placed any orders yet.</p>
                            <Link to="/shop">
                                <Button>Start Shopping</Button>
                            </Link>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Paid</TableHead>
                                    <TableHead>Delivered</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order._id}>
                                        <TableCell className="font-mono text-xs">{order._id.substring(18)}</TableCell>
                                        <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                        <TableCell>{order.orderItems.length} item(s)</TableCell>
                                        <TableCell className="font-semibold">NPR {order.totalPrice}</TableCell>
                                        <TableCell>
                                            {order.isPaid ? (
                                                <Badge className="bg-green-600">Paid</Badge>
                                            ) : (
                                                <Badge variant="destructive">Unpaid</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {order.isDelivered ? (
                                                <Badge className="bg-green-600">Yes</Badge>
                                            ) : (
                                                <Badge variant="secondary">Pending</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Dashboard;
