const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    populateDropdowns();
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    document.getElementById('monthSelect').value = currentMonth;
    document.getElementById('yearSelect').value = currentYear;
    updateSalesReport(currentMonth, currentYear);

    document.getElementById('viewReportBtn').addEventListener('click', () => {
        const selectedMonth = document.getElementById('monthSelect').value;
        const selectedYear = document.getElementById('yearSelect').value;
        updateSalesReport(selectedMonth, selectedYear);
    });

    // Fetch all-time sales data once
    fetchSalesReport();
});

function populateDropdowns() {
    const monthSelect = document.getElementById('monthSelect');
    const yearSelect = document.getElementById('yearSelect');

    const months = [
        { value: 1, name: 'Jan' }, { value: 2, name: 'Feb' },
        { value: 3, name: 'Mar' }, { value: 4, name: 'Apr' },
        { value: 5, name: 'May' }, { value: 6, name: 'Jun' },
        { value: 7, name: 'Jul' }, { value: 8, name: 'Aug' },
        { value: 9, name: 'Sep' }, { value: 10, name: 'Oct' },
        { value: 11, name: 'Nov' }, { value: 12, name: 'Dec' }
    ];

    months.forEach(month => {
        const option = document.createElement('option');
        option.value = month.value;
        option.textContent = month.name;
        monthSelect.appendChild(option);
    });

    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 5; i++) { // Show current year and 4 past years
        const year = currentYear - i;
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
}

async function updateSalesReport(month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Format dates to YYYY-MM-DD for API
    const format = (date) => date.toISOString().split('T')[0];
    const formattedStartDate = format(startDate);
    const formattedEndDate = format(endDate);

    fetchTopSellingItem(formattedStartDate, formattedEndDate);
    fetchMonthlySalesReport(formattedStartDate, formattedEndDate);
}

async function fetchTopSellingItem(startDate, endDate) {
    const url = `${API_URL}/api/sales/top-item?startDate=${startDate}&endDate=${endDate}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const topSellingItemContainer = document.getElementById('topSellingItem');

        if (data.success && data.topItem) {
            const item = data.topItem;
            topSellingItemContainer.innerHTML = `
                <h3>Top Selling Item (${new Date(startDate).toLocaleString('en-US', { month: 'long', year: 'numeric' })})</h3>
                <p><strong>${item._id}</strong> sold <strong>${item.totalQuantitySold}</strong> units for a total revenue of <strong>RM ${item.totalRevenue.toFixed(2)}</strong></p>
            `;
        } else {
            topSellingItemContainer.innerHTML = `<p>No top selling item found for ${new Date(startDate).toLocaleString('en-US', { month: 'long', year: 'numeric' })}.</p>`;
        }
    } catch (error) {
        console.error('Error fetching top selling item:', error);
        document.getElementById('topSellingItem').innerHTML = '<p>Error loading top selling item.</p>';
    }
}

async function fetchSalesReport() {
    // This function now fetches all-time sales data
    const url = `${API_URL}/api/sales/items`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const salesReportContainer = document.getElementById('salesReport');

        if (data.success) {
            renderSalesReport(data.salesData);
        } else {
            console.error('Failed to fetch sales report:', data.error);
            salesReportContainer.innerHTML = '<p>Failed to load sales report.</p>';
        }
    } catch (error) {
        console.error('Error fetching sales report:', error);
        salesReportContainer.innerHTML = '<p>Error loading sales report.</p>';
    }
}

function renderSalesReport(salesData) {
    const salesReportContainer = document.getElementById('salesReport');

    if (salesData.length === 0) {
        salesReportContainer.innerHTML = '<p>No sales data found.</p>';
        return;
    }

    let salesHTML = `
        <h3>All-Time Item Sales</h3>
        <table class="sales-table">
            <thead>
                <tr>
                    <th>Item Name</th>
                    <th>Quantity Sold</th>
                    <th>Total Revenue (RM)</th>
                </tr>
            </thead>
            <tbody>
    `;

    salesData.forEach(item => {
        salesHTML += `
            <tr>
                <td>${item._id}</td>
                <td>${item.totalQuantitySold}</td>
                <td>RM ${item.totalRevenue.toFixed(2)}</td>
            </tr>
        `;
    });

    salesHTML += `
            </tbody>
        </table>
    `;

    salesReportContainer.innerHTML = salesHTML;
}

async function fetchMonthlySalesReport(startDate, endDate) {
    const url = `${API_URL}/api/sales/monthly?startDate=${startDate}&endDate=${endDate}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const monthlySalesReportContainer = document.getElementById('monthlySalesReport');

        if (data.success) {
            renderMonthlySalesReport(data.monthlySales, startDate);
        } else {
            console.error('Failed to fetch monthly sales report:', data.error);
            monthlySalesReportContainer.innerHTML = '<p>Failed to load monthly sales report.</p>';
        }
    } catch (error) {
        console.error('Error fetching monthly sales report:', error);
        monthlySalesReportContainer.innerHTML = '<p>Error loading monthly sales report.</p>';
    }
}

function renderMonthlySalesReport(monthlySales, startDate) {
    const monthlySalesReportContainer = document.getElementById('monthlySalesReport');

    if (monthlySales.length === 0) {
        monthlySalesReportContainer.innerHTML = `<p>No monthly sales data found for ${new Date(startDate).toLocaleString('en-US', { month: 'long', year: 'numeric' })}.</p>`;
        return;
    }

    let monthlyHTML = `<h3>Monthly Sales Overview for ${new Date(startDate).toLocaleString('en-US', { month: 'long', year: 'numeric' })}</h3>`;

    monthlySales.forEach(monthData => {
        const monthName = new Date(monthData._id.year, monthData._id.month - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
        monthlyHTML += `
            <div class="monthly-sales-card">
                <h4>${monthName}</h4>
                <p>Total Revenue: <strong>RM ${monthData.totalMonthlyRevenue.toFixed(2)}</strong></p>
        `;

        if (monthData.topSellingItem) {
            monthlyHTML += `
                <p>Top Selling Item: <strong>${monthData.topSellingItem.name}</strong> (${monthData.topSellingItem.quantity} units, RM ${monthData.topSellingItem.revenue.toFixed(2)})</p>
            `;
        } else {
            monthlyHTML += '<p>No top selling item for this month.</p>';
        }

        monthlyHTML += `
                <h5>Items Sold:</h5>
                <ul>
        `;

        monthData.monthlyItems.forEach(item => {
            monthlyHTML += `<li>${item.name}: ${item.quantity} units (RM ${item.revenue.toFixed(2)})</li>`;
        });

        monthlyHTML += `
                </ul>
            </div>
        `;
    });

    monthlySalesReportContainer.innerHTML = monthlyHTML;
}