/* ==========================================================================
   news-data.js (TIER 2 -- Firestore-backed, NEW shared module)
   CP Chemicals Newsroom articles. The original 3 articles were each a
   hand-built, uniquely-formatted static HTML page (anniversary_story.html,
   wheat_guide.html, sustainability_update.html) linked from a hardcoded card
   on news.html -- meaningfully more custom than a simple blog post, so a
   straight "flatten it into one big text field" migration would have thrown
   away real formatting work.

   Instead: this module stores the CARD metadata for ALL articles (badge,
   date, title, excerpt) in Firestore, editable from manage_news.html. The 3
   original articles keep their existing hand-built pages exactly as they
   are (via a `legacyUrl` field the card links to instead of the dynamic
   viewer). Every NEW article added from here on gets its full body stored
   in Firestore too, and is read by the new news_article.html?id=... viewer
   -- so publishing a new article never again requires building a new HTML
   page by hand.

   Persisted in the Firestore 'news_articles' collection.
   ========================================================================== */

const DEFAULT_NEWS_ARTICLES = [
    { badge: 'Announcement', date: 'April 2026', title: 'Celebrating 20 Years of Growth',
      excerpt: 'Join us as we reflect on two decades of supporting Zimbabwean farmers with quality chemicals and expert advice.',
      content: '', legacyUrl: 'anniversary_story.html', order: 1 },
    { badge: 'Agronomy Guide', date: 'March 2026', title: 'Preparing for the Winter Wheat Season',
      excerpt: 'Our experts share the top 5 mistakes to avoid during the initial planting phase this year to maximize your yield.',
      content: '', legacyUrl: 'wheat_guide.html', order: 2 },
    { badge: 'Sustainability', date: 'February 2026', title: 'New Eco-Friendly Packaging',
      excerpt: 'CP Chemicals is moving towards sustainable distribution with our new recyclable container initiative launching this quarter.',
      content: '', legacyUrl: 'sustainability_update.html', order: 3 }
];

let _newsSeedDone = false;

async function seedNewsIfEmpty() {
    if (_newsSeedDone) return;
    const { db, collection, getDocs, addDoc } = window.CPFirebase;
    const snap = await getDocs(collection(db, 'news_articles'));
    if (snap.empty) {
        for (const a of DEFAULT_NEWS_ARTICLES) {
            await addDoc(collection(db, 'news_articles'), a);
        }
        console.log('[news-data] Seeded', DEFAULT_NEWS_ARTICLES.length, 'default news articles.');
    }
    _newsSeedDone = true;
}

/** All articles, newest/most-relevant order first (by `order`, ascending -- lower = shown first). */
async function getNewsArticles() {
    const { db, collection, getDocs } = window.CPFirebase;
    await seedNewsIfEmpty();
    const snap = await getDocs(collection(db, 'news_articles'));
    const list = [];
    snap.forEach(d => list.push({ firestoreId: d.id, ...d.data() }));
    list.sort((a, b) => (a.order || 0) - (b.order || 0));
    return list;
}

/** One article by its Firestore document id (used by news_article.html?id=...). */
async function getNewsArticleById(firestoreId) {
    const { db, doc, getDoc } = window.CPFirebase;
    const snap = await getDoc(doc(db, 'news_articles', firestoreId));
    if (!snap.exists()) return null;
    return { firestoreId: snap.id, ...snap.data() };
}

/** Adds a new article. New articles always get a dynamic viewer page (no legacyUrl). */
/**
 * Extracts a YouTube video ID from any common share/watch URL format and returns a proper
 * embeddable URL. Staff paste the normal link they'd copy from YouTube (watch?v=... or youtu.be/...);
 * a raw watch-page URL cannot be used directly in an <iframe>, only the /embed/ form can. Returns
 * null for anything that isn't a recognised YouTube URL, so the caller can fall back to a plain link.
 */
function getYouTubeEmbedUrl(url) {
    if (!url) return null;
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return `https://www.youtube.com/embed/${match[1]}`;
    }
    return null;
}

async function addNewsArticle(badge, title, excerpt, content, date, image = null, videoUrl = null) {
    const { db, collection, addDoc } = window.CPFirebase;
    const existing = await getNewsArticles();
    const nextOrder = existing.length > 0 ? Math.min(...existing.map(a => a.order || 0)) - 1 : 1; // new articles appear first
    const article = { badge, title, excerpt, content, image, videoUrl,
        date: date || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), legacyUrl: null, order: nextOrder };
    await addDoc(collection(db, 'news_articles'), article);
    return article;
}

async function updateNewsArticle(firestoreId, fields) {
    const { db, doc, updateDoc } = window.CPFirebase;
    await updateDoc(doc(db, 'news_articles', firestoreId), fields);
}

async function deleteNewsArticle(firestoreId) {
    const { db, doc, deleteDoc } = window.CPFirebase;
    await deleteDoc(doc(db, 'news_articles', firestoreId));
}
