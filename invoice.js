/* ==========================================================================
   invoice.js (TIER 2 -- Firestore-backed)
   Invoice generation and sales-history support for the Sales Conversion
   Channel. Persisted in the Firestore 'invoices' collection, each document
   carrying a `uid` field tying it to the authenticated farmer who purchased
   it -- this is what makes order history genuinely personal and visible
   across devices, rather than per-browser as in Tier 1.

   Requires the farmer to be logged in (Firebase Auth, via firebase-init.js's
   registerFarmer/loginFarmer) before generateInvoice() will do anything --
   an invoice with no real owner isn't meaningful non-repudiation evidence,
   so this is enforced here rather than left to each calling page to remember.

   Non-repudiation note: invoice numbers, timestamps and a simple content
   checksum are recorded so that a given invoice's contents can later be
   verified not to have been altered after the fact. This is NOT cryptographic
   signing (see mini-dissertation, Section 12.3.1) -- it is an honest,
   lightweight illustration of the same principle, appropriate to a prototype
   with no backend server of its own (Firestore's own document history and
   Security Rules are the real integrity boundary here, not this checksum).
   ========================================================================== */

function simpleChecksum(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash).toString(16).toUpperCase();
}

/** Returns the currently logged-in farmer's Firebase user, or null if nobody is logged in. */
function getCurrentFarmer() {
    return window.CPFirebase.auth.currentUser;
}

/**
 * Builds and persists an invoice from the current cart, under the logged-in
 * farmer's uid. Also decrements stock for each line item via decrementStock()
 * in products-data.js. Returns the created invoice object, or null (with an
 * alert shown) if nobody is logged in -- callers should check for null.
 */
async function generateInvoice(cart, farmerName, farmerPhone, paymentMethod) {
    const user = getCurrentFarmer();
    if (!user) {
        alert('Please log in or register before completing checkout, so your order can be saved to your account and be visible on any device.');
        return null;
    }

    const { db, collection, addDoc } = window.CPFirebase;
    const now = new Date();
    // Timestamp + short random suffix rather than a sequential count -- avoids reading the whole
    // invoices collection just to number one new invoice, and avoids two farmers checking out at
    // the same moment ever being assigned the same invoice number.
    const invoiceNo = 'CPC-INV-' + now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') + '-' +
        now.getTime().toString().slice(-6) +
        Math.floor(Math.random() * 90 + 10);

    const items = cart.map(item => {
        const name = item.name || item.product || 'Unnamed Product';
        const price = parseFloat(item.price) || 0;
        const qty = parseInt(item.quantity || item.qty) || 1;
        return { name, price, quantity: qty, lineTotal: +(price * qty).toFixed(2) };
    });
    const subtotal = +items.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2);

    const invoice = {
        uid: user.uid,
        invoiceNo: invoiceNo,
        farmerName: farmerName || user.displayName || 'Walk-in / Unnamed Farmer',
        farmerPhone: farmerPhone || window.CPFirebase.syntheticEmailToPhone(user.email) || 'Not provided',
        items: items,
        subtotal: subtotal,
        total: subtotal,
        paymentMethod: paymentMethod,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        timestamp: now.toISOString(),
        status: 'Awaiting Collection'
    };
    invoice.checksum = simpleChecksum(JSON.stringify({ invoiceNo, items, subtotal, timestamp: invoice.timestamp }));

    await addDoc(collection(db, 'invoices'), invoice);

    // Reduce stock for each purchased line. Now that shop_online.html loads firebase-init.js as part
    // of this migration, this succeeds for real (previously it failed gracefully -- see the console
    // warning this same try/catch produced before Cart/Invoices was migrated).
    if (typeof decrementStock === 'function') {
        for (const i of items) {
            try {
                await decrementStock(i.name, i.quantity);
            } catch (err) {
                console.warn(`[invoice.js] Could not decrement stock for "${i.name}".`, err);
            }
        }
    }

    return invoice;
}

/** All invoices belonging to the currently logged-in farmer (order_history.html). Returns [] if not logged in. */
async function getMyInvoices() {
    const user = getCurrentFarmer();
    if (!user) return [];
    const { db, collection, query, where, getDocs } = window.CPFirebase;
    const q = query(collection(db, 'invoices'), where('uid', '==', user.uid));
    const snap = await getDocs(q);
    const list = [];
    snap.forEach(d => list.push({ firestoreId: d.id, ...d.data() }));
    list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    return list;
}

/** ALL invoices across every farmer (sales_history.html, staff-only page already gated by sessionStorage). */
async function getAllInvoices() {
    const { db, collection, getDocs } = window.CPFirebase;
    const snap = await getDocs(collection(db, 'invoices'));
    const list = [];
    snap.forEach(d => list.push({ firestoreId: d.id, ...d.data() }));
    list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    return list;
}

/** Internal helper: finds one invoice document by its human-readable invoiceNo. */
async function findInvoiceByNo(invoiceNo) {
    const { db, collection, query, where, getDocs } = window.CPFirebase;
    const q = query(collection(db, 'invoices'), where('invoiceNo', '==', invoiceNo));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { firestoreId: d.id, ...d.data() };
}

function escapeHTMLInvoice(str) {
    return String(str == null ? '' : str).replace(/[&<>'"]/g,
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

/** Returns a printable HTML document string for the given invoice. */
function renderInvoiceHTML(inv) {
    const rows = inv.items.map(i => `
        <tr>
            <td>${escapeHTMLInvoice(i.name)}</td>
            <td style="text-align:center;">${i.quantity}</td>
            <td style="text-align:right;">$${i.price.toFixed(2)}</td>
            <td style="text-align:right;">$${i.lineTotal.toFixed(2)}</td>
        </tr>`).join('');

    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Invoice ${escapeHTMLInvoice(inv.invoiceNo)}</title>
<style>
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #222; max-width: 700px; margin: 30px auto; padding: 0 20px; }
    .inv-header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom: 3px solid #2e7d32; padding-bottom: 15px; margin-bottom: 20px; }
    .inv-header h1 { color: #2e7d32; margin: 0 0 4px 0; font-size: 1.5rem; }
    .inv-meta { text-align: right; font-size: 0.85rem; color: #555; }
    .inv-meta b { color: #222; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #2e7d32; color: white; padding: 8px 10px; text-align: left; font-size: 0.85rem; }
    td { padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 0.9rem; }
    .totals { text-align: right; margin-top: 10px; font-size: 1rem; }
    .totals .grand { font-size: 1.3rem; font-weight: bold; color: #2e7d32; }
    .footer-note { margin-top: 30px; padding-top: 15px; border-top: 1px dashed #ccc; font-size: 0.75rem; color: #888; }
    .status-badge { display:inline-block; background:#fff3cd; color:#856404; padding:4px 10px; border-radius:4px; font-size:0.8rem; font-weight:bold; margin-top:6px; }
    @media print { body { margin: 0; } }
</style></head>
<body>
    <div class="inv-header">
        <div>
            <h1>CP Chemicals Pvt Ltd</h1>
            <div style="font-size:0.85rem;color:#555;">Farmers' First Choice</div>
            <div class="status-badge">${escapeHTMLInvoice(inv.status)}</div>
        </div>
        <div class="inv-meta">
            <div><b>Invoice No:</b> ${escapeHTMLInvoice(inv.invoiceNo)}</div>
            <div><b>Date:</b> ${escapeHTMLInvoice(inv.date)} ${escapeHTMLInvoice(inv.time)}</div>
            <div><b>Payment Method:</b> ${escapeHTMLInvoice(inv.paymentMethod)}</div>
        </div>
    </div>

    <div><b>Billed To:</b> ${escapeHTMLInvoice(inv.farmerName)}<br>
    <b>Contact:</b> ${escapeHTMLInvoice(inv.farmerPhone)}</div>

    <table>
        <thead><tr><th>Product</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Unit Price</th><th style="text-align:right;">Line Total</th></tr></thead>
        <tbody>${rows}</tbody>
    </table>

    <div class="totals">
        <div>Subtotal: $${inv.subtotal.toFixed(2)}</div>
        <div class="grand">Total: $${inv.total.toFixed(2)}</div>
    </div>

    <div class="footer-note">
        This invoice will be presented upon collection of goods at your selected CP Chemicals branch.<br>
        Integrity reference (non-repudiation checksum): ${escapeHTMLInvoice(inv.checksum)}<br>
        Generated by the CP Chemicals Dual-Channel System prototype. This checksum allows this invoice's
        recorded contents to be spot-checked for alteration; it is not a substitute for cryptographic
        signing in a production deployment.
    </div>
</body></html>`;
}

/** Opens the invoice in a new tab/window, ready to view or print-to-PDF via the browser's own print dialog. */
async function viewInvoice(invoiceNo) {
    const inv = await findInvoiceByNo(invoiceNo);
    if (!inv) { alert('Invoice not found.'); return; }
    const win = window.open('', '_blank');
    win.document.write(renderInvoiceHTML(inv));
    win.document.close();
}

/** Downloads the invoice as a standalone HTML file (opens/prints correctly in any browser, no extra libraries required). */
async function downloadInvoiceHTML(invoiceNo) {
    const inv = await findInvoiceByNo(invoiceNo);
    if (!inv) { alert('Invoice not found.'); return; }
    const blob = new Blob([renderInvoiceHTML(inv)], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = inv.invoiceNo + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Downloads the invoice as a real PDF using the jsPDF library (loaded via CDN
 * on pages that call this function). Falls back to the HTML download if the
 * library failed to load for any reason (e.g. offline use).
 */
async function downloadInvoicePDF(invoiceNo) {
    const inv = await findInvoiceByNo(invoiceNo);
    if (!inv) { alert('Invoice not found.'); return; }

    if (typeof window.jspdf === 'undefined') {
        alert('PDF library did not load (are you offline?). Downloading as HTML instead -- open it and use your browser\'s Print > Save as PDF option.');
        await downloadInvoiceHTML(invoiceNo);
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 18;

    doc.setFontSize(16); doc.setTextColor(46, 125, 50);
    doc.text('CP Chemicals Pvt Ltd', 14, y);
    doc.setFontSize(9); doc.setTextColor(100);
    y += 6; doc.text("Farmers' First Choice", 14, y);

    doc.setFontSize(10); doc.setTextColor(0);
    y += 10; doc.text(`Invoice No: ${inv.invoiceNo}`, 14, y);
    y += 5; doc.text(`Date: ${inv.date} ${inv.time}`, 14, y);
    y += 5; doc.text(`Payment Method: ${inv.paymentMethod}`, 14, y);
    y += 5; doc.text(`Status: ${inv.status}`, 14, y);
    y += 8; doc.text(`Billed To: ${inv.farmerName}`, 14, y);
    y += 5; doc.text(`Contact: ${inv.farmerPhone}`, 14, y);

    y += 10;
    doc.setFillColor(46, 125, 50); doc.setTextColor(255);
    doc.rect(14, y - 5, 182, 7, 'F');
    doc.text('Product', 16, y); doc.text('Qty', 120, y); doc.text('Unit Price', 140, y); doc.text('Line Total', 170, y);
    doc.setTextColor(0);

    inv.items.forEach(item => {
        y += 7;
        doc.text(String(item.name).substring(0, 45), 16, y);
        doc.text(String(item.quantity), 122, y);
        doc.text('$' + item.price.toFixed(2), 140, y);
        doc.text('$' + item.lineTotal.toFixed(2), 170, y);
    });

    y += 12;
    doc.setFontSize(12); doc.setTextColor(46, 125, 50);
    doc.text(`Total: $${inv.total.toFixed(2)}`, 140, y);

    y += 12;
    doc.setFontSize(7.5); doc.setTextColor(130);
    doc.text('This invoice will be presented upon collection of goods at your selected CP Chemicals branch.', 14, y);
    y += 4; doc.text(`Integrity reference (non-repudiation checksum): ${inv.checksum}`, 14, y);

    doc.save(inv.invoiceNo + '.pdf');
}

/**
 * Builds a mailto: link pre-filled with the invoice as readable text in the
 * email body, and opens the farmer's own email client to send it. Static
 * hosting (GitHub Pages) cannot send email itself, so this is the honest
 * client-side equivalent: no attachment is possible via mailto, but the full
 * invoice contents are included as text so nothing is lost.
 */
/**
 * Sends the invoice as a real email via EmailJS (a free, client-side email-sending service --
 * no backend server needed, which is why it works on static GitHub Pages hosting). This replaces
 * the earlier mailto: draft approach: mailto only works if the visitor's browser has a real,
 * configured default mail app, which isn't reliably true, and produces no actual sent email --
 * just an unsent draft the visitor still has to send themselves.
 *
 * Farmers don't have a real email address on file (their account uses a synthetic one purely for
 * Firebase Auth), so this asks for a destination address each time rather than assuming one.
 */
async function emailInvoice(invoiceNo) {
    const inv = await findInvoiceByNo(invoiceNo);
    if (!inv) { alert('Invoice not found.'); return; }

    const toEmail = prompt('Enter the email address to send this invoice to:', '');
    if (!toEmail) return; // cancelled

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail.trim())) {
        alert('Please enter a valid email address (e.g. name@example.com).');
        return;
    }

    if (typeof emailjs === 'undefined') {
        alert('The email service did not load (are you offline?). Downloading the invoice instead -- you can attach or forward that file yourself.');
        await downloadInvoiceHTML(invoiceNo);
        return;
    }

    const itemLines = inv.items.map(i => `${i.name}  x${i.quantity}  @ $${i.price.toFixed(2)}  = $${i.lineTotal.toFixed(2)}`).join('\n');

    const templateParams = {
        to_email: toEmail.trim(),
        email: toEmail.trim(),        // also fills the template's "Reply To" field
        name: 'CP Chemicals Pvt Ltd', // fills the template's "From Name" field
        invoice_number: inv.invoiceNo,
        invoice_date: `${inv.date} ${inv.time}`,
        status: inv.status,
        payment_method: inv.paymentMethod,
        farmer_name: inv.farmerName,
        farmer_phone: inv.farmerPhone,
        items_list: itemLines,
        subtotal: inv.subtotal.toFixed(2),
        total: inv.total.toFixed(2),
        checksum: inv.checksum
    };

    try {
        await emailjs.send('service_b974b2m', 'template_ot7b5xf', templateParams);
        alert(`Invoice emailed to ${toEmail.trim()}.`);
    } catch (err) {
        console.error('[invoice.js] EmailJS send failed:', err);
        alert('Could not send the email right now. Downloading the invoice instead -- you can attach or forward that file yourself.');
        await downloadInvoiceHTML(invoiceNo);
    }
}

async function markInvoiceCollected(invoiceNo) {
    const { db, doc, updateDoc } = window.CPFirebase;
    const inv = await findInvoiceByNo(invoiceNo);
    if (!inv) return;
    await updateDoc(doc(db, 'invoices', inv.firestoreId), { status: 'Collected' });
}
