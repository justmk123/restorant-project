const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ MongoDB Connected');
}).catch(err => {
    console.log('❌ MongoDB Connection Error:', err);
});

// Order Schema
const orderSchema = new mongoose.Schema({
    invoiceNumber: { type: String, required: true, unique: true },
    dateTime: { type: String, required: true },
    items: [{
        name: String,
        quantity: Number,
        unitPrice: Number,
        lineTotal: Number
    }],
    subtotal: Number,
    tax: Number,
    discount: Number,
    total: Number,
    paymentMethod: { type: String, default: 'Cash' },
    customerName: String,
    customerPhone: String,
    roomNumber: String,
    status: { type: String, default: 'confirm' }, // confirm, Preparing, Completed
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// ============ API ROUTES ============

// 1. Get all orders
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json({ 
            success: true, 
            count: orders.length,
            orders 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 2. Get single order by invoice number
app.get('/api/orders/:invoiceNumber', async (req, res) => {
    try {
        const order = await Order.findOne({ 
            invoiceNumber: req.params.invoiceNumber 
        });
        
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                error: 'Order not found' 
            });
        }
        
        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 3. Create new order
app.post('/api/orders', async (req, res) => {
    try {
        const order = new Order(req.body);
        await order.save();
        
        res.status(201).json({ 
            success: true, 
            message: 'Order created successfully',
            order 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 4. Update order status
app.patch('/api/orders/:invoiceNumber', async (req, res) => {
    try {
        const order = await Order.findOneAndUpdate(
            { invoiceNumber: req.params.invoiceNumber },
            { status: req.body.status },
            { new: true }
        );
        
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                error: 'Order not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Order updated successfully',
            order 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 5. Delete order
app.delete('/api/orders/:invoiceNumber', async (req, res) => {
    try {
        const order = await Order.findOneAndDelete({ 
            invoiceNumber: req.params.invoiceNumber 
        });
        
        if (!order) {
            return res.status(404).json({ 
                success: false, 
                error: 'Order not found' 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Order deleted successfully' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 6. Get orders by date range
app.get('/api/orders/date/:startDate/:endDate', async (req, res) => {
    try {
        const startDate = new Date(req.params.startDate);
        const endDate = new Date(req.params.endDate);
        endDate.setHours(23, 59, 59, 999);
        
        const orders = await Order.find({
            createdAt: { $gte: startDate, $lte: endDate }
        }).sort({ createdAt: -1 });
        
        res.json({ 
            success: true,
            count: orders.length,
            orders 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 7. Get order statistics
app.get('/api/stats', async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const todayOrders = await Order.countDocuments({
            createdAt: { $gte: todayStart }
        });
        
        const totalRevenue = await Order.aggregate([
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        
        const todayRevenue = await Order.aggregate([
            { $match: { createdAt: { $gte: todayStart } } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        
        res.json({
            success: true,
            stats: {
                totalOrders,
                todayOrders,
                totalRevenue: totalRevenue[0]?.total || 0,
                todayRevenue: todayRevenue[0]?.total || 0
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 8. Search orders
app.get('/api/search', async (req, res) => {
    try {
        const { query } = req.query;
        
        const orders = await Order.find({
            $or: [
                { invoiceNumber: { $regex: query, $options: 'i' } },
                { customerName: { $regex: query, $options: 'i' } },
                { customerPhone: { $regex: query, $options: 'i' } },
                { roomNumber: { $regex: query, $options: 'i' } }
            ]
        }).sort({ createdAt: -1 });
        
        res.json({ 
            success: true,
            count: orders.length,
            orders 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 9. Get sales data per item
app.get('/api/sales/items', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let matchQuery = {};

        if (startDate && endDate) {
            matchQuery.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        } else if (startDate) {
            matchQuery.createdAt = { $gte: new Date(startDate) };
        } else if (endDate) {
            matchQuery.createdAt = { $lte: new Date(endDate) };
        }

        const pipeline = [
            { $match: matchQuery },
            { $unwind: '$items' },
            { $group: {
                _id: '$items.name',
                totalQuantitySold: { $sum: '$items.quantity' },
                totalRevenue: { $sum: '$items.lineTotal' }
            }},
            { $sort: { totalQuantitySold: -1 } }
        ];

        const salesData = await Order.aggregate(pipeline);

        res.json({
            success: true,
            salesData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 10. Get top-selling item for a period
app.get('/api/sales/top-item', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let matchQuery = {};

        if (startDate && endDate) {
            matchQuery.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        } else if (startDate) {
            matchQuery.createdAt = { $gte: new Date(startDate) };
        } else if (endDate) {
            matchQuery.createdAt = { $lte: new Date(endDate) };
        } else {
            // Default to last month if no dates are provided
            const now = new Date();
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            matchQuery.createdAt = { $gte: lastMonth, $lte: now };
        }

        const pipeline = [
            { $match: matchQuery },
            { $unwind: '$items' },
            { $group: {
                _id: '$items.name',
                totalQuantitySold: { $sum: '$items.quantity' },
                totalRevenue: { $sum: '$items.lineTotal' }
            }},
            { $sort: { totalQuantitySold: -1 } },
            { $limit: 1 }
        ];

        const topItem = await Order.aggregate(pipeline);

        res.json({
            success: true,
            topItem: topItem[0] || null
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 11. Get monthly sales data
app.get('/api/sales/monthly', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let matchQuery = {};

        if (startDate && endDate) {
            matchQuery.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        } else if (startDate) {
            matchQuery.createdAt = { $gte: new Date(startDate) };
        } else if (endDate) {
            matchQuery.createdAt = { $lte: new Date(endDate) };
        }

        const pipeline = [
            { $match: matchQuery },
            { $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                totalMonthlyRevenue: { $sum: '$total' },
                orders: { $push: '$items' }
            }},
            { $unwind: '$orders' },
            { $unwind: '$orders' },
            { $group: {
                _id: {
                    year: '$_id.year',
                    month: '$_id.month',
                    itemName: '$orders.name'
                },
                totalQuantitySold: { $sum: '$orders.quantity' },
                totalItemRevenue: { $sum: '$orders.lineTotal' }
            }},
            { $sort: { '_id.year': 1, '_id.month': 1, totalQuantitySold: -1 } },
            { $group: {
                _id: {
                    year: '$_id.year',
                    month: '$_id.month'
                },
                totalMonthlyRevenue: { $first: '$totalMonthlyRevenue' }, // Get total monthly revenue from previous stage
                topSellingItem: { $first: {
                    name: '$_id.itemName',
                    quantity: '$totalQuantitySold',
                    revenue: '$totalItemRevenue'
                }},
                monthlyItems: { $push: {
                    name: '$_id.itemName',
                    quantity: '$totalQuantitySold',
                    revenue: '$totalItemRevenue'
                }}
            }},
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ];

        const monthlySales = await Order.aggregate(pipeline);

        res.json({
            success: true,
            monthlySales
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Default route
app.get('/', (req, res) => {
    res.send(`
        <h1>🍔 McDonald's Order API</h1>
        <p>Server is running successfully!</p>
        <h3>Available Endpoints:</h3>
        <ul>
            <li>GET /api/orders - Get all orders</li>
            <li>GET /api/orders/:invoiceNumber - Get single order</li>
            <li>POST /api/orders - Create new order</li>
            <li>PATCH /api/orders/:invoiceNumber - Update order</li>
            <li>DELETE /api/orders/:invoiceNumber - Delete order</li>
            <li>GET /api/stats - Get statistics</li>
            <li>GET /api/search?query=xxx - Search orders</li>
        </ul>
    `);
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📊 API Documentation: http://localhost:${PORT}/`);
});