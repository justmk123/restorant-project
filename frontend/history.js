document.addEventListener('DOMContentLoaded', () => {
    fetchOrderHistory();
});

function fetchOrderHistory() {
    const url = `/api/orders`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderOrderHistory(data.orders);
            } else {
                console.error('Failed to fetch order history:', data.error);
                document.getElementById('orderHistory').innerHTML = '<p>Failed to load order history.</p>';
            }
        })
        .catch(error => {
            console.error('Error fetching order history:', error);
            document.getElementById('orderHistory').innerHTML = '<p>Error loading order history.</p>';
        });
}

function renderOrderHistory(orders) {
    const orderHistoryContainer = document.getElementById('orderHistory');

    if (orders.length === 0) {
        orderHistoryContainer.innerHTML = '<p>No orders found.</p>';
        return;
    }

    // Group orders by date
    const groupedOrders = {};
    
    orders.forEach(order => {
        const orderDate = new Date(order.createdAt).toLocaleDateString('en-CA'); // YYYY-MM-DD format
        
        if (!groupedOrders[orderDate]) {
            groupedOrders[orderDate] = [];
        }
        
        groupedOrders[orderDate].push(order);
    });

    // Build HTML with proper structure
    let groupedOrdersHTML = '';
    
    Object.keys(groupedOrders).forEach(dateKey => {
        const dateOrders = groupedOrders[dateKey];
        const formattedDate = new Date(dateOrders[0].createdAt).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        // Add date separator
        groupedOrdersHTML += `<h3 class="date-separator">${formattedDate}</h3>`;
        
        // Start orders-by-date container
        groupedOrdersHTML += `<div class="orders-by-date">`;
        
        // Add all order cards for this date
        dateOrders.forEach(order => {
            const itemsHTML = order.items.map(item => 
                `<li>${item.name} x ${item.quantity} - RM ${item.lineTotal.toFixed(2)}</li>`
            ).join('');
            
            groupedOrdersHTML += `
                <div class="order-card">
                    <div class="order-card-header">
                        <h3>Invoice: ${order.invoiceNumber}</h3>
                        <p class="order-status ${order.status.toLowerCase()}">Status: ${order.status}</p>
                    </div>
                    <div class="order-card-body">
                        <p><strong>Customer:</strong> ${order.customerName || 'N/A'}</p>
                        <p><strong>Room:</strong> ${order.roomNumber || 'N/A'}</p>
                        <p class="order-total-price"><strong>Total:</strong> RM ${order.total.toFixed(2)}</p>
                        <p><strong>Items:</strong></p>
                        <ul>
                            ${itemsHTML}
                        </ul>
                    </div>
                    <div class="order-card-footer">
                        <div class="order-date-display">
                            <p>Date: ${new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>
                </div>
            `;
        });
        
        // Close orders-by-date container
        groupedOrdersHTML += `</div>`;
    });

    orderHistoryContainer.innerHTML = groupedOrdersHTML;
}