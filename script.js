// ==========================================
// 1. DATA OBJECTS & GLOBAL STATE
// ==========================================

const branches = [
    { name: "Mount Hampden (HQ)", location: "16km peg Lomagundi Road", phone: "+263777379313", mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3799.9773561017214!2d30.93564557352681!3d-17.745706083203856!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1931a99fac5b6cfb%3A0x8e7777e5179ef1ac!2sCP%20Chemicals%20HQ!5e0!3m2!1sen!2szw!4v1775681934881!5m2!1sen!2szw", agronomist: "Anold" },
    { name: "Mvurwi Branch", location: "Mvurwi Town Center", phone: "+263777379313", mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3814.9154662619635!2d30.853061673585696!3d-17.027816054531367!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x193081922fd03359%3A0x3069ed294bd3678c!2sCP%20Chemicals%20Mvurwi!5e0!3m2!1sen!2szw!4v1775682795230!5m2!1sen!2szw", agronomist: "Simba" },
    { name: "Bindura Branch", location: "Shop 12 Thurlows Avenue", phone: "+263777379313", mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3809.1725230620996!2d31.32948587359558!3d-17.307223162019973!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19303f40a299f027%3A0x132b800a96650fc2!2sCP%20Chemicals%20Bindura!5e0!3m2!1sen!2szw!4v1775759214757!5m2!1sen!2szw", agronomist: "Anold" },
    { name: "Chegutu Branch", location: "CBD, Shop 1, Stand 65, Alexandra Ave, Chegutu", phone: "+263777379313", mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3791.561944468403!2d30.144808073625814!3d-18.13800948501451!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1936b57fed2ea199%3A0x7d5f6057d330f40a!2sCP%20Chemicals%20Chegutu!5e0!3m2!1sen!2szw!4v1775764385121!5m2!1sen!2szw", agronomist: "Simba" },
    { name: "Chinhoyi Branch", location: "Stand 2 Robson Manyika Road. Opposite Municipality/ Behind Edgars", phone: "+263777379313", mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15232.353401618391!2d30.175206268253014!3d-17.359481172772234!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1930b5006dbe471f%3A0x39355a8c7bb0bf14!2sCP%20CHEMICALS%20CHINHOYI!5e0!3m2!1sen!2szw!4v1775764747459!5m2!1sen!2szw", agronomist: "Anold" },
    { name: "Karoi Branch", location: "Stand 6271, Sangorenyati", phone: "+263777379313", mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3819.0677418351397!2d29.703603273578555!3d-16.822995149120317!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1939c107deddf119%3A0xbad2b17a2f13f857!2sCP%20Chemicals%20Karoi%20Branch!5e0!3m2!1sen!2szw!4v1775764930588!5m2!1sen!2szw", agronomist: "Simba" },
    { name: "Granite Side Branch", location: "No. 112 Seke road, Graniteside", phone: "+263777379313", mapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1944501.6911765968!2d29.326255872690524!3d-17.8454373!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1931a3673496e547%3A0xe52f7835a5b13e3b!2sCP%20Chemicals%20Private%20Limited!5e0!3m2!1sen!2szw!4v1775767470907!5m2!1sen!2szw", agronomist: "Mbetsa" },
    { name: "Harare Showground Branch", location: "Stand No. TS 165 1st AvenueOpposite Willdale Bricks, Gate number 2", phone: "+263777379313", mapUrl: "https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d121565.73076703437!2d30.9120858258877!3d-17.79502959102618!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1scp%20chemical%20harare%20showground!5e0!3m2!1sen!2szw!4v1775765749575!5m2!1sen!2szw", agronomist: "Simba" },
    { name: "Masasa Park Branch", location: "Opening Soon", phone: "+263777379313", mapUrl: "To be Advised", agronomist: "Anold" },
];

const agriData = {
    tips: [
        "<h3>Pro Tip: Moisture</h3><p>Ensure soil moisture is at 60% before applying chemicals to ensure better absorption.</p>",
        "<h3>Pro Tip: Wind Speed</h3><p>Never spray when wind exceeds 10km/h to avoid drift into neighboring crops.</p>",
        "<h3>Pro Tip: Water pH</h3><p>Test your water! High pH (alkaline) can neutralize the active ingredients in your herbicides.</p>",
        "<h3>Pro Tip: Nozzle Height</h3><p>Keep your boom at the recommended height (usually 50cm) to get the perfect overlap pattern.</p>"
    ],
    weed: [
        "<h3>Weed ID: Yellow Nutsedge</h3><p>Recognizable by its triangular stem. Best treated with CP-Halt in early growth stages.</p>",
        "<h3>Weed ID: Wandering Jew</h3><p>A fleshy-leaved weed that regrows from tiny stem fragments. Avoid mechanical weeding.</p>",
        "<h3>Weed ID: Black Jack</h3><p>Known for its sticky seeds. Control it before flowering to prevent the seeds from entering your soil bank.</p>",
        "<h3>Weed ID: Couch Grass</h3><p>A persistent perennial with underground rhizomes. Requires a systemic herbicide for total control.</p>"
    ],
    calibrate: [
        "<h3>Calibration: The 100m Test</h3><p>Measure 100m, spray it, and see how much water was used to calculate your 'Litres per Hectare'.</p>",
        "<h3>Calibration: Nozzle Wear</h3><p>Replace nozzles if their output varies by more than 10% from a new one. Worn nozzles waste money!</p>",
        "<h3>Calibration: Constant Speed</h3><p>Whether using a tractor or knapsack, maintaining a steady walking pace is the secret to even coverage.</p>",
        "<h3>Calibration: Pressure Check</h3><p>Fluctuating pressure leads to uneven dosing. Use a pressure regulator for professional results.</p>"
    ]
};

let currentIndices = { tips: 0, weed: 0, calibrate: 0 };

// Utility: HTML Escaping to prevent Script Injection / XSS
function escapeHTML(str) {
    return String(str || '').replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag])
    );
}

// Utility: Helper Promise for FileReader
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}

function getCartFromStorage() {
    const raw = localStorage.getItem('cp_cart');
    return raw ? JSON.parse(raw) : [];
}

let cart = getCartFromStorage();

// ==========================================
// 2. SHOPPING CART & CHECKOUT LOGIC
// ==========================================

function updateCartCount() {
    cart = getCartFromStorage();
    const totalItems = cart.reduce((sum, item) => sum + (parseInt(item.qty || item.quantity) || 1), 0);
    const countElement = document.getElementById('cart-count');
    if (countElement) {
        countElement.innerText = totalItems;
    }
}

function addToCart(name, price, qtyInputId) {
    const quantityInput = document.getElementById(qtyInputId);
    const quantity = parseInt(quantityInput.value);

    if (isNaN(quantity) || quantity <= 0) {
        alert("Please enter a valid quantity of 1 or more.");
        return;
    }

    const existingItemIndex = cart.findIndex(item => item.name === name);

    if (existingItemIndex > -1) {
        cart[existingItemIndex].qty += quantity;
        cart[existingItemIndex].subtotal = cart[existingItemIndex].qty * price;
    } else {
        cart.push({ 
            name: name, 
            price: parseFloat(price), 
            qty: quantity,
            subtotal: parseFloat(price) * quantity 
        });
    }

    localStorage.setItem('CP_CART', JSON.stringify(cart));
    localStorage.setItem('cp_cart', JSON.stringify(cart));
    updateCartCount();
    
    if (document.getElementById('agritalk-cart-items')) {
        updateAgriTalkSidebar();
    }
    
    alert(`${quantity}x ${name} successfully added to your cart!`);
    quantityInput.value = 1;
}

function loadCartPage() {
    const cartTable = document.getElementById('cart-items');
    const totalElement = document.getElementById('cart-total');
    if (!cartTable) return; 

    cart = getCartFromStorage();
    cartTable.innerHTML = ''; 
    let grandTotal = 0;

    if (cart.length === 0) {
        cartTable.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Your cart is empty. Start shopping on the Products page!</td></tr>';
    } else {
        cart.forEach((item, index) => {
            const itemQty = item.qty || item.quantity || 1;
            const subtotal = item.subtotal || (item.price * itemQty);
            grandTotal += subtotal; 
            cartTable.innerHTML += `
                <tr>
                    <td>${escapeHTML(item.name)}</td>
                    <td>$${parseFloat(item.price).toFixed(2)}</td>
                    <td>${itemQty}</td>
                    <td><b>$${parseFloat(subtotal).toFixed(2)}</b></td>
                    <td><button onclick="removeItem(${index})" class="btn-shop" style="background:red; border:none; padding: 5px 10px; cursor:pointer;">Remove</button></td>
                </tr>`;
        });
    }
    if (totalElement) totalElement.innerText = `$${grandTotal.toFixed(2)}`;
}

function removeItem(index) {
    cart.splice(index, 1); 
    localStorage.setItem('CP_CART', JSON.stringify(cart)); 
    localStorage.setItem('cp_cart', JSON.stringify(cart)); 
    loadCartPage(); 
    updateCartCount(); 
}

function emptyCart() {
    if (confirm("Are you sure you want to clear your entire shopping cart?")) {
        localStorage.removeItem('CP_CART');
        localStorage.removeItem('cp_cart');
        cart = []; 

        const cartTableBody = document.querySelector('#cart-items-body') || document.querySelector('tbody');
        if (cartTableBody) {
            cartTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px;">Cart is empty.</td></tr>';
        }

        const totalIDs = ['grand-total-display', 'agritalk-total-display', 'cart-total'];
        totalIDs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerText = "$0.00";
        });

        updateCartCount();
        alert("Your cart has been cleared.");
        location.reload(); 
    }
}

function processCheckout(method) {
    cart = getCartFromStorage();
    if (cart.length === 0) {
        alert("Your cart is empty! Add products first.");
        return;
    }
    const total = document.getElementById('cart-total') ? document.getElementById('cart-total').innerText : "Total";
    
    if (method === 'ecocash') {
        alert(`Initiating EcoCash transaction for ${total}...`);
        window.open("https://ecocash.co.zw/", "_blank");
        completeOrder();
    } else if (method === 'visa') {
        alert("Redirecting to Secured Visa Portal...");
        window.open("https://stripe.com/", "_blank");
        completeOrder();
    } else if (method === 'bank') {
        alert("Redirecting to ZIPIT / Bank Transfer instructions...");
        window.open("https://zimswitch.co.zw/", "_blank");
        completeOrder();
    }
}

function completeOrder() {
    localStorage.removeItem('CP_CART');
    localStorage.removeItem('cp_cart');
    cart = []; 
    updateCartCount();
    alert("Order recorded in our system. Thank you for choosing CP Chemicals.");
    window.location.href = "home.html";
}

// ==========================================
// 3. BRANCHES & MAPS LOGIC
// ==========================================

function loadBranches() {
    const grid = document.getElementById('branchGrid');
    if (!grid) return;
    grid.innerHTML = ''; 

    branches.forEach((branch) => {
        grid.innerHTML += `
            <div class="card">
                <h3>${escapeHTML(branch.name)}</h3>
                <p><i class="fas fa-map-marker-alt"></i> ${escapeHTML(branch.location)}</p>
                <p><i class="fas fa-user-tie"></i> Agronomist: ${escapeHTML(branch.agronomist)}</p>
                <div style="display: flex; gap: 10px; margin-top: 15px; justify-content: center;">
                    <button class="btn-shop" onclick="openMap('${branch.mapUrl}')">
                        <i class="fas fa-map-marked-alt"></i> Open Map
                    </button>
                    <a href="tel:${branch.phone}" class="btn-shop secondary" style="text-decoration: none;">
                        <i class="fas fa-phone-alt"></i> Call
                    </a>
                </div>
            </div>`;
    });
}

function openMap(url) {
    const modal = document.getElementById('mapModal');
    const container = document.getElementById('mapContainer');
    if (modal && container) {
        container.innerHTML = `<iframe src="${url}" width="100%" height="450" style="border:0;" allowfullscreen="" loading="lazy"></iframe>`;
        modal.style.display = "block";
    }
}

function closeMap() {
    const modal = document.getElementById('mapModal');
    if (modal) modal.style.display = "none";
}

// ==========================================
// 4. AGRITALK & BLOG LOGIC
// ==========================================

function updateAgriTalkSidebar() {
    const sidebarItems = document.getElementById('agritalk-cart-items');
    const sidebarTotal = document.getElementById('agritalk-total-display');
    
    if (!sidebarItems) return; 

    cart = getCartFromStorage();
    sidebarItems.innerHTML = '';
    let grandTotal = 0;

    if (cart.length === 0) {
        sidebarItems.innerHTML = '<p style="font-size: 0.9rem; color: #666; text-align:center; padding:10px;">Your cart is empty.</p>';
    } else {
        cart.forEach(item => {
            const itemQty = item.qty || item.quantity || 1;
            const subtotal = item.subtotal || (item.price * itemQty);
            grandTotal += subtotal;
            sidebarItems.innerHTML += `
                <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 8px; border-bottom: 1px dashed #eee; padding-bottom: 5px;">
                    <span><strong>${itemQty}x</strong> ${escapeHTML(item.name)}</span>
                    <span style="color: var(--cp-blue);">$${subtotal.toFixed(2)}</span>
                </div>`;
        });
    }
    if (sidebarTotal) sidebarTotal.innerText = `$${grandTotal.toFixed(2)}`;
}

function openAgri(topic) {
    const display = document.getElementById('agri-display');
    if (!display) return;

    if (agriData[topic]) {
        const contentList = agriData[topic];
        const index = currentIndices[topic];
        
        display.innerHTML = contentList[index]; 
        currentIndices[topic] = (index + 1) % contentList.length; 
        
        display.style.opacity = 0;
        setTimeout(() => {
            display.style.transition = "opacity 0.4s ease-in-out";
            display.style.opacity = 1;
        }, 50);
    } 
    updateAgriTalkSidebar();
}

async function publishPost() {
    const titleInput = document.getElementById('blogTitle');
    const contentInput = document.getElementById('blogContent');
    const fileInput = document.getElementById('blogImage'); 
    
    if (!titleInput || !contentInput) return;

    if (!titleInput.value.trim() || !contentInput.value.trim()) {
        alert("Please provide both a title and expert advice.");
        return;
    }

    let imageData = "";
    if (fileInput && fileInput.files[0]) {
        try {
            imageData = await readFileAsDataURL(fileInput.files[0]);
        } catch (err) {
            alert("Error parsing image file.");
            return;
        }
    }

    const newPost = {
        title: escapeHTML(titleInput.value.trim()),
        content: escapeHTML(contentInput.value.trim()),
        image: imageData,
        date: new Date().toLocaleDateString()
    };

    try {
        let posts = JSON.parse(localStorage.getItem('CP_BLOGS')) || [];
        posts.unshift(newPost);
        localStorage.setItem('CP_BLOGS', JSON.stringify(posts));
        
        alert("Post Published Live to Agri-Talk!");
        titleInput.value = "";
        contentInput.value = "";
        if (fileInput) fileInput.value = "";
        
        if (typeof manageStaffPosts === "function") manageStaffPosts();
    } catch (e) {
        alert("Storage limit reached! Please use a smaller image file.");
    }
}

function loadBlogPosts() {
    const display = document.getElementById('agri-display');
    if (!display) return;
    
    const posts = JSON.parse(localStorage.getItem('CP_BLOGS')) || [];
    
    if (posts.length === 0) {
        display.innerHTML = "<h3>Latest Updates</h3><p>Select a topic or wait for new updates.</p>";
        return;
    }

    let blogHTML = `<h3><i class="fas fa-rss"></i> Latest Updates</h3>`;
    posts.forEach(post => {
        const imgTag = post.image ? `<img src="${post.image}" style="width:100%; max-width:400px; border-radius:8px; margin:10px 0;">` : "";
        blogHTML += `
            <div class="blog-entry" style="border-bottom: 2px solid #eee; margin-bottom: 20px; padding-bottom: 10px;">
                <h4>${post.title}</h4>
                <small>${escapeHTML(post.date)}</small>
                ${imgTag}
                <p>${post.content}</p>
            </div>`;
    });
    display.innerHTML = blogHTML;
}

function proceedToCheckout() {
    cart = getCartFromStorage();
    if (cart.length === 0) {
        alert("Your cart is empty! Please add some products before checking out.");
    } else {
        window.location.href = "shop_online.html";
    }
}

// ==========================================
// 5. STAFF PORTAL LOGIC
// ==========================================

async function submitQuery() {
    const form = document.getElementById('agronomyForm');
    const messageVal = document.getElementById('queryMessage').value.trim();
    if (!messageVal) { alert("Please describe your issue."); return; }

    const btn = form.querySelector('button');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    btn.disabled = true;
    
    const fileInput = form.querySelector('input[type="file"]');
    let imageData = "";
    if (fileInput?.files[0]) {
        try {
            imageData = await readFileAsDataURL(fileInput.files[0]);
        } catch (e) {
            alert("Unable to process the attachment image.");
            btn.innerHTML = 'Submit Case to Agronomy Dept';
            btn.disabled = false;
            return;
        }
    }

    const newQuery = {
        name: escapeHTML(document.getElementById('farmerName').value.trim() || "Anonymous"),
        branch: escapeHTML(document.getElementById('branchSelect').value),
        message: escapeHTML(messageVal),
        image: imageData,
        date: new Date().toLocaleString(),
        status: "New"
    };

    try {
        let allQueries = JSON.parse(localStorage.getItem('CP_QUERIES')) || [];
        allQueries.unshift(newQuery);
        localStorage.setItem('CP_QUERIES', JSON.stringify(allQueries));

        setTimeout(() => {
            alert("Query sent successfully!");
            form.reset();
            btn.innerHTML = 'Submit Case to Agronomy Dept';
            btn.disabled = false;
        }, 800);
    } catch (e) {
        alert("Storage error. The image file may be too large to save locally.");
        btn.innerHTML = 'Submit Case to Agronomy Dept';
        btn.disabled = false;
    }
}

// NOTE: loadFarmerQueries / resolveQuery / deleteQuery used to live here (Tier 1, localStorage).
// They overrode the Firestore versions defined in staff_portal.html, so they were removed.

function manageStaffPosts() {
    const container = document.getElementById('manage-posts-area');
    if (!container) return;
    const posts = JSON.parse(localStorage.getItem('CP_BLOGS')) || [];
    
    if (posts.length === 0) {
        container.innerHTML = "<p style='color:#777;'>No posts available in storage.</p>";
        return;
    }

    let html = "<table style='width:100%; border-collapse: collapse;'>";
    posts.forEach((p, i) => {
        html += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0;"><strong>${p.title}</strong> <br><small style="color:#888;">${p.date}</small></td>
                <td style='text-align:right;'><button onclick='deletePost(${i})' style='background:#dc3545; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;'>Remove</button></td>
            </tr>`;
    });
    container.innerHTML = html + "</table>";
}

function deletePost(i) {
    if (confirm("Delete this post permanently?")) {
        let p = JSON.parse(localStorage.getItem('CP_BLOGS')) || [];
        p.splice(i, 1);
        localStorage.setItem('CP_BLOGS', JSON.stringify(p));
        manageStaffPosts();
    }
}

// ==========================================
// 6. INITIALIZATION & EVENT SYNC
// ==========================================

function setupAudio() {
    const audio = document.getElementById('bgMusic');
    const audioBtn = document.getElementById('toggleAudio');
    if (!audio || !audioBtn) return;
    audioBtn.addEventListener('click', () => {
        if (audio.paused) { audio.play(); audioBtn.innerHTML = '<i class="fas fa-volume-up"></i>'; }
        else { audio.pause(); audioBtn.innerHTML = '<i class="fas fa-volume-mute"></i>'; }
    });
}

function setupStars() {
    const stars = document.querySelectorAll('#ratingSystem i');
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            stars.forEach(s => s.classList.replace('fas', 'far')); 
            for (let i = 0; i <= index; i++) {
                stars[i].classList.replace('far', 'fas');
                stars[i].style.color = 'gold';
            }
        });
    });
}

function initPage() {
    cart = getCartFromStorage();
    updateCartCount();
    setupAudio();

    if (document.getElementById('branchGrid')) loadBranches();
    if (document.getElementById('ratingSystem')) setupStars();
    if (document.getElementById('cart-items')) loadCartPage();
    
    if (document.getElementById('agri-display')) {
        loadBlogPosts();
        updateAgriTalkSidebar(); 
    }
    
    if (document.getElementById('manage-posts-area')) manageStaffPosts();
}

document.addEventListener('DOMContentLoaded', initPage);

window.addEventListener('pageshow', updateCartCount);
window.addEventListener('storage', updateCartCount);

window.addEventListener('click', (event) => {
    const modal = document.getElementById('mapModal');
    if (event.target == modal) closeMap();
});