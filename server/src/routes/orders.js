const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const router = express.Router();
const Stripe = require('stripe');
const { protect, admin, sellerOrAdmin } = require('../middleware/authMiddleware');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Create new order & Stripe Payment Intent
// @route   POST /api/orders
// @access  Private
router.post('/', protect, async (req, res) => {
    const {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
        res.status(400).json({ message: 'No order items' });
        return;
    } else {
        // Create Stripe Payment Intent
        try {
            // NOTE: For production, calculate amount on server side based on product IDs to avoid client manipulation
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(totalPrice * 100), // paisa (smallest unit of NPR)
                currency: 'npr',
                description: 'Organic food products order', // Required for Indian export regulations
                automatic_payment_methods: {
                    enabled: true,
                },
            });

            const order = new Order({
                orderItems,
                user: req.user._id,
                shippingAddress,
                paymentMethod,
                taxPrice,
                shippingPrice,
                totalPrice,
                paymentResult: {
                    id: paymentIntent.id,
                    status: 'pending',
                    email_address: req.user.email
                },
                isPaid: false
            });

            const createdOrder = await order.save();

            res.status(201).json({
                order: createdOrder,
                clientSecret: paymentIntent.client_secret
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email');

        if (order) {
            res.json(order);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update order to paid (Webhooks or Check on Success)
// @route   PUT /api/orders/:id/pay
// @access  Private
router.put('/:id/pay', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            order.isPaid = true;
            order.paidAt = Date.now();
            // Add more payment result info here if needed
            if (req.body.paymentResult) {
                order.paymentResult = {
                    id: req.body.paymentResult.id,
                    status: req.body.paymentResult.status,
                    update_time: req.body.paymentResult.update_time,
                    email_address: req.body.paymentResult.email_address,
                };
            }

            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
router.get('/myorders', protect, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get seller's orders (orders containing their products)
// @route   GET /api/orders/seller/my-orders
// @access  Private/Seller
router.get('/seller/my-orders', protect, sellerOrAdmin, async (req, res) => {
    try {
        // Get all seller's product IDs
        const sellerProducts = await Product.find({ user: req.user._id }).select('_id');
        const productIds = sellerProducts.map(p => p._id);

        // Find orders containing any of seller's products
        const orders = await Order.find({
            'orderItems.product': { $in: productIds }
        }).populate('user', 'name email').sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
    try {
        const orders = await Order.find({}).populate('user', 'id name');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
