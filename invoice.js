/* ==========================================================================
   invoice.js
   Invoice generation and sales-history support for the Sales Conversion
   Channel. Persisted under localStorage key 'cp_invoices'. Used by
   shop_online.html (creation), order_history.html (farmer view) and
   staff_portal.html (staff Sales History view).

   Non-repudiation note: invoice numbers, timestamps and a simple content
   checksum are recorded so that a given invoice's contents can later be
   verified not to have been altered after the fact within this browser's
   storage. This is NOT cryptographic signing (see mini-dissertation,
   Section 12.3.1) -- it is an honest, lightweight illustration of the same
   principle, appropriate to a client-only prototype with no backend.
   ========================================================================== */

/** Simple non-cryptographic checksum so an invoice's integrity can be spot-checked later. */
function simpleChecksum(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash).toString(16).toUpperCase();
}

function getInvoices() {
    try {
        return JSON.parse(localStorage.getItem('cp_invoices')) || [];
    } catch (e) {
        return [];
    }
}

function saveInvoices(list) {
    localStorage.setItem('cp_invoices', JSON.stringify(list));
}

/**
 * Builds and persists an invoice from the current cart. Also decrements
 * stock for each line item via decrementStock() in products-data.js.
 * Returns the created invoice object.
 */
function generateInvoice(cart, farmerName, farmerPhone, paymentMethod) {
    const now = new Date();
    const invoices = getInvoices();
    const invoiceNo = 'CPC-INV-' + now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') + '-' +
        String(invoices.length + 1).padStart(4, '0');

    const items = cart.map(item => {
        const name = item.name || item.product || 'Unnamed Product';
        const price = parseFloat(item.price) || 0;
        const qty = parseInt(item.quantity || item.qty) || 1;
        return { name, price, quantity: qty, lineTotal: +(price * qty).toFixed(2) };
    });
    const subtotal = +items.reduce((sum, i) => sum + i.lineTotal, 0).toFixed(2);

    const invoice = {
        invoiceNo: invoiceNo,
        farmerName: farmerName || 'Walk-in / Unnamed Farmer',
        farmerPhone: farmerPhone || 'Not provided',
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

    invoices.unshift(invoice);
    saveInvoices(invoices);

    // Reduce stock for each purchased line, if the shared product store is available on this page.
    if (typeof decrementStock === 'function') {
        items.forEach(i => decrementStock(i.name, i.quantity));
    }

    return invoice;
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
        recorded contents to be spot-checked for alteration within this browser; it is not a substitute for
        cryptographic signing in a production deployment.
    </div>
</body></html>`;
}

/** Opens the invoice in a new tab/window, ready to view or print-to-PDF via the browser's own print dialog. */
function viewInvoice(invoiceNo) {
    const inv = getInvoices().find(i => i.invoiceNo === invoiceNo);
    if (!inv) { alert('Invoice not found.'); return; }
    const win = window.open('', '_blank');
    win.document.write(renderInvoiceHTML(inv));
    win.document.close();
}

/** Downloads the invoice as a standalone HTML file (opens/prints correctly in any browser, no extra libraries required). */
function downloadInvoiceHTML(invoiceNo) {
    const inv = getInvoices().find(i => i.invoiceNo === invoiceNo);
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
function downloadInvoicePDF(invoiceNo) {
    const inv = getInvoices().find(i => i.invoiceNo === invoiceNo);
    if (!inv) { alert('Invoice not found.'); return; }

    if (typeof window.jspdf === 'undefined') {
        alert('PDF library did not load (are you offline?). Downloading as HTML instead -- open it and use your browser\'s Print > Save as PDF option.');
        downloadInvoiceHTML(invoiceNo);
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
function emailInvoice(invoiceNo) {
    const inv = getInvoices().find(i => i.invoiceNo === invoiceNo);
    if (!inv) { alert('Invoice not found.'); return; }

    const itemLines = inv.items.map(i => `  - ${i.name}  x${i.quantity}  @ $${i.price.toFixed(2)}  = $${i.lineTotal.toFixed(2)}`).join('\n');
    const body =
`CP Chemicals Pvt Ltd - Invoice ${inv.invoiceNo}
Date: ${inv.date} ${inv.time}
Status: ${inv.status}
Payment Method: ${inv.paymentMethod}

Billed To: ${inv.farmerName}
Contact: ${inv.farmerPhone}

Items:
${itemLines}

Total: $${inv.total.toFixed(2)}

This invoice will be presented upon collection of goods at your selected CP Chemicals branch.
Integrity reference (non-repudiation checksum): ${inv.checksum}

-- Sent from the CP Chemicals Dual-Channel System. This is a demonstration prototype; no attachment
   is included because static hosting cannot send email server-side. Please keep this message, or
   use the Download Invoice option on the site, as your record.`;

    const subject = `CP Chemicals Invoice ${inv.invoiceNo}`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
}

function markInvoiceCollected(invoiceNo) {
    const invoices = getInvoices();
    const idx = invoices.findIndex(i => i.invoiceNo === invoiceNo);
    if (idx > -1) {
        invoices[idx].status = 'Collected';
        saveInvoices(invoices);
    }
}
