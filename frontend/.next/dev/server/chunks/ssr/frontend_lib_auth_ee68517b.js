module.exports = [
"[project]/frontend/lib/auth.js [ssr] (ecmascript, next/dynamic entry, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/ssr/frontend_lib_auth_8bedf662.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/frontend/lib/auth.js [ssr] (ecmascript, next/dynamic entry)");
    });
});
}),
];