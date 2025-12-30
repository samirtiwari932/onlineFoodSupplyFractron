const mongoose = require('mongoose');
const dotenv = require('dotenv');
const products = require('./data/products');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');

dotenv.config();

const connect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

const importData = async () => {
    try {
        await connect();

        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();

        // Create Admin User
        const createdUsers = await User.insertMany([
            {
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'password123', // Will be hashed by pre-save hook? No, insertMany doesn't trigger pre-save hooks usually! Wait, I should use create or loop. Use create for hooks.
                role: 'admin'
            },
            {
                name: 'John Doe',
                email: 'user@example.com',
                password: 'password123',
                role: 'user'
            },
            {
                name: 'Seller One',
                email: 'seller@example.com',
                password: 'password123',
                role: 'seller'
            }
        ]);

        // NOTE: insertMany bypasses mongoose middleware like pre-save hooks for hashing passwords!
        // I need to properly hash them or use User.create (which is slower but triggers hooks).
        // Actually, let's just manually hash them here or assume the hook works if I iterate. 
        // Mongoose 5+ insertMany validates but middleware like pre('save') is not executed. 

        // Better approach:
        await User.deleteMany();

        const adminUser = new User({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'password123',
            role: 'admin'
        });
        await adminUser.save();

        const normalUser = new User({
            name: 'John Doe',
            email: 'user@example.com',
            password: 'password123',
            role: 'user'
        });
        await normalUser.save();

        const sellerUser = new User({
            name: 'Seller One',
            email: 'seller@example.com',
            password: 'password123',
            role: 'seller'
        });
        await sellerUser.save();

        const adminUserId = adminUser._id;

        const sampleProducts = products.map((product) => {
            return { ...product, user: adminUserId };
        });

        await Product.insertMany(sampleProducts);

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await connect();

        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();

        console.log('Data Destroyed!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
