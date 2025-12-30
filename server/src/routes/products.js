const express = require('express');
const Product = require('../models/Product');
const router = express.Router();
const { protect, admin, sellerOrAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const cloudinary = require('../config/cloudinary');


// @desc    Get all available product categories
// @route   GET /api/products/categories
// @access  Public
router.get('/categories', async (req, res) => {
    try {
        const categories = ['Vegetables', 'Fruits', 'Spices', 'Dairy', 'Grains', 'Meat & Poultry', 'Beverages'];
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Fetch all approved products (Public) with optional category filter
// @route   GET /api/products?category=Vegetables
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        const filter = { isApproved: true };

        if (category) {
            filter.category = category;
        }

        const products = await Product.find(filter);
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get seller's own products (all statuses)
// @route   GET /api/products/seller/my-products
// @access  Private/Seller
router.get('/seller/my-products', protect, sellerOrAdmin, async (req, res) => {
    try {
        const products = await Product.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Upload image to Cloudinary
// @route   POST /api/products/upload
// @access  Private/Seller/Admin
router.post('/upload', protect, sellerOrAdmin, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image' });
        }

        // Convert buffer to base64
        const fileStr = req.file.buffer.toString('base64');
        const fileType = req.file.mimetype;
        const uploadResponse = await cloudinary.uploader.upload(`data:${fileType};base64,${fileStr}`, {
            folder: 'foodSupply',
        });

        res.json({ url: uploadResponse.secure_url });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ message: 'Image upload failed' });
    }
});

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a product (Seller/Admin)
// @route   POST /api/products
// @access  Private/Seller/Admin
router.post('/', protect, sellerOrAdmin, async (req, res) => {
    try {
        const { name, price, description, image, brand, category, countInStock, discount } = req.body;
        const product = new Product({
            name,
            price,
            user: req.user._id,
            image,
            brand,
            category,
            countInStock,
            description,
            discount,
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all products (Admin - View pending)
// @route   GET /api/products/admin/all
// @access  Private/Admin
router.get('/admin/all', protect, admin, async (req, res) => {
    try {
        const products = await Product.find({});
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Approve/Reject product (Admin)
// @route   PUT /api/products/:id/approve
// @access  Private/Admin
router.put('/:id/approve', protect, admin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            product.isApproved = req.body.isApproved; // true to approve, false to reject
            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
