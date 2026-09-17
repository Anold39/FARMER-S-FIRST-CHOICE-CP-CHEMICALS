/* ==========================================================================
   products-data.js (TIER 2 -- Firestore-backed)
   Replaces the Tier 1 localStorage version with the SAME function names used
   throughout the site (getProducts, findProductByName, findProductByQueryShared,
   decrementStock, getStockStatus, importProductsFromCSV) so every calling page
   only needs `await` added at each call site, not a redesign.

   Key architectural change from Tier 1, not just a storage swap: Tier 1's
   saveProducts(list) replaced the ENTIRE product list on every write, which is
   fine for a single-browser prototype but unsafe once multiple staff share one
   real database -- two agronomists editing different products at the same
   moment could silently overwrite each other's change. Firestore is used here
   the way it's meant to be: each write (decrementStock, a CSV row update, a
   manual stock edit) targets only the one document it changes.

   Requires firebase-init.js to have already run on this page (loaded first),
   so window.CPFirebase is available.
   ========================================================================== */

const DEFAULT_PRODUCTS = [
    { name: "CP Maize Booster",           category: "Fertilizer",    unitSize: "50kg Bag", price: 35.00, stock: 42, image: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=80", description: "High-yield top dressing fertilizer for maize and cereal crops.", keywords: ["maize booster","booster","top dressing","fertilizer","yield booster","yellowing leaves","yellowish","yellow"] },
    { name: "Termi-Kill 500",              category: "Insecticide",   unitSize: "1 Litre",   price: 12.50, stock: 30, image: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=80", description: "Advanced termite control solution for subterranean and crop pests.", keywords: ["termite","termites","termi-kill","subterranean","white ants"] },
    { name: "CP-Glyphosate Max",           category: "Herbicide",     unitSize: "5 Litre",   price: 45.00, stock: 18, image: "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=80", description: "Total systemic non-selective weed control for land clearing.", keywords: ["glyphosate","land clearing","total weed","non-selective","weed control"] },
    { name: "Livestock Dip",               category: "Vet Care",      unitSize: "5 Litre",   price: 55.00, stock: 15, image: "https://images.unsplash.com/photo-1622383529357-37b2701b911a?w=80", description: "Tick and parasite protection dip for cattle and livestock.", keywords: ["dip","livestock","tick","ticks","parasite","cattle"] },
    { name: "Veggie Master",               category: "Fertilizer",    unitSize: "1 Litre",   price: 8.00,  stock: 60, image: "https://images.unsplash.com/photo-1594751175394-47a7f4571958?w=80", description: "Horticulture liquid feed nutrient formulation for vegetables.", keywords: ["veggie master","horticulture","liquid feed","vegetable feed","nutrients"] },
    { name: "CP Maize Seed (SC719)",       category: "Seeds",         unitSize: "10kg Bag",  price: 28.00, stock: 25, image: "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=80", description: "Drought resistant hybrid maize seed variety for high yield.", keywords: ["maize seed","sc719","hybrid seed","seed","planting seed"] },
    { name: "CP Knapsack Sprayer",         category: "Hardware",      unitSize: "Each",      price: 22.00, stock: 12, image: "https://images.unsplash.com/photo-1512149177596-f817c7ef5d4c?w=80", description: "16L Manual pump knapsack sprayer for chemical application.", keywords: ["knapsack","sprayer","pump","hardware","equipment"] },
    { name: "Copper Oxychloride",          category: "Fungicide",     unitSize: "500g",      price: 10.00, stock: 34, image: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=80", description: "Preventative fungicide for vegetable blights and fungal spots.", keywords: ["copper oxychloride","copper spray","fungal spots","preventative fungicide"] },
    { name: "Protective Gumboots",         category: "PPE",           unitSize: "Pair",      price: 15.00, stock: 20, image: "https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=80", description: "Heavy duty rubber safety gumboots for field workers.", keywords: ["gumboots","boots","ppe","protective","safety boots"] },
    { name: "Rat-Ban Pellets",             category: "Pest Control",  unitSize: "100g",      price: 3.50,  stock: 50, image: "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?w=80", description: "Single feed rodenticide bait for farm and store rats.", keywords: ["rat","rats","rodent","rodents","rat-ban","mice"] },
    { name: "SuperGrass Herbicide",        category: "Herbicide",     unitSize: "1 Litre",   price: 15.00, stock: 27, image: "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=80", description: "Effective against broadleaf weeds & grass in maize crops.", keywords: ["supergrass","grass","broadleaf weeds","maize weeds"] },
    { name: "BorerStrike 20EC",            category: "Insecticide",   unitSize: "1 Litre",   price: 22.50, stock: 9,  image: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=80", description: "Targets stalk borers & stem chewers effectively.", keywords: ["borer","stalk borer","stem borer","borerstrike","stem chewers"] },
    { name: "FungiCure Max",               category: "Fungicide",     unitSize: "1 Litre",   price: 18.00, stock: 22, image: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=80", description: "Broad-spectrum systemic fungicide for leaf spots & rust.", keywords: ["fungicure","leaf spot","fungal spots","rust","systemic fungicide"] },
    { name: "ArmyGuard Pro",               category: "Insecticide",   unitSize: "1 Litre",   price: 25.00, stock: 0,  image: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=80", description: "Fast-acting contact insecticide specifically for fall armyworm.", keywords: ["armyworm","fall armyworm","armyguard","caterpillar"] },
    { name: "AphidKill 500",               category: "Insecticide",   unitSize: "500ml",     price: 14.50, stock: 31, image: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=80", description: "Controls aphids, whiteflies, & sap-suckers.", keywords: ["aphid","aphids","whiteflies","sap-suckers","aphidkill"] },
    { name: "BlightShield Copper",         category: "Fungicide",     unitSize: "1kg Bag",   price: 20.00, stock: 16, image: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=80", description: "Copper-based preventative spray for blights on tomatoes & potatoes.", keywords: ["blight","early blight","late blight","blightshield","tomatoes blight"] },
    { name: "Tobacco Gold Fungicide",      category: "Fungicide",     unitSize: "1 Litre",   price: 30.00, stock: 11, image: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=80", description: "Specialized formulation for tobacco diseases like sore shin & spot.", keywords: ["tobacco","sore shin","tobacco gold","tobacco disease"] },
    { name: "Cotton Protect 360",          category: "Insecticide",   unitSize: "1 Litre",   price: 27.50, stock: 8,  image: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=80", description: "Combats bollworms & stainers in cotton crops.", keywords: ["cotton","bollworm","stainers","cotton protect"] },
    { name: "WeedClear Selective",         category: "Herbicide",     unitSize: "1 Litre",   price: 16.00, stock: 24, image: "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=80", description: "Selective post-emergence weed control for cereal crops.", keywords: ["weedclear","selective herbicide","post-emergence","cereal weeds"] },
    { name: "MildewFree Systemic",         category: "Fungicide",     unitSize: "500ml",     price: 19.50, stock: 19, image: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=80", description: "Eradicates powdery mildew & white mold.", keywords: ["mildew","powdery mildew","white mold","mildewfree"] },
    { name: "Nematode-X Soil Drench",      category: "Pest Control",  unitSize: "1 Litre",   price: 32.00, stock: 6,  image: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=80", description: "Soil nematicide treatment for healthy root systems.", keywords: ["nematode","root knot","galls","nematicide","nematode-x"] },
    { name: "Cutworm Buster",              category: "Insecticide",   unitSize: "500ml",     price: 13.00, stock: 28, image: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=80", description: "Surface spray for nocturnal cutworm control during emergence.", keywords: ["cutworm","nocturnal","seedling cut","cutworm buster"] },
    { name: "RedSpider MiteKill",          category: "Insecticide",   unitSize: "500ml",     price: 21.00, stock: 14, image: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=80", description: "Targeted miticide for red spider mites in horticulture.", keywords: ["red spider","spider mite","miticide","mitekill"] },
    { name: "RustStop Cereal Spray",       category: "Fungicide",     unitSize: "1 Litre",   price: 24.00, stock: 17, image: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=80", description: "Engineered fungicide for wheat & cereal rust prevention.", keywords: ["ruststop","wheat rust","cereal rust","wheat spray"] },
    { name: "Soybean Nodul-Boost",         category: "Fertilizer",    unitSize: "1 Litre",   price: 12.00, stock: 21, image: "https://images.unsplash.com/photo-1594751175394-47a7f4571958?w=80", description: "Inoculant & foliar spray for nitrogen fixing in legumes.", keywords: ["soybean","nodul-boost","inoculant","legume","nitrogen fixing"] },
    { name: "Tomato Fruitworm Defense",    category: "Insecticide",   unitSize: "500ml",     price: 17.50, stock: 3,  image: "https://images.unsplash.com/photo-1628352081506-83c43123ed6d?w=80", description: "Protects tomatoes & veggies from fruit borers and worms.", keywords: ["fruitworm","tomato worm","fruit borer","tomato defense"] },
    { name: "NutriGro Folia-Feed",         category: "Fertilizer",    unitSize: "1 Litre",   price: 10.00, stock: 26, image: "https://images.unsplash.com/photo-1594751175394-47a7f4571958?w=80", description: "Liquid micro-nutrient booster for fast crop stress recovery.", keywords: ["nutrigro","foliar feed","micro-nutrient","crop stress"] },
    { name: "Soil-Clean Pre-Emergent",     category: "Herbicide",     unitSize: "2 Litre",   price: 28.00, stock: 13, image: "https://images.unsplash.com/photo-1589923188900-85dae523342b?w=80", description: "Pre-emergent soil spray to inhibit weed seeds before planting.", keywords: ["pre-emergent","soil-clean","weed seeds","pre planting"] }
];

let _seedCheckDone = false;

async function seedProductsIfEmpty() {
    if (_seedCheckDone) return;
    const { db, collection, getDocs, addDoc } = window.CPFirebase;
    const snap = await getDocs(collection(db, 'products'));
    if (snap.empty) {
        console.log('[products-data] Firestore products collection is empty -- seeding from DEFAULT_PRODUCTS...');
        for (const p of DEFAULT_PRODUCTS) {
            await addDoc(collection(db, 'products'), p);
        }
        console.log('[products-data] Seeding complete:', DEFAULT_PRODUCTS.length, 'products.');
    }
    _seedCheckDone = true;
}

async function getProducts() {
    const { db, collection, getDocs } = window.CPFirebase;
    await seedProductsIfEmpty();
    const snap = await getDocs(collection(db, 'products'));
    const products = [];
    snap.forEach(docSnap => {
        products.push({ firestoreId: docSnap.id, ...docSnap.data() });
    });
    return products;
}

async function findProductByName(name) {
    const { db, collection, query, where, getDocs } = window.CPFirebase;
    await seedProductsIfEmpty();
    const q = query(collection(db, 'products'), where('name', '==', name));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { firestoreId: d.id, ...d.data() };
}

async function findProductByQueryShared(searchQuery) {
    const qLower = (searchQuery || "").toLowerCase().trim();
    const products = await getProducts();
    return products.find(item =>
        (item.keywords || []).some(k => qLower.includes(k.toLowerCase()) || k.toLowerCase().includes(qLower)) ||
        item.name.toLowerCase().includes(qLower) ||
        (item.description || "").toLowerCase().includes(qLower)
    ) || null;
}

async function decrementStock(name, qty) {
    const { db, doc, updateDoc } = window.CPFirebase;
    const product = await findProductByName(name);
    if (!product) return null;
    const newStock = Math.max(0, (parseInt(product.stock) || 0) - (parseInt(qty) || 0));
    await updateDoc(doc(db, 'products', product.firestoreId), { stock: newStock });
    return { ...product, stock: newStock };
}

async function updateProductStock(firestoreId, newStock) {
    const { db, doc, updateDoc } = window.CPFirebase;
    await updateDoc(doc(db, 'products', firestoreId), { stock: parseInt(newStock) || 0 });
}

function getStockStatus(stock) {
    const s = parseInt(stock) || 0;
    if (s <= 0) return { label: "Out of Stock", cssClass: "stock-out" };
    if (s <= 10) return { label: "Low Stock (" + s + ")", cssClass: "stock-low" };
    return { label: "In Stock (" + s + ")", cssClass: "stock-ok" };
}

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

async function importProductsFromCSV(csvText) {
    const { db, collection, doc, updateDoc, addDoc } = window.CPFirebase;
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return { updated: 0, added: 0, errors: ["CSV appears to be empty or missing a header row."] };

    const header = parseCSVLine(lines[0]).map(h => h.toLowerCase());
    const nameIdx = header.indexOf('name');
    const catIdx = header.indexOf('category');
    const sizeIdx = header.indexOf('unitsize');
    const priceIdx = header.indexOf('price');
    const stockIdx = header.indexOf('stock');
    const descIdx = header.indexOf('description');
    const keywordsIdx = header.indexOf('keywords');

    if (nameIdx === -1 || priceIdx === -1 || stockIdx === -1) {
        return { updated: 0, added: 0, errors: ["CSV header must include at least: name, price, stock (category, unitSize, description, keywords are optional)."] };
    }

    let updated = 0, added = 0;
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        const name = cols[nameIdx];
        if (!name) { errors.push(`Row ${i + 1}: missing product name, skipped.`); continue; }
        const price = parseFloat(cols[priceIdx]);
        const stock = parseInt(cols[stockIdx]);
        if (isNaN(price) || isNaN(stock)) { errors.push(`Row ${i + 1} ("${name}"): price/stock must be numeric, skipped.`); continue; }

        // Keywords within one CSV cell are semicolon-separated (not comma-separated, since commas
        // already separate CSV columns) -- e.g. a cell containing: yellow leaves;wilting;chlorosis
        const newKeywords = (keywordsIdx > -1 && cols[keywordsIdx])
            ? cols[keywordsIdx].split(';').map(k => k.trim().toLowerCase()).filter(k => k)
            : [];

        const existing = await findProductByName(name);
        if (existing) {
            const fields = { price, stock };
            if (catIdx > -1 && cols[catIdx]) fields.category = cols[catIdx];
            if (sizeIdx > -1 && cols[sizeIdx]) fields.unitSize = cols[sizeIdx];
            if (descIdx > -1 && cols[descIdx]) fields.description = cols[descIdx];
            // Keywords are MERGED (added to, not replaced) -- this is deliberate: it lets staff extend
            // an existing product's diagnostic matches (e.g. add "chlorosis" as another way farmers might
            // describe "yellowing leaves") by uploading just the new term, without needing to know or
            // retype every keyword already on file.
            if (newKeywords.length > 0) {
                const merged = Array.from(new Set([...(existing.keywords || []), ...newKeywords]));
                fields.keywords = merged;
            }
            await updateDoc(doc(db, 'products', existing.firestoreId), fields);
            updated++;
        } else {
            await addDoc(collection(db, 'products'), {
                name: name,
                category: catIdx > -1 && cols[catIdx] ? cols[catIdx] : "General",
                unitSize: sizeIdx > -1 && cols[sizeIdx] ? cols[sizeIdx] : "Each",
                price: price,
                stock: stock,
                image: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=80",
                description: descIdx > -1 && cols[descIdx] ? cols[descIdx] : "",
                keywords: Array.from(new Set([name.toLowerCase(), ...newKeywords]))
            });
            added++;
        }
    }

    return { updated, added, errors };
}
