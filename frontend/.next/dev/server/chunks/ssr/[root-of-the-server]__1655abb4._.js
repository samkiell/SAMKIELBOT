module.exports = [
"[externals]/axios [external] (axios, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("axios");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/frontend/lib/api.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "controlBot",
    ()=>controlBot,
    "deleteBot",
    ()=>deleteBot,
    "deployBot",
    ()=>deployBot,
    "getDeploymentById",
    ()=>getDeploymentById,
    "getDeployments",
    ()=>getDeployments,
    "getUpdateHistory",
    ()=>getUpdateHistory,
    "login",
    ()=>login,
    "register",
    ()=>register,
    "updateBot",
    ()=>updateBot,
    "updateDeployment",
    ()=>updateDeployment,
    "updateProfile",
    ()=>updateProfile,
    "verifyToken",
    ()=>verifyToken
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$axios__$5b$external$5d$__$28$axios$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/axios [external] (axios, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$axios__$5b$external$5d$__$28$axios$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$axios__$5b$external$5d$__$28$axios$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
const API_URL = ("TURBOPACK compile-time value", "http://localhost:5000/api") || "http://localhost:5000/api";
const api = __TURBOPACK__imported__module__$5b$externals$5d2f$axios__$5b$external$5d$__$28$axios$2c$__esm_import$29$__["default"].create({
    baseURL: API_URL
});
// Add token to requests
api.interceptors.request.use((config)=>{
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("🟢 Attached token to request:", config.url);
    } else {
        console.warn("⚠️ No token found for request:", config.url);
    }
    return config;
}, (error)=>{
    console.error("❌ Request error:", error);
    return Promise.reject(error);
});
// Handle response errors
api.interceptors.response.use((response)=>response, (error)=>{
    console.error("🚨 Response error:", error.response?.status, error.response?.data);
    // Only logout on 401 if it's not a login/register request and not the verify endpoint
    if (error.response?.status === 401 && !error.config.url.includes("/auth/login") && !error.config.url.includes("/auth/register") && !error.config.url.includes("/auth/verify")) {
        console.warn("🔴 Unauthorized (401). Clearing session...");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
    }
    // Show toast for network errors
    if (!error.response) {
        // Network error - show toast
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    }
    return Promise.reject(error);
});
const register = async (userData)=>{
    const response = await api.post("/auth/register", userData);
    return response.data.data;
};
const login = async (userData)=>{
    const response = await api.post("/auth/login", userData);
    return response.data.data;
};
const verifyToken = async ()=>{
    const response = await api.get("/auth/verify");
    return response.data.data;
};
const updateProfile = async (profileData)=>{
    const response = await api.put("/auth/profile", profileData);
    return response.data.data;
};
const deployBot = async (deployData)=>{
    const response = await api.post("/deploy/create", deployData);
    return response.data.server || response.data.data; // Adjusted to backend response structure
};
const getDeployments = async ()=>{
    const response = await api.get("/deploy");
    return response.data.data || response.data; // Adjust based on controller response structure (backend sends successResponse(res, deployments))
};
const updateDeployment = async (id, updateData)=>{
    const response = await api.put(`/deploy/${id}`, updateData);
    return response.data.data;
};
const getDeploymentById = async (id)=>{
    const response = await api.get(`/deploy/${id}/status`); // Adjusted path to use getDeploymentStatus
    return response.data;
};
const controlBot = async (id, action)=>{
    const response = await api.post(`/deploy/${id}/control`, {
        action
    }); // start, stop, restart, kill
    return response.data;
};
const deleteBot = async (id)=>{
    const response = await api.delete(`/deploy/${id}`);
    return response.data;
};
const updateBot = async (updateData)=>{
    const response = await api.post("/update", updateData);
    return response.data.data;
};
const getUpdateHistory = async (deploymentId)=>{
    const response = await api.get(`/update/${deploymentId}`);
    return response.data.data;
};
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/frontend/pages/deploy.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "default",
    ()=>DeployPage
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$head$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/head.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/router.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/node_modules/next/link.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/api.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/auth.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__ = __turbopack_context__.i("[project]/frontend/node_modules/lucide-react/dist/esm/icons/arrow-left.js [ssr] (ecmascript) <export default as ArrowLeft>");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2d$hot$2d$toast__$5b$external$5d$__$28$react$2d$hot$2d$toast$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/react-hot-toast [external] (react-hot-toast, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$react$2d$hot$2d$toast__$5b$external$5d$__$28$react$2d$hot$2d$toast$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2d$hot$2d$toast__$5b$external$5d$__$28$react$2d$hot$2d$toast$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
;
;
;
;
function DeployPage() {
    const [formData, setFormData] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])({
        botName: "",
        botNumber: ""
    });
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])("");
    const [deployment, setDeployment] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [deploymentStatus, setDeploymentStatus] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])("idle"); // idle, deploying, success
    const { user, loading: authLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$auth$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const handleChange = (e)=>{
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };
    const handleSubmit = async (e)=>{
        e.preventDefault();
        setLoading(true);
        setError("");
        setDeploymentStatus("deploying");
        try {
            const deploymentData = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["deployBot"])(formData);
            setDeployment(deploymentData);
            __TURBOPACK__imported__module__$5b$externals$5d2f$react$2d$hot$2d$toast__$5b$external$5d$__$28$react$2d$hot$2d$toast$2c$__esm_import$29$__["default"].success("Bot deployment started!");
            // Poll for deployment status
            pollDeploymentStatus(deploymentData._id);
        } catch (error) {
            setError(error.response?.data?.error || "Deployment failed");
            __TURBOPACK__imported__module__$5b$externals$5d2f$react$2d$hot$2d$toast__$5b$external$5d$__$28$react$2d$hot$2d$toast$2c$__esm_import$29$__["default"].error("Deployment failed. Please try again.");
            setLoading(false);
            setDeploymentStatus("idle");
        }
    };
    const pollDeploymentStatus = async (deploymentId)=>{
        const pollInterval = setInterval(async ()=>{
            try {
                const deploymentData = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$api$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["getDeploymentById"])(deploymentId);
                // Check for 'installing' or 'running' status. Even 'installing' is a success for 'deployment start'.
                // But if we want to wait for running:
                if (deploymentData.status === "running" || deploymentData.status === "installing") {
                    setDeployment(deploymentData);
                    setDeploymentStatus("success");
                    setLoading(false);
                    clearInterval(pollInterval);
                    __TURBOPACK__imported__module__$5b$externals$5d2f$react$2d$hot$2d$toast__$5b$external$5d$__$28$react$2d$hot$2d$toast$2c$__esm_import$29$__["default"].success("Server created successfully!");
                } else if (deploymentData.status === "failed") {
                    const errorMsg = deploymentData.errorMessage || "Deployment failed. Please try again.";
                    setError(errorMsg);
                    setDeploymentStatus("idle");
                    setLoading(false);
                    clearInterval(pollInterval);
                    __TURBOPACK__imported__module__$5b$externals$5d2f$react$2d$hot$2d$toast__$5b$external$5d$__$28$react$2d$hot$2d$toast$2c$__esm_import$29$__["default"].error(errorMsg);
                }
            } catch (error) {
                console.error("Error polling deployment status:", error);
            }
        }, 5000); // Poll every 5 seconds
        // Stop polling after 10 minutes
        setTimeout(()=>{
            clearInterval(pollInterval);
            if (deploymentStatus !== "success") {
                setError("Deployment timed out. Please check your dashboard.");
                setDeploymentStatus("idle");
                setLoading(false);
            }
        }, 600000); // 10 minutes
    };
    if (authLoading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"
            }, void 0, false, {
                fileName: "[project]/frontend/pages/deploy.js",
                lineNumber: 95,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/frontend/pages/deploy.js",
            lineNumber: 94,
            columnNumber: 7
        }, this);
    }
    if (!user) {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        router.push("/login");
        return null;
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$head$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("title", {
                    children: "Deploy Bot - 𝕊𝔸𝕄𝕂𝕀𝔼𝕃 𝔹𝕆𝕋"
                }, void 0, false, {
                    fileName: "[project]/frontend/pages/deploy.js",
                    lineNumber: 111,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/pages/deploy.js",
                lineNumber: 110,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("main", {
                className: "container mx-auto px-4 pt-20 pb-8 md:pb-16 max-w-2xl",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "mb-6",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                            href: "/dashboard",
                            className: "inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$arrow$2d$left$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__ArrowLeft$3e$__["ArrowLeft"], {
                                    size: 20,
                                    className: "mr-2"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/pages/deploy.js",
                                    lineNumber: 121,
                                    columnNumber: 13
                                }, this),
                                "Back to Dashboard"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/pages/deploy.js",
                            lineNumber: 117,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/pages/deploy.js",
                        lineNumber: 116,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "text-center mb-8",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h1", {
                                className: "text-3xl md:text-4xl font-bold mb-4",
                                children: "Deploy New Bot"
                            }, void 0, false, {
                                fileName: "[project]/frontend/pages/deploy.js",
                                lineNumber: 128,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                className: "text-gray-600 dark:text-gray-400 text-lg",
                                children: "Configure and deploy your WhatsApp bot to get started"
                            }, void 0, false, {
                                fileName: "[project]/frontend/pages/deploy.js",
                                lineNumber: 131,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/pages/deploy.js",
                        lineNumber: 127,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-gray-700/40 p-8",
                        children: [
                            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6",
                                children: error
                            }, void 0, false, {
                                fileName: "[project]/frontend/pages/deploy.js",
                                lineNumber: 139,
                                columnNumber: 13
                            }, this),
                            deploymentStatus === "idle" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("form", {
                                onSubmit: handleSubmit,
                                className: "space-y-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                className: "block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300",
                                                children: "Bot Name"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/pages/deploy.js",
                                                lineNumber: 147,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                type: "text",
                                                name: "botName",
                                                value: formData.botName,
                                                onChange: handleChange,
                                                className: "w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200",
                                                placeholder: "My Awesome Bot",
                                                required: true
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/pages/deploy.js",
                                                lineNumber: 150,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/pages/deploy.js",
                                        lineNumber: 146,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                className: "block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300",
                                                children: "WhatsApp Bot Number"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/pages/deploy.js",
                                                lineNumber: 162,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                type: "text",
                                                name: "botNumber",
                                                value: formData.botNumber,
                                                onChange: handleChange,
                                                className: "w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200",
                                                placeholder: "Enter international WhatsApp number (e.g., 1234567890)",
                                                pattern: "^\\d{10,15}$",
                                                title: "Enter a valid international WhatsApp number (10-15 digits)",
                                                required: true
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/pages/deploy.js",
                                                lineNumber: 165,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                className: "text-xs text-gray-500 dark:text-gray-400 mt-1",
                                                children: "Enter the full international number without + or spaces"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/pages/deploy.js",
                                                lineNumber: 176,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/pages/deploy.js",
                                        lineNumber: 161,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "flex space-x-4 pt-4",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/dashboard",
                                                className: "flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 text-center",
                                                children: "Cancel"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/pages/deploy.js",
                                                lineNumber: 182,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                type: "submit",
                                                disabled: loading,
                                                className: "flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200",
                                                children: loading ? "Deploying..." : "Deploy Bot"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/pages/deploy.js",
                                                lineNumber: 188,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/pages/deploy.js",
                                        lineNumber: 181,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/pages/deploy.js",
                                lineNumber: 145,
                                columnNumber: 13
                            }, this),
                            deploymentStatus === "deploying" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "text-center py-8",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/pages/deploy.js",
                                        lineNumber: 201,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                        className: "text-xl font-semibold mb-2",
                                        children: "Deploying your bot..."
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/pages/deploy.js",
                                        lineNumber: 202,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                        className: "text-gray-600 dark:text-gray-400",
                                        children: "This may take a few minutes. Please wait while we set up your WhatsApp bot."
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/pages/deploy.js",
                                        lineNumber: 205,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/pages/deploy.js",
                                lineNumber: 200,
                                columnNumber: 13
                            }, this),
                            deploymentStatus === "success" && deployment && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "text-center py-8",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "bg-green-100 dark:bg-green-900/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                            className: "w-8 h-8 text-green-600",
                                            fill: "none",
                                            stroke: "currentColor",
                                            viewBox: "0 0 24 24",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                strokeLinecap: "round",
                                                strokeLinejoin: "round",
                                                strokeWidth: 2,
                                                d: "M5 13l4 4L19 7"
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/pages/deploy.js",
                                                lineNumber: 221,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/pages/deploy.js",
                                            lineNumber: 215,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/pages/deploy.js",
                                        lineNumber: 214,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                        className: "text-xl font-semibold mb-4",
                                        children: "Bot Deployed Successfully!"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/pages/deploy.js",
                                        lineNumber: 229,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                className: "text-sm text-gray-600 dark:text-gray-400 mb-2",
                                                children: [
                                                    "Server is ",
                                                    deployment.status,
                                                    ". Check dashboard for details."
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/frontend/pages/deploy.js",
                                                lineNumber: 233,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "flex gap-2 justify-center",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>router.push("/dashboard"),
                                                    className: "bg-indigo-600 text-white px-4 py-2 rounded",
                                                    children: "Go to Dashboard"
                                                }, void 0, false, {
                                                    fileName: "[project]/frontend/pages/deploy.js",
                                                    lineNumber: 237,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/frontend/pages/deploy.js",
                                                lineNumber: 236,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/frontend/pages/deploy.js",
                                        lineNumber: 232,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                        onClick: ()=>router.push("/dashboard"),
                                        className: "bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200",
                                        children: "Go to Dashboard"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/pages/deploy.js",
                                        lineNumber: 245,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/pages/deploy.js",
                                lineNumber: 213,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/pages/deploy.js",
                        lineNumber: 137,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                className: "text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2",
                                children: "Deployment Information"
                            }, void 0, false, {
                                fileName: "[project]/frontend/pages/deploy.js",
                                lineNumber: 257,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("ul", {
                                className: "text-blue-800 dark:text-blue-200 space-y-1 text-sm",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                        children: "• Your bot will be deployed with the latest stable configuration"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/pages/deploy.js",
                                        lineNumber: 261,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                        children: "• Deployment may take a few minutes to complete"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/pages/deploy.js",
                                        lineNumber: 264,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                        children: "• You can monitor the status from your dashboard"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/pages/deploy.js",
                                        lineNumber: 265,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                        children: "• Make sure your WhatsApp number is verified"
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/pages/deploy.js",
                                        lineNumber: 266,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/frontend/pages/deploy.js",
                                lineNumber: 260,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/pages/deploy.js",
                        lineNumber: 256,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/pages/deploy.js",
                lineNumber: 114,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/pages/deploy.js",
        lineNumber: 109,
        columnNumber: 5
    }, this);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1655abb4._.js.map