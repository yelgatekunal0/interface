// --- Data & State Management ---
const defaultInventory = [
    { id: '#001', name: 'Amoxicillin 500mg', category: 'Antibiotics', stock: 1200, price: 12.50, status: 'In Stock' },
    { id: '#002', name: 'Paracetamol 650mg', category: 'Analgesics', stock: 450, price: 5.00, status: 'Low' },
    { id: '#003', name: 'Atorvastatin 10mg', category: 'Cardio', stock: 800, price: 18.00, status: 'In Stock' },
    { id: '#004', name: 'Insulin Glargine', category: 'Diabetes', stock: 20, price: 45.00, status: 'Critical' },
    { id: '#005', name: 'Cetirizine 10mg', category: 'Antihistamine', stock: 5000, price: 3.20, status: 'In Stock' },
    { id: '#006', name: 'Metformin 500mg', category: 'Diabetes', stock: 300, price: 8.50, status: 'In Stock' },
    { id: '#007', name: 'Ibuprofen 400mg', category: 'Analgesics', stock: 45, price: 6.00, status: 'Low' }
];

// Load from LocalStorage or use default
let inventoryData = JSON.parse(localStorage.getItem('pharmaCheckInventory')) || defaultInventory;

function saveInventory() {
    localStorage.setItem('pharmaCheckInventory', JSON.stringify(inventoryData));
    updateAnalytics();
}

// --- Global Theme Management ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        const icon = toggleBtn.querySelector('i');
        if (theme === 'light') {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }
}

// Initialize theme on load
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    // Initialize functionality if on app page
    if (document.getElementById('main-app')) {
        initApp();
    }
    // Initialize intro page
    if (document.getElementById('intro-container')) {
        initIntro();
    }
});


// --- Page Specific Logic ---

function initIntro() {
    const enterBtn = document.getElementById('enter-btn');
    if (enterBtn) {
        enterBtn.addEventListener('click', () => {
            document.body.style.opacity = '0';
            setTimeout(() => {
                window.location.href = 'app.html';
            }, 500);
        });
    }
}

function initApp() {
    const mainApp = document.getElementById('main-app');

    // Reveal animation
    mainApp.style.display = 'grid';
    mainApp.style.opacity = '0';
    mainApp.animate([
        { opacity: 0, transform: 'scale(0.98)' },
        { opacity: 1, transform: 'scale(1)' }
    ], { duration: 500, fill: 'forwards', easing: 'ease-out' });

    // Initial Render
    renderInventory(inventoryData);
    updateAnalytics();

    // Setup Event Listeners
    setupNavigation();
    setupChat();
    setupInventoryControls();
    setupScanner();

    // Initial Toast
    setTimeout(() => {
        showToast("System Online. Database Connected.", "success");
    }, 1000);
}

// --- Inventory System ---
function renderInventory(data) {
    const tbody = document.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem;">No medicines found matching your search.</td></tr>';
        return;
    }

    data.forEach(item => {
        const tr = document.createElement('tr');

        // Determine badge class
        let badgeClass = 'success';
        if (item.status === 'Low') badgeClass = 'warning';
        if (item.status === 'Critical') badgeClass = 'danger';

        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>${item.stock.toLocaleString()}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td><span class="badge ${badgeClass}">${item.status}</span></td>
            <td>
                <button class="action-icon edit-btn" onclick="editItem('${item.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="action-icon delete-btn" onclick="deleteItem('${item.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Global functions for inline onclick handlers
window.editItem = function (id) {
    const item = inventoryData.find(i => i.id === id);
    if (item) {
        openModal('edit', item);
    }
};

window.deleteItem = function (id) {
    if (confirm('Are you sure you want to delete this medicine?')) {
        inventoryData = inventoryData.filter(i => i.id !== id);
        saveInventory();
        renderInventory(inventoryData);
        showToast('Item deleted successfully', 'success');
    }
};

// --- Modal System ---
const modal = document.getElementById('action-modal');
const modalForm = document.getElementById('inventory-form');
const modalTitle = document.getElementById('modal-title');
const cancelBtn = document.getElementById('cancel-modal-btn');
const closeBtn = document.getElementById('close-modal-btn');

function setupInventoryControls() {
    const searchInput = document.getElementById('inventory-search');
    const addBtn = document.getElementById('add-stock-btn');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = inventoryData.filter(item =>
                item.name.toLowerCase().includes(query) ||
                item.category.toLowerCase().includes(query) ||
                item.id.toLowerCase().includes(query)
            );
            renderInventory(filtered);
        });
    }

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            openModal('add');
        });
    }

    // Modal Events
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    if (modalForm) {
        modalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleFormSubmit();
        });
    }
}

function openModal(mode, item = null) {
    if (!modal) return;

    modal.classList.remove('hidden');

    if (mode === 'edit' && item) {
        modalTitle.textContent = 'Edit Medicine';
        document.getElementById('item-id').value = item.id;
        document.getElementById('item-name').value = item.name;
        document.getElementById('item-category').value = item.category;
        document.getElementById('item-stock').value = item.stock;
        document.getElementById('item-price').value = item.price;
    } else {
        modalTitle.textContent = 'Add New Medicine';
        modalForm.reset();
        document.getElementById('item-id').value = '';
    }
}

function closeModal() {
    if (modal) modal.classList.add('hidden');
}

function handleFormSubmit() {
    const id = document.getElementById('item-id').value;
    constname = document.getElementById('item-name').value;
    const category = document.getElementById('item-category').value;
    const stock = parseInt(document.getElementById('item-stock').value);
    const price = parseFloat(document.getElementById('item-price').value);

    if (id) {
        // Edit existing
        const index = inventoryData.findIndex(i => i.id === id);
        if (index !== -1) {
            inventoryData[index] = {
                ...inventoryData[index],
                name: document.getElementById('item-name').value,
                category: category,
                stock: stock,
                price: price,
                status: stock < 50 ? (stock < 20 ? 'Critical' : 'Low') : 'In Stock'
            };
            showToast('Medicine updated successfully', 'success');
        }
    } else {
        // Add new
        const newItem = {
            id: '#' + (Math.floor(Math.random() * 9000) + 1000).toString(),
            name: document.getElementById('item-name').value,
            category: category,
            stock: stock,
            price: price,
            status: stock < 50 ? (stock < 20 ? 'Critical' : 'Low') : 'In Stock'
        };
        inventoryData.push(newItem);
        showToast('New medicine added to inventory', 'success');
    }

    saveInventory();
    renderInventory(inventoryData);
    closeModal();
}

// --- Analytics System ---
function updateAnalytics() {
    // Calculate Low Stock
    const lowStockCount = inventoryData.filter(i => i.stock < 50).length;

    // Update DOM
    const lowStockEl = document.querySelector('.stat-card .value.warning');
    if (lowStockEl) {
        lowStockEl.textContent = lowStockCount;
        // Update trend arrow (simulated logic)
        const trendEl = lowStockEl.nextElementSibling;
    }
}

// --- Chat System Agent ---
function setupChat() {
    const chatInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const chatHistory = document.getElementById('chat-history');

    function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Add User Message
        addMessage(text, 'user');
        chatInput.value = '';

        // Show Typing Indicator
        showTyping();

        // Process Agent Logic
        setTimeout(() => {
            removeTyping();
            const response = processAgentQuery(text);
            addMessage(response, 'agent');
        }, 1200);
    }

    if (sendBtn && chatInput) {
        sendBtn.addEventListener('click', handleSend);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSend();
        });
    }
}

function processAgentQuery(query) {
    const lowerQuery = query.toLowerCase();

    // 1. Stock / Inventory specific query
    if (lowerQuery.includes('stock') || lowerQuery.includes('how many') || lowerQuery.includes('have')) {
        // Search for medicine names in query
        const foundItem = inventoryData.find(item => lowerQuery.includes(item.name.toLowerCase()));

        if (foundItem) {
            return `We have **${foundItem.stock}** units of **${foundItem.name}** in stock. Price: $${foundItem.price}. Status: ${foundItem.status}.`;
        }

        if (lowerQuery.includes('low')) {
            const lowItems = inventoryData.filter(i => i.stock < 50).map(i => i.name).join(', ');
            return lowItems ? `The following items are running low: ${lowItems}.` : "All stock levels are healthy.";
        }

        return "I can check stock levels. Please mention the specific medicine name.";
    }

    // 2. Greetings
    if (lowerQuery.includes('hello') || lowerQuery.includes('hi')) {
        return "Hello! I am your Agentic Pharmacy Assistant. I can help you check inventory, analyze sales, or scan prescriptions.";
    }

    // 3. General Fallback
    return "I'm not sure about that. I can help you with Inventory Management, Analytics, or Prescriptions. Try asking 'Do we have Amoxicillin?'";
}

function addMessage(text, sender) {
    const chatHistory = document.getElementById('chat-history');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    // Allow simple HTML/markdown-like bolding
    bubble.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    const meta = document.createElement('div');
    meta.className = 'msg-meta';
    const now = new Date();
    meta.textContent = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    msgDiv.appendChild(bubble);
    msgDiv.appendChild(meta);
    chatHistory.appendChild(msgDiv);

    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function showTyping() {
    const chatHistory = document.getElementById('chat-history');
    removeTyping();

    const msgDiv = document.createElement('div');
    msgDiv.className = 'message agent typing-indicator';
    msgDiv.id = 'typing-indicator';

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.innerHTML = '<div class="typing-dots"><span>.</span><span>.</span><span>.</span></div>';

    msgDiv.appendChild(bubble);
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function removeTyping() {
    const existing = document.getElementById('typing-indicator');
    if (existing) existing.remove();
}


// --- Utility: Toast ---
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'circle-info';
    if (type === 'success') icon = 'circle-check';
    if (type === 'warning') icon = 'triangle-exclamation';
    if (type === 'error') icon = 'circle-xmark';

    toast.innerHTML = `<i class="fa-solid fa-${icon}"></i> <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hiding');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}

// --- Navigation & Other ---
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.view-section');
    const pageTitle = document.getElementById('page-title');
    const sidebar = document.querySelector('.sidebar');

    // Mobile Menu
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');

            // Toggle overlay visibility
            const overlay = document.querySelector('.sidebar-overlay');
            if (overlay) {
                overlay.classList.toggle('show');
            }

            // Toggle body scroll lock
            document.body.classList.toggle('sidebar-open');
        });
    }

    // Overlay Click - Create if doesn't exist
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    // Close sidebar when clicking overlay
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
        document.body.classList.remove('sidebar-open');
    });


    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-view');
            if (!targetId) return;

            // Nav State
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // View State
            sections.forEach(s => {
                s.classList.remove('active');
                if (s.id === targetId) {
                    s.classList.add('active');
                    if (targetId === 'view-analytics') {
                        setTimeout(animateCharts, 100);
                    }
                }
            });

            // Title Update
            if (pageTitle) {
                if (targetId === 'view-chat') pageTitle.textContent = 'Agent Active';
                else if (targetId === 'view-inventory') pageTitle.textContent = 'Inventory Management';
                else if (targetId === 'view-analytics') pageTitle.textContent = 'Performance Analytics';
                else if (targetId === 'view-scanner') pageTitle.textContent = 'Rx Scanner';
            }

            // Close mobile menu
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
                const overlay = document.querySelector('.sidebar-overlay');
                if (overlay) {
                    overlay.classList.remove('show');
                }
                document.body.classList.remove('sidebar-open');
            }
        });
    });

    // Theme Toggle
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleTheme);
    }
}

function animateCharts() {
    const bars = document.querySelectorAll('.bar');
    bars.forEach(bar => {
        const targetHeight = bar.getAttribute('style').match(/height:\s*(\d+%)/)[1];
        bar.style.height = '0%';
        setTimeout(() => {
            bar.classList.add('animate');
            bar.style.height = targetHeight;
        }, 50);
    });
}


function setupScanner() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const scanResult = document.getElementById('scan-result');
    const addToCartBtn = scanResult ? scanResult.querySelector('button') : null;

    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            handleFiles(e.dataTransfer.files);
        });

        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });

        function handleFiles(files) {
            if (files.length > 0) {
                const originalText = dropZone.querySelector('h3').textContent;
                dropZone.querySelector('h3').textContent = "Scanning...";

                setTimeout(() => {
                    dropZone.querySelector('h3').textContent = originalText;
                    if (scanResult) {
                        scanResult.classList.remove('hidden');
                        scanResult.classList.add('glass-panel');
                        scanResult.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 1500);
            }
        }
    }

    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            // Logic: Reduce stock of the detected item (Amoxicillin)
            const item = inventoryData.find(i => i.name.includes('Amoxicillin'));
            if (item) {
                item.stock -= 1;
                saveInventory();
                renderInventory(inventoryData); // Refresh table if visible
                showToast(`Sale Recorded: 1x ${item.name} dispensed.`, 'success');

                // Hide result again
                if (scanResult) scanResult.classList.add('hidden');
            } else {
                showToast('Detected medicine not found in inventory.', 'error');
            }
        });
    }
}
