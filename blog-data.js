/* ==========================================================================
   blog-data.js (TIER 2 -- Firestore-backed, NEW shared module)
   Agri-Talk Hub posts. This is genuinely PUBLIC content -- anyone visiting
   agritalk.html should see the same posts regardless of which device or
   browser they're using. Tier 2's earlier migrations (Products, Cart/
   Invoices, Escalations/Diagnosis) never touched this, so it was still
   silently stuck on localStorage: a post an agronomist "published" from one
   browser was invisible everywhere else, which defeats the entire point of
   a public news/advisory feed. This closes that gap the same way the
   others were closed.

   Persisted in the Firestore 'blog_posts' collection.
   ========================================================================== */

/** All published posts, newest first. */
async function getBlogPosts() {
    const { db, collection, getDocs } = window.CPFirebase;
    const snap = await getDocs(collection(db, 'blog_posts'));
    const list = [];
    snap.forEach(d => list.push({ firestoreId: d.id, ...d.data() }));
    list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    return list;
}

/** Publishes a new post. image is an optional data-URL string (from a FileReader), same as Tier 1. */
async function publishBlogPost(title, content, image = null) {
    const { db, collection, addDoc } = window.CPFirebase;
    const now = new Date();
    const post = {
        id: 'POST-' + now.getTime().toString(36).toUpperCase(),
        title,
        content,
        image,
        date: now.toLocaleDateString(),
        timestamp: now.toISOString()
    };
    await addDoc(collection(db, 'blog_posts'), post);
    return post;
}

/**
 * Deletes one post by its own stable id (not array position -- Tier 1 used the post's index in
 * the list, which silently deletes the WRONG post if two staff members are managing posts at
 * the same time and the list has shifted between one staff member's page load and their click).
 */
async function deleteBlogPostById(id) {
    const { db, collection, query, where, getDocs, doc, deleteDoc } = window.CPFirebase;
    const q = query(collection(db, 'blog_posts'), where('id', '==', id));
    const snap = await getDocs(q);
    if (snap.empty) return;
    await deleteDoc(doc(db, 'blog_posts', snap.docs[0].id));
}
