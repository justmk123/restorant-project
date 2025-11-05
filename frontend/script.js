// Menu Items Data
const menuItems = [

    { id: 1, name: "Sundae Cone", price: 1.00, category: "Desserts & Sides", image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=300&fit=crop" },
    { id: 2, name: "Sundae (Chocolate/Strawberry)", price: 2.70, category: "Desserts & Sides", image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=300&h=300&fit=crop" },
    { id: 3, name: "ChocoTop™", price: 1.50, category: "Desserts & Sides", image: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=300&h=300&fit=crop" },
    { id: 4, name: "Oreo McFlurry™", price: 3.50, category: "Desserts & Sides", image: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=300&h=300&fit=crop" },
    { id: 5, name: "Apple Pie", price: 2.20, category: "Desserts & Sides", image: "https://images.unsplash.com/photo-1535920527002-b35e96722eb9?w=300&h=300&fit=crop" },
    { id: 6, name: "Corn Cup", price: 1.80, category: "Desserts & Sides", image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=300&h=300&fit=crop" },
    { id: 7, name: "French Fries", price: 4.50, category: "Desserts & Sides", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&h=300&fit=crop" },
    { id: 8, name: "Big Mac", price: 12.50, category: "Burgers", image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=300&h=300&fit=crop" },
    { id: 9, name: "McChicken", price: 8.90, category: "Burgers", image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=300&h=300&fit=crop" },
    { id: 10, name: "Filet-O-Fish", price: 10.20, category: "Burgers", image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=300&h=300&fit=crop" },
    { id: 11, name: "Chicken Nuggets (6pc)", price: 6.50, category: "Chicken", image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=300&h=300&fit=crop" },
    { id: 12, name: "Chicken McNuggets (20pc)", price: 15.90, category: "Chicken", image: "https://images.unsplash.com/photo-1619894991209-e86b8fdf89f1?w=300&h=300&fit=crop" },
    { id: 13, name: "Coca-Cola", price: 2.50, category: "Beverages", image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=300&h=300&fit=crop" },
    { id: 14, name: "Iced Coffee", price: 3.50, category: "Beverages", image: "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=300&h=300&fit=crop" }
];

// Get unique categories
const categories = [...new Set(menuItems.map(item => item.category))];

// Global variables
let cart = {};
let currentCategory = categories[0];

// Initialize the app
function init() {
    renderCategories();
    renderMenu();
    setupSearch();
}

// Render category buttons
function renderCategories() {
    const sidebar = document.getElementById('sidebar');
    sidebar.innerHTML = categories.map(cat => 
        `<button class="category-btn ${cat === currentCategory ? 'active' : ''}" onclick="changeCategory('${cat}')">
            📋<br>${cat}
        </button>`
    ).join('');
}

// Change active category
function changeCategory(category) {
    currentCategory = category;
    document.getElementById('categoryTitle').textContent = category;
    renderCategories();
    renderMenu();
}

// Render menu items
function renderMenu() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    const filteredItems = menuItems.filter(item => 
        item.category === currentCategory &&
        item.name.toLowerCase().includes(searchQuery)
    );

    const menuGrid = document.getElementById('menuGrid');
    menuGrid.innerHTML = filteredItems.map(item => 
        `<div class="menu-item ${cart[item.id] ? 'selected' : ''}" onclick="toggleItem(${item.id})">
            <img src="${item.image}" alt="${item.name}">
            <h3>${item.name}</h3>
            <div class="price">RM ${item.price.toFixed(2)}</div>
        </div>`
    ).join('');
}

// Toggle item in cart
function toggleItem(itemId) {
    if (cart[itemId]) {
        cart[itemId]++;
    } else {
        cart[itemId] = 1;
    }
    renderMenu();
    renderCart();
}

// Update quantity
function updateQuantity(itemId, change) {
    if (cart[itemId]) {
        cart[itemId] += change;
        if (cart[itemId] <= 0) {
            delete cart[itemId];
        }
    }
    renderMenu();
    renderCart();
}

// Set quantity manually
function setQuantity(itemId, value) {
    const qty = parseInt(value) || 0;
    if (qty <= 0) {
        delete cart[itemId];
    } else {
        cart[itemId] = qty;
    }
    renderCart();
}

// Render cart
function renderCart() {
    const cartSection = document.getElementById('cartSection');
    const emptyCart = document.getElementById('emptyCart');
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');

    const itemCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

    if (itemCount === 0) {
        cartSection.style.display = 'none';
        emptyCart.style.display = 'block';
        return;
    }

    cartSection.style.display = 'block';
    emptyCart.style.display = 'none';
    cartCount.textContent = `${itemCount} Items in list`;

    cartItems.innerHTML = Object.entries(cart).map(([itemId, qty]) => {
        const item = menuItems.find(i => i.id == itemId);
        const total = item.price * qty;
        return `
            <div class="cart-item">
                <div class="cart-item-name">${item.name} x ${qty}</div>
                <div class="cart-item-right">
                    <div class="cart-item-price">RM ${total.toFixed(2)}</div>
                    <div class="quantity-controls">
                        <button class="qty-btn" onclick="updateQuantity(${itemId}, -1)">-</button>
                        <input type="number" class="qty-input" value="${qty}" onchange="setQuantity(${itemId}, this.value)" min="0">
                        <button class="qty-btn" onclick="updateQuantity(${itemId}, 1)">+</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Clear cart
function clearCart() {
    if (confirm('Are you sure you want to cancel the order?')) {
        cart = {};
        renderMenu();
        renderCart();
    }
}

// Calculate total
function calculateTotal() {
    return Object.entries(cart).reduce((sum, [itemId, qty]) => {
        const item = menuItems.find(i => i.id == itemId);
        return sum + (item.price * qty);
    }, 0);
}

const API_URL = 'http://localhost:3000';

// Generate invoice
async function generateInvoice() {
    if (Object.keys(cart).length === 0) {
        alert('Cart is empty!');
        return;
    }

    const invoiceNumber = `INV-${Date.now()}`;
    const dateTime = new Date().toLocaleString();
    const total = calculateTotal();

    const orderItems = Object.entries(cart).map(([itemId, qty]) => {
        const item = menuItems.find(i => i.id == itemId);
        const lineTotal = item.price * qty;
        return {
            name: item.name,
            quantity: qty,
            unitPrice: item.price,
            lineTotal: lineTotal
        };
    });

    const orderData = {
        invoiceNumber: invoiceNumber,
        dateTime: dateTime,
        items: orderItems,
        subtotal: total, // For simplicity, subtotal is same as total here
        tax: 0, // Assuming no tax for now
        discount: 0, // Assuming no discount for now
        total: total,
        paymentMethod: 'Cash', // Default
        customerName: 'Guest', // Default
        customerPhone: 'N/A', // Default
        roomNumber: 'N/A', // Default
        status: 'confirm'
    };

    try {
        const response = await fetch(`${API_URL}/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();

        if (result.success) {
            alert('Order placed successfully! Invoice Number: ' + result.order.invoiceNumber);
            cart = {}; // Clear cart on successful order
            renderMenu();
            renderCart();
            
            const invoiceHTML = `
                <div class="invoice-header">
                    <h1>McDonald's</h1>
                    <p>123 Fast Food Street, City Center</p>
                    <p>+60 3-1234 5678 | orders@mcdonalds.com</p>
                </div>

                <div class="invoice-info">
                    <div>
                        <strong>Invoice #:</strong> ${invoiceNumber}<br>
                        <strong>Date:</strong> ${dateTime}
                    </div>
                    <div style="text-align: right;">
                        <strong>Payment Method:</strong> Cash
                    </div>
                </div>

                <table class="invoice-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th style="text-align: right;">Qty</th>
                            <th style="text-align: right;">Price</th>
                            <th style="text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orderItems.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td style="text-align: right;">${item.quantity}</td>
                                    <td style="text-align: right;"><strong>RM</strong> ${item.unitPrice.toFixed(2)}</td>
                                    <td style="text-align: right;"><strong>RM</strong> ${item.lineTotal.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" style="text-align: right; font-weight: bold;">Subtotal</td>
                            <td style="text-align: right; font-weight: bold;"><strong>RM</strong> ${total.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>

                <div class="invoice-footer">
                    <p>Thank you for your order!</p>
                    <p>We hope to serve you again soon.</p>
                </div>

                <div class="invoice-actions">
                    <button class="btn btn-submit" onclick="window.print()">🖨️ Print Invoice</button>
                    <button class="btn btn-cancel" onclick="closeInvoice()">Back to Menu</button>
                </div>
            `;

            document.getElementById('invoice').innerHTML = invoiceHTML;
            document.getElementById('invoiceOverlay').classList.add('active');
        } else {
            alert('Failed to place order: ' + result.error);
        }
    } catch (error) {
        console.error('Error placing order:', error);
        alert('An error occurred while placing the order.');
    }
}
// Show invoice
function showInvoice() {
    generateInvoice();
}

// Close invoice
function closeInvoice() {
    document.getElementById('invoiceOverlay').classList.remove('active');
}

// Setup search functionality
function setupSearch() {
    document.getElementById('searchInput').addEventListener('input', renderMenu);
}

// Close invoice on overlay click
document.getElementById('invoiceOverlay').addEventListener('click', function(e) {
    if (e.target === this) {
        closeInvoice();
    }
});

// Start the app
init();