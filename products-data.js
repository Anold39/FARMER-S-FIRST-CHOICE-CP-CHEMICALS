/* ==========================================================================
   products-data.js
   Shared product catalogue for CP Chemicals dual-channel system.
   Single source of truth for products.html (Sales Conversion Channel) and
   test-advisor.html (Agronomic Advisory Channel), so both read/write the
   same stock figures instead of maintaining two separate hardcoded lists.
   Persisted under localStorage key 'cp_products'. Seeded once from
   DEFAULT_PRODUCTS on first load; thereafter localStorage is authoritative.
   ========================================================================== */

const DEFAULT_PRODUCTS = [
    { id: 1,  name: "CP Maize Booster",           category: "Fertilizer",    unitSize: "50kg Bag", price: 35.00, stock: 42, image: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=80", description: "High-yield top dressing fertilizer for maize and cereal crops.", keywords: ["maize booster","booster","top dressing","fertilizer","yield booster","yellowing leaves","yellowish","yellow"] },
    { id: 2,  name: "Termi-Kill 500",              category: "Insecticide",   unitSize: "1 Litre",   price: 12.50, stock: 30, image: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=80", description: "Advanced termite control solution for subterranean and crop pests.", keywords: ["termite","termites","termi-kill","subterranean","white ants"] },
    { id: 3,  name: "CP-Glyphosate Max",           category: "Herbicide",     unitSize: "5 Litre",   price: 45.00, stock: 18, image: "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=80", description: "Total systemic non-selective weed control for land clearing.", keywords: ["glyphosate","land clearing","total weed","non-selective","weed control"] },
    { id: 4,  name: "Livestock Dip",               category: "Vet Care",      unitSize: "5 Litre",   price: 55.00, stock: 15, image: "https://images.unsplash.com/photo-1622383529357-37b2701b911a?w=80", description: "Tick and parasite protection dip for cattle and livestock.", keywords: ["dip","livestock","tick","ticks","parasite","cattle"] },
    { id: 5,  name: "Veggie Master",               category: "Fertilizer",    unitSize: "1 Litre",   price: 8.00,  stock: 60, image: "https://images.unsplash.com/photo-1594751175394-47a7f4571958?w=80", description: "Horticulture liquid feed nutrient formulation for vegetables.", keywords: ["veggie master","horticulture","liquid feed","vegetable feed","nutrients"] },
    { id: 6,  name: "CP Maize Seed (SC719)",       category: "Seeds",         unitSize: "10kg Bag",  price: 28.00, stock: 25, image: "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=80", description: "Drought resistant hybrid maize seed variety for high yield.", keywords: ["maize seed","sc719","hybrid seed","seed","planting seed"] },
    { id: 7,  name: "CP Knapsack Sprayer",         category: "Hardware",      unitSize: "Each",      price: 22.00, stock: 12, image: "https://images.unsplash.com/photo-1512149177596-f817c7ef5d4c?w=80", description: "16L Manual pump knapsack sprayer for chemical application.", keywords: ["knapsack","sprayer","pump","hardware","equipment"] },
    { id: 8,  name: "Copper Oxychloride",          category: "Fungicide",     unitSize: "500g",      price: 10.00, stock: 34, image: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=80", description: "Preventative fungicide for vegetable blights and fungal spots.", keywords: ["copper oxychloride","copper spray","fungal spots","preventative fungicide"] },
    { id: 9,  name: "Protective Gumboots",         category: "PPE",           unitSize: "Pair",      price: 15.00, stock: 20, image: "https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=80", description: "Heavy duty rubber safety gumboots for field workers.", keywords: ["gumboots","boots","ppe","protective","safety boots"] },
    { id: 10, name: "Rat-Ban Pellets",             category: "Pest Control",  unitSize: "100g",      price: 3.50,  stock: 50, image: "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=80", description: "Single feed rodenticide bait for farm and store rats.", keywords: ["rat","rats","rodent","rodents","rat-ban","mice"] },
    { id: 11, name: "SuperGrass Herbicide",        category: "Herbicide",     unitSize: "1 Litre",   price: 15.00, stock: 27, image: "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=80", description: "Effective against broadleaf weeds & grass in maize crops.", keywords: ["supergrass","grass","broadleaf weeds","maize weeds"] },
    { id: 12, name: "BorerStrike 20EC",            category: "Insecticide",   unitSize: "1 Litre",   price: 22.50, stock: 9,  image: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=80", description: "Targets stalk borers & stem chewers effectively.", keywords: ["borer","stalk borer","stem borer","borerstrike","stem chewers"] },
    { id: 13, name: "FungiCure Max",               category: "Fungicide",     unitSize: "1 Litre",   price: 18.00, stock: 22, image: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=80", description: "Broad-spectrum systemic fungicide for leaf spots & rust.", keywords: ["fungicure","leaf spot","fungal spots","rust","systemic fungicide"] },
    { id: 14, name: "ArmyGuard Pro",               category: "Insecticide",   unitSize: "1 Litre",   price: 25.00, stock: 0,  image: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=80", description: "Fast-acting contact insecticide specifically for fall armyworm.", keywords: ["armyworm","fall armyworm","armyguard","caterpillar"] },
    { id: 15, name: "AphidKill 500",               category: "Insecticide",   unitSize: "500ml",     price: 14.50, stock: 31, image: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=80", description: "Controls aphids, whiteflies, & sap-suckers.", keywords: ["aphid","aphids","whiteflies","sap-suckers","aphidkill"] },
    { id: 16, name: "BlightShield Copper",         category: "Fungicide",     unitSize: "1kg Bag",   price: 20.00, stock: 16, image: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=80", description: "Copper-based preventative spray for blights on tomatoes & potatoes.", keywords: ["blight","early blight","late blight","blightshield","tomatoes blight"] },
    { id: 17, name: "Tobacco Gold Fungicide",      category: "Fungicide",     unitSize: "1 Litre",   price: 30.00, stock: 11, image: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=80", description: "Specialized formulation for tobacco diseases like sore shin & spot.", keywords: ["tobacco","sore shin","tobacco gold","tobacco disease"] },
    { id: 18, name: "Cotton Protect 360",          category: "Insecticide",   unitSize: "1 Litre",   price: 27.50, stock: 8,  image: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=80", description: "Combats bollworms & stainers in cotton crops.", keywords: ["cotton","bollworm","stainers","cotton protect"] },
    { id: 19, name: "WeedClear Selective",         category: "Herbicide",     unitSize: "1 Litre",   price: 16.00, stock: 24, image: "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=80", description: "Selective post-emergence weed control for cereal crops.", keywords: ["weedclear","selective herbicide","post-emergence","cereal weeds"] },
    { id: 20, name: "MildewFree Systemic",         category: "Fungicide",     unitSize: "500ml",     price: 19.50, stock: 19, image: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=80", description: "Eradicates powdery mildew & white mold.", keywords: ["mildew","powdery mildew","white mold","mildewfree"] },
    { id: 21, name: "Nematode-X Soil Drench",      category: "Pest Control",  unitSize: "1 Litre",   price: 32.00, stock: 6,  image: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=80", description: "Soil nematicide treatment for healthy root systems.", keywords: ["nematode","root knot","galls","nematicide","nematode-x"] },
    { id: 22, name: "Cutworm Buster",              category: "Insecticide",   unitSize: "500ml",     price: 13.00, stock: 28, image: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=80", description: "Surface spray for nocturnal cutworm control during emergence.", keywords: ["cutworm","nocturnal","seedling cut","cutworm buster"] },
    { id: 23, name: "RedSpider MiteKill",          category: "Insecticide",   unitSize: "500ml",     price: 21.00, stock: 14, image: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=80", description: "Targeted miticide for red spider mites in horticulture.", keywords: ["red spider","spider mite","miticide","mitekill"] },
    { id: 24, name: "RustStop Cereal Spray",       category: "Fungicide",     unitSize: "1 Litre",   price: 24.00, stock: 17, image: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=80", description: "Engineered fungicide for wheat & cereal rust prevention.", keywords: ["ruststop","wheat rust","cereal rust","wheat spray"] },
    { id: 25, name: "Soybean Nodul-Boost",         category: "Fertilizer",    unitSize: "1 Litre",   price: 12.00, stock: 21, image: "https://images.unsplash.com/photo-1594751175394-47a7f4571958?w=80", description: "Inoculant & foliar spray for nitrogen fixing in legumes.", keywords: ["soybean","nodul-boost","inoculant","legume","nitrogen fixing"] },
    { id: 26, name: "Tomato Fruitworm Defense",    category: "Insecticide",   unitSize: "500ml",     price: 17.50, stock: 3,  image: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=80", description: "Protects tomatoes & veggies from fruit borers and worms.", keywords: ["fruitworm","tomato worm","fruit borer","tomato defense"] },
    { id: 27, name: "NutriGro Folia-Feed",         category: "Fertilizer",    unitSize: "1 Litre",   price: 10.00, stock: 26, image: "https://images.unsplash.com/photo-1594751175394-47a7f4571958?w=80", description: "Liquid micro-nutrient booster for fast crop stress recovery.", keywords: ["nutrigro","foliar feed","micro-nutrient","crop stress"] },
    { id: 28, name: "Soil-Clean Pre-Emergent",     category: "Herbicide",     unitSize: "2 Litre",   price: 28.00, stock: 13, image: "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=80", description: "Pre-emergent soil spray to inhibit weed seeds before planting.", keywords: ["pre-emergent","soil-clean","weed seeds","pre planting"] }
];

/**
 * Returns the current product catalogue. Seeds localStorage from
 * DEFAULT_PRODUCTS on first-ever call so existing prices/descriptions/
 * keywords are preserved exactly as before this feature was added.
 */
function getProducts() {
    let stored = null;
    try {
        stored = JSON.parse(localStorage.getItem('cp_products'));
    } catch (e) {
        stored = null;
    }
    if (!stored || !Array.isArray(stored) || stored.length === 0) {
        saveProducts(DEFAULT_PRODUCTS);
        return DEFAULT_PRODUCTS.slice();
    }
    return stored;
}

function saveProducts(list) {
    localStorage.setItem('cp_products', JSON.stringify(list));
}

function findProductByName(name) {
    const products = getProducts();
    return products.find(p => p.name === name) || null;
}

/**
 * Finds a product by matching free-text against name/description/keywords,
 * mirroring the matching logic previously duplicated inside test-advisor.html.
 */
function findProductByQueryShared(searchQuery) {
    const qLower = (searchQuery || "").toLowerCase().trim();
    const products = getProducts();
    return products.find(item =>
        (item.keywords || []).some(k => qLower.includes(k.toLowerCase()) || k.toLowerCase().includes(qLower)) ||
        item.name.toLowerCase().includes(qLower) ||
        (item.description || "").toLowerCase().includes(qLower)
    ) || null;
}

/** Reduces stock for a product by qty (never below 0). Returns the updated product, or null if not found. */
function decrementStock(name, qty) {
    const products = getProducts();
    const idx = products.findIndex(p => p.name === name);
    if (idx === -1) return null;
    products[idx].stock = Math.max(0, (parseInt(products[idx].stock) || 0) - (parseInt(qty) || 0));
    saveProducts(products);
    return products[idx];
}

/** Returns { label, cssClass } describing stock level for UI badges. */
function getStockStatus(stock) {
    const s = parseInt(stock) || 0;
    if (s <= 0) return { label: "Out of Stock", cssClass: "stock-out" };
    if (s <= 10) return { label: "Low Stock (" + s + ")", cssClass: "stock-low" };
    return { label: "In Stock (" + s + ")", cssClass: "stock-ok" };
}

/**
 * Parses one CSV line respecting double-quoted fields (so a quoted field
 * containing a comma, e.g. "Maize, Soya", is kept as a single value instead
 * of being split apart). Handles escaped "" inside quotes per RFC 4180.
 * A naive line.split(',') was used here previously and silently corrupted
 * any row containing a comma inside a quoted field -- fixed after testing
 * confirmed the corruption (values shifting into the wrong column).
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (inQuotes) {
            if (char === '"') {
                if (line[i + 1] === '"') { current += '"'; i++; }
                else { inQuotes = false; }
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
    }
    result.push(current.trim());
    return result;
}

/**
 * Parses an uploaded CSV (name,category,unitSize,price,stock,description)
 * and merges it into the catalogue: existing products (matched by name) are
 * updated in place; new names are appended. Returns a summary object.
 * Does not touch image/keywords for existing products, so AI-matching and
 * photos are preserved even when staff only re-upload price/stock columns.
 */
function importProductsFromCSV(csvText) {
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return { updated: 0, added: 0, errors: ["CSV appears to be empty or missing a header row."] };

    const header = parseCSVLine(lines[0]).map(h => h.toLowerCase());
    const nameIdx = header.indexOf('name');
    const catIdx = header.indexOf('category');
    const sizeIdx = header.indexOf('unitsize');
    const priceIdx = header.indexOf('price');
    const stockIdx = header.indexOf('stock');
    const descIdx = header.indexOf('description');

    if (nameIdx === -1 || priceIdx === -1 || stockIdx === -1) {
        return { updated: 0, added: 0, errors: ["CSV header must include at least: name, price, stock (category, unitSize, description are optional)."] };
    }

    const products = getProducts();
    let updated = 0, added = 0;
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        const name = cols[nameIdx];
        if (!name) { errors.push(`Row ${i + 1}: missing product name, skipped.`); continue; }
        const price = parseFloat(cols[priceIdx]);
        const stock = parseInt(cols[stockIdx]);
        if (isNaN(price) || isNaN(stock)) { errors.push(`Row ${i + 1} ("${name}"): price/stock must be numeric, skipped.`); continue; }

        const existingIdx = products.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
        if (existingIdx > -1) {
            products[existingIdx].price = price;
            products[existingIdx].stock = stock;
            if (catIdx > -1 && cols[catIdx]) products[existingIdx].category = cols[catIdx];
            if (sizeIdx > -1 && cols[sizeIdx]) products[existingIdx].unitSize = cols[sizeIdx];
            if (descIdx > -1 && cols[descIdx]) products[existingIdx].description = cols[descIdx];
            updated++;
        } else {
            const newId = Math.max(0, ...products.map(p => p.id || 0)) + 1;
            products.push({
                id: newId,
                name: name,
                category: catIdx > -1 && cols[catIdx] ? cols[catIdx] : "General",
                unitSize: sizeIdx > -1 && cols[sizeIdx] ? cols[sizeIdx] : "Each",
                price: price,
                stock: stock,
                image: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=80",
                description: descIdx > -1 && cols[descIdx] ? cols[descIdx] : "",
                keywords: [name.toLowerCase()]
            });
            added++;
        }
    }

    saveProducts(products);
    return { updated, added, errors };
}
