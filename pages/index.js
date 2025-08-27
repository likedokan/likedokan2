import React, { useEffect, useState, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, collection, query, where, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';

// IMPORTANT: These global variables are provided by the canvas environment.
// DO NOT modify them.
const __app_id = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const __firebase_config = typeof __firebase_config !== 'undefined' ? __firebase_config : '{}';
const __initial_auth_token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Context for managing Firebase and User state
const AppContext = createContext();

const AppProvider = ({ children }) => {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [user, setUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    useEffect(() => {
        try {
            const firebaseConfig = JSON.parse(__firebase_config);
            const app = initializeApp(firebaseConfig);
            const firestoreDb = getFirestore(app);
            const firebaseAuth = getAuth(app);
            setDb(firestoreDb);
            setAuth(firebaseAuth);

            const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
                if (currentUser) {
                    setUser(currentUser);
                    const userRef = doc(firestoreDb, "artifacts", __app_id, "users", currentUser.uid);
                    const userSnap = await getDoc(userRef);
                    if (!userSnap.exists()) {
                        await setDoc(userRef, {
                            displayName: currentUser.displayName || "অতিথি",
                            profilePictureUrl: currentUser.photoURL || 'https://placehold.co/300x300/a0aec0/ffffff?text=User',
                            points: 0,
                            createdAt: serverTimestamp(),
                        });
                    }
                } else {
                    setUser(null);
                }
                setIsAuthReady(true);
            });

            const initAuth = async () => {
                try {
                    if (__initial_auth_token) {
                        await signInWithCustomToken(firebaseAuth, __initial_auth_token);
                    } else {
                        await signInAnonymously(firebaseAuth);
                    }
                } catch (error) {
                    console.error("Error with initial auth:", error);
                    // Fallback to anonymous sign-in if custom token fails
                    await signInAnonymously(firebaseAuth);
                }
            };
            initAuth();
            return () => unsubscribe();
        } catch (error) {
            console.error("Firebase initialization failed:", error);
            setIsAuthReady(true);
        }
    }, []);

    return (
        <AppContext.Provider value={{ db, auth, user, isAuthReady }}>
            {children}
        </AppContext.Provider>
    );
};

const useAppContext = () => {
    return useContext(AppContext);
};

const DEFAULT_PROFILE_PIC_URL = 'https://placehold.co/300x300/a0aec0/ffffff?text=User';

const esc = (str = "") => {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
};

const TaskCard = ({ task, onTaskClick }) => {
    const categoryColor = (cat) => {
        const c = (cat || "").toLowerCase();
        if (c.includes("youtube")) return "bg-red-100 text-red-700 border-red-200";
        if (c.includes("facebook")) return "bg-blue-100 text-blue-700 border-blue-200";
        if (c.includes("promo")) return "bg-purple-100 text-purple-700 border-purple-200";
        if (c.includes("short") || c.includes("video")) return "bg-amber-100 text-amber-700 border-amber-200";
        if (c.includes("bonus")) return "bg-emerald-100 text-emerald-700 border-emerald-200";
        return "bg-gray-100 text-gray-700 border-gray-200";
    };

    let channelLogoHTML = (
        <div className="w-14 h-14 rounded-full bg-blue-500 border border-blue-700 flex items-center justify-center text-white font-bold text-lg">
            <i className="fas fa-tasks"></i>
        </div>
    );

    if (task.category && task.category.toLowerCase().includes('youtube')) {
        channelLogoHTML = (
            <div className="w-14 h-14 rounded-full bg-red-600 border border-red-700 flex items-center justify-center text-white p-2">
                <i className="fab fa-youtube text-3xl"></i>
            </div>
        );
    } else if (task.category && task.category.toLowerCase().includes('facebook')) {
        channelLogoHTML = (
            <div className="w-14 h-14 rounded-full bg-blue-600 border border-blue-800 flex items-center justify-center text-white p-2">
                <i className="fab fa-facebook-f text-3xl"></i>
            </div>
        );
    }

    return (
        <div className="group relative flex flex-col gap-2 p-4 rounded-xl bg-white/80 backdrop-blur border border-blue-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition duration-200">
            <div className="flex items-center gap-3">
                {channelLogoHTML}
                <h3 className="font-bold text-lg text-blue-700 leading-snug flex-1">
                    {esc(task.title || "শিরোনামহীন")}
                </h3>
            </div>
            <span className={`absolute top-3 right-3 text-xs px-2 py-1 rounded-full border ${categoryColor(task.category)}`}>
                {esc(task.category || "অশ্রেণীভুক্ত")}
            </span>
            {task.description && <p className="text-sm text-slate-600 mt-2">{esc(task.description)}</p>}
            <div className="flex justify-between items-center text-sm text-gray-600 font-medium mt-3 border-t pt-2">
                <div>
                    <i className="fas fa-bullseye text-cyan-500 mr-1"></i>
                    টার্গেট: <span className="font-semibold text-slate-800">{esc(task.completed || "0")}/{esc(task.target || "0")}</span>
                </div>
                <div>
                    <i className="fas fa-user-tie text-cyan-500 mr-1"></i>
                    আপলোড করেছেন: <span className="font-medium text-slate-800">{esc(task.uploaderName || "অজানা")}</span>
                </div>
            </div>
            <button
                className="view-details-btn mt-3 inline-flex items-center justify-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1"
                onClick={() => onTaskClick(task.id)}
            >
                বিস্তারিত
            </button>
        </div>
    );
};

const OrderCard = ({ order }) => {
    let statusColorClass = 'bg-gray-400';
    if (order.status === 'pending') {
        statusColorClass = 'bg-yellow-500';
    } else if (order.status === 'processing') {
        statusColorClass = 'bg-blue-500';
    } else if (order.status === 'completed') {
        statusColorClass = 'bg-green-500';
    }

    const categoryText = (order.category === 'youtube') ? 'ইউটিউব' : 'ফেসবুক';
    
    const subCategoryMap = {
        'channel-subscribe': 'চ্যানেল সাবস্ক্রাইব',
        'video-view': 'ভিডিও ভিউ',
        'video-like': 'ভিডিও লাইক',
        'video-comment': 'ভিডিও কমেন্ট',
        'id-page-follow': 'আইডি/পেজ ফলো',
        'id-page-like': 'আইডি/পেজ লাইক',
        'post-react': 'পোস্টে রিয়েক্ট',
        'post-comment': 'পোস্টে কমেন্ট',
        'post-share': 'পোস্ট শেয়ার'
    };
    const subCategoryText = subCategoryMap[order.subCategory] || order.subCategory;

    const formatTimeAgo = (timestamp) => {
        if (!timestamp) return "এইমাত্র";
        const now = new Date();
        const date = timestamp.toDate(); // Firestore timestamp to Date object
        const diffMs = now - date;
        const diffMinutes = Math.round(diffMs / (1000 * 60));
        const diffHours = Math.round(diffMs / (1000 * 60 * 60));
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffMinutes < 1) {
            return "এইমাত্র";
        } else if (diffMinutes < 60) {
            return `${diffMinutes} মিনিট আগে`;
        } else if (diffHours < 24) {
            return `${diffHours} ঘন্টা আগে`;
        } else {
            return `${diffDays} দিন আগে`;
        }
    };

    return (
        <div className="task-card group relative flex flex-col items-center gap-2 p-4 rounded-xl bg-white/80 backdrop-blur border border-blue-100 shadow-sm transition duration-200">
            <div className="relative w-16 h-16 mb-4">
                <i className="fas fa-cubes text-blue-500 text-6xl"></i>
                <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full ${statusColorClass} border-2 border-white`}></span>
            </div>
            <h3 className="font-bold text-lg text-blue-700 leading-snug text-center">
                {esc(order.title)}
            </h3>
            <p className="text-sm text-slate-600 mt-2 text-center">{esc(order.description)}</p>
            <div className="flex flex-col gap-2 w-full mt-4 text-sm text-gray-600 font-medium border-t pt-2">
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-blue-800">ক্যাটাগরি:</span>
                    <span>{esc(categoryText)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-blue-800">সাব-ক্যাটাগরি:</span>
                    <span>{esc(subCategoryText)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-blue-800">টার্গেট:</span>
                    <span>{esc(order.target)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-blue-800">জমা দেওয়ার সময়:</span>
                    <span title={new Date(order.timestamp).toLocaleString()}>{formatTimeAgo(order.timestamp)}</span>
                </div>
            </div>
            <a href={esc(order.link)} target="_blank" rel="noopener noreferrer" className="view-link mt-4 inline-flex items-center justify-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1">
                লিংক দেখুন
            </a>
        </div>
    );
};

const AppContent = () => {
    const { db, auth, user, isAuthReady } = useAppContext();
    const [welcomeMessage, setWelcomeMessage] = useState("আপনার নাম");
    const [userPoints, setUserPoints] = useState(0);
    const [userLoggedIn, setUserLoggedIn] = useState(false);
    const [profilePicUrl, setProfilePicUrl] = useState(DEFAULT_PROFILE_PIC_URL);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [loadingPromotions, setLoadingPromotions] = useState(true);
    const [promotion, setPromotion] = useState(null);

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const toggleNotifications = (e) => {
        e.stopPropagation();
        setShowNotifications(!showNotifications);
    };

    const handleLoginLogout = async () => {
        if (userLoggedIn) {
            await signOut(auth);
        } else {
            // Placeholder for login action
            alert("Login not implemented yet. Please use the initial auth token provided.");
        }
    };
    
    // Listen for user data and points updates
    useEffect(() => {
        if (!db || !user || !isAuthReady) return;
        const userRef = doc(db, "artifacts", __app_id, "users", user.uid);
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                const displayName = userData.displayName || user.email || "ইউজার";
                setWelcomeMessage(`স্বাগতম, ${displayName}`);
                setUserPoints(userData.points || 0);
                setProfilePicUrl(userData.profilePictureUrl || DEFAULT_PROFILE_PIC_URL);
                setUserLoggedIn(true);
            } else {
                setWelcomeMessage("স্বাগতম, অতিথি");
                setUserPoints(0);
                setProfilePicUrl(DEFAULT_PROFILE_PIC_URL);
                setUserLoggedIn(false);
            }
        });
        return () => unsubscribe();
    }, [db, user, isAuthReady]);

    // Load tasks, orders, and promotions
    useEffect(() => {
        if (!db || !isAuthReady) return;

        // Load Tasks
        const tasksQuery = query(collection(db, "artifacts", __app_id, "public", "data", "tasks"));
        const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
            const taskList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTasks(taskList);
            setLoadingTasks(false);
        }, (error) => {
            console.error("Error loading tasks:", error);
            setLoadingTasks(false);
        });

        // Load Promotions
        const promotionsQuery = query(collection(db, "artifacts", __app_id, "public", "data", "promotions"), where("active", "==", true));
        const unsubscribePromotions = onSnapshot(promotionsQuery, (snapshot) => {
            const promotionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            let latestPromotion = null;
            if (promotionsData.length > 0) {
                latestPromotion = promotionsData.reduce((prev, curr) => 
                    (prev.createdAt?.toDate() || 0) > (curr.createdAt?.toDate() || 0) ? prev : curr
                );
            }
            setPromotion(latestPromotion);
            setLoadingPromotions(false);
        }, (error) => {
            console.error("Error loading promotions:", error);
            setLoadingPromotions(false);
        });

        // Load User Orders
        let unsubscribeOrders;
        if (user && user.uid) {
            const ordersQuery = query(collection(db, "artifacts", __app_id, "users", user.uid, "orders"));
            unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
                const ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setOrders(ordersList);
                setLoadingOrders(false);
            }, (error) => {
                console.error("Error loading orders:", error);
                setLoadingOrders(false);
            });
        } else {
            setOrders([]);
            setLoadingOrders(false);
        }

        // Load Notifications
        const notificationsRef = collection(db, "artifacts", __app_id, "public", "data", "notifications");
        const unsubscribeNotifications = onSnapshot(notificationsRef, (snapshot) => {
            const allNotifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                read: doc.data().readBy && user && doc.data().readBy[user.uid]
            }));
            allNotifications.sort((a, b) => (b.timestamp?.toDate() || 0) - (a.timestamp?.toDate() || 0));
            setNotifications(allNotifications);
        }, (error) => {
            console.error("Error loading notifications:", error);
        });

        const closeNotifications = () => setShowNotifications(false);
        document.addEventListener('click', closeNotifications);
        
        return () => {
            unsubscribeTasks();
            unsubscribePromotions();
            if (unsubscribeOrders) unsubscribeOrders();
            unsubscribeNotifications();
            document.removeEventListener('click', closeNotifications);
        };
    }, [db, user, isAuthReady]);

    const handleMarkAsRead = async (notificationId) => {
        if (!user || !db) return;
        try {
            const notifRef = doc(db, "artifacts", __app_id, "public", "data", "notifications", notificationId);
            await updateDoc(notifRef, {
                [`readBy.${user.uid}`]: true
            });
        } catch (e) {
            console.error("Error marking notification as read:", e);
        }
    };

    const handleTaskClick = (id) => {
        alert(`Navigating to task details for task ID: ${id}`);
    };

    return (
        <div lang="bn">
            <style>
                {`
                body {
                    font-family: 'Hind Siliguri', sans-serif;
                    overflow-x: hidden;
                }
                .skeleton-card { background-color: #f3f4f6; overflow: hidden; position: relative; }
                .shimmer { width: 100%; height: 100%; background: linear-gradient(to right, #f3f4f6 8%, #e5e7eb 18%, #f3f4f6 33%); background-size: 800px 104px; position: absolute; top: 0; left: -800px; animation: shimmer 1.5s infinite linear; }
                @keyframes shimmer { 0% { left: -800px; } 100% { left: 800px; } }
                .skeleton-line { background-color: #e5e7eb; border-radius: 4px; position: relative; overflow: hidden; }
                .skeleton-circle { background-color: #e5e7eb; border-radius: 50%; position: relative; overflow: hidden; }
                .header-profile-logo { width: 48px; height: 48px; border-radius: 50%; border: 2px solid #007bff; object-fit: cover; }
                .mobile-slider-menu { position: fixed; top: 0; right: -280px; width: 280px; height: 100%; background-color: #ffffff; box-shadow: -8px 0 15px rgba(0, 0, 0, 0.15), inset 4px 0 8px rgba(255, 255, 255, 0.6); z-index: 1000; transition: right 0.35s cubic-bezier(0.4, 0, 0.2, 1); padding-top: 5rem; display: flex; flex-direction: column; border-top-left-radius: 1rem; border-bottom-left-radius: 1rem; backdrop-filter: saturate(180%) blur(12px); -webkit-backdrop-filter: saturate(180%) blur(12px); }
                .mobile-slider-menu.active { right: 0; box-shadow: -12px 0 25px rgba(0, 0, 0, 0.25), inset 4px 0 12px rgba(255, 255, 255, 0.7); }
                #sliderMenuContent { flex-grow: 1; padding: 1.5rem 0; display: flex; flex-direction: column; gap: 0.75rem; }
                #sliderMenuContent .menu-item { display: flex; align-items: center; padding: 0.75rem 1.75rem; color: #4338ca; font-weight: 600; font-size: 1.125rem; border-radius: 0.75rem; transition: background-color 0.3s ease, color 0.3s ease, transform 0.2s ease; text-decoration: none; box-shadow: 0 0 0 0 transparent; user-select: none; position: relative; overflow: hidden; }
                #sliderMenuContent .menu-item::before { content: ''; position: absolute; left: 0; top: 0; height: 100%; width: 4px; background: #4338ca; border-top-right-radius: 0.75rem; border-bottom-right-radius: 0.75rem; transform: scaleY(0); transform-origin: center; transition: transform 0.3s ease; z-index: 1; }
                #sliderMenuContent .menu-item:hover::before, #sliderMenuContent .menu-item:focus-visible::before { transform: scaleY(1); }
                #sliderMenuContent .menu-item:hover { background-color: #4338ca; color: #e0e7ff; transform: translateX(6px); box-shadow: 0 8px 15px rgba(67, 56, 202, 0.3); z-index: 10; outline: none; }
                #sliderMenuContent .menu-item:focus-visible { outline: 2px solid #4338ca; outline-offset: 2px; }
                .slider-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.45); z-index: 999; opacity: 0; visibility: hidden; transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.35s cubic-bezier(0.4, 0, 0.2, 1); backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px); }
                .slider-backdrop.active { opacity: 1; visibility: visible; }
                #notificationDropdown::before { content: ''; position: absolute; top: -10px; right: 18px; border-width: 0 10px 10px 10px; border-color: transparent transparent white transparent; filter: drop-shadow(0 -2px 1px rgba(0,0,0,0.05)); z-index: 51; }
                #notificationDropdown::after { content: ''; position: absolute; top: -11px; right: 343px; border-width: 0 10px 10px 10px; border-color: transparent transparent #e2e8f0 transparent; z-index: 50; }
                @media (max-width: 639px) { #notificationDropdown::before, #notificationDropdown::after { right: 25px; } }
                .spinner { border: 2px solid rgba(0, 0, 0, 0.1); border-left-color: #4f46e5; border-radius: 50%; width: 16px; height: 16px; animation: spin 1s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .btn-login { background-color: #22c55e; color: white; }
                .btn-login:hover { background-color: #16a34a; }
                .btn-login:focus { outline: none; box-shadow: 0 0 0 2px #4ade80, 0 0 0 4px rgba(34, 197, 94, 0.5); }
                .btn-logout { background-color: #ef4444; color: white; }
                .btn-logout:hover { background-color: #dc2626; }
                .btn-logout:focus { outline: none; box-shadow: 0 0 0 2px #f87171, 0 0 0 4px rgba(239, 68, 68, 0.5); }
                .promotion-card { background-color: #ffffff; border-radius: 0.75rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); padding: 0; display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; overflow: hidden; border: 1px solid #e2e8f0; }
                .promotion-image-wrapper { position: relative; width: 100%; padding-bottom: 56.25%; overflow: hidden; border-radius: 0.5rem; }
                .promotion-image-wrapper img { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 0.5rem; }
                .promotion-card a.promotion-link { display: block; width: 100%; height: 100%; }
                .sponsored-tag { position: absolute; top: 0.6rem; left: 0.6rem; background-color: rgba(255, 255, 255, 0.2); color: #ffffff; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.3rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); z-index: 10; backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); border: 1px solid rgba(255, 255, 255, 0.3); }
                .task-card { background-color: #ffffff; border-radius: 0.75rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); padding: 1.5rem; display: flex; flex-direction: column; align-items: center; text-align: center; position: relative; overflow: hidden; border: 1px solid #e2e8f0; transition: all 0.3s ease; }
                .task-card:hover { transform: translateY(-0.25rem); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
                `}
            </style>
            <body className="bg-gradient-to-b from-cyan-100 to-blue-200 min-h-screen flex flex-col">
                {/* Header Section */}
                <header className="bg-white shadow-xl sticky top-0 z-50 border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                            <img alt="প্রোফাইল ছবি"
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-indigo-500 shadow-md header-profile-logo"
                                loading="lazy"
                                src={profilePicUrl}
                            />
                            <div className="hidden sm:block">
                                <p className="text-gray-700 font-semibold text-base sm:text-lg leading-tight select-none">{welcomeMessage}</p>
                                <p className="text-gray-500 text-xs sm:text-sm select-none">আপনার প্রোফাইল</p>
                            </div>
                            <h1 className="text-2 sm:text-3xl font-extrabold text-indigo-600 tracking-wide select-none ml-4 sm:ml-6">
                                <span>Dashboard</span>
                            </h1>
                        </div>

                        <div className="flex items-center space-x-3 sm:space-x-4">
                            <div className="flex items-center space-x-3">
                                {loadingTasks || loadingOrders || loadingPromotions ? (
                                    <div className="flex items-center bg-gray-100 text-gray-600 font-semibold px-2 py-1 rounded-full shadow select-none text-xs scale-90">
                                        <div className="spinner mr-2"></div>
                                        <span>লোড হচ্ছে...</span>
                                    </div>
                                ) : (
                                    <>
                                        {userLoggedIn ? (
                                            <div aria-label="আপনার পয়েন্ট" className="flex items-center bg-indigo-50 text-indigo-700 font-semibold px-2 py-1 rounded-full shadow select-none text-xs scale-90">
                                                <i className="fas fa-coins mr-1 text-yellow-400 text-sm"></i>
                                                <span>{userPoints} পয়েন্ট</span>
                                            </div>
                                        ) : (
                                            <div aria-label="সাইন-ইন স্ট্যাটাস" onClick={handleLoginLogout} className="flex items-center bg-red-50 text-red-700 font-semibold px-2 py-1 rounded-full shadow select-none text-xs scale-90 cursor-pointer">
                                                <i className="fas fa-user-circle mr-1 text-red-500 text-sm"></i>
                                                <span>লগইন করুন</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <button id="notificationButton" aria-label="নোটিফিকেশন" onClick={toggleNotifications}
                                className="relative text-indigo-600 hover:text-indigo-800 transition focus:outline-none">
                                <i className="fas fa-bell text-lg sm:text-xl"></i>
                                <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-600 text-white text-xs rounded-full px-1 sm:px-1.5 shadow-lg" id="notificationCountDisplay">{notifications.filter(n => !n.read).length}</span>
                            </button>

                            {showNotifications && (
                                <div id="notificationDropdown" onClick={(e) => e.stopPropagation()} className="absolute top-16 right-4 sm:right-6 md:right-10 bg-white border border-gray-200 rounded-lg shadow-lg w-64 md:w-80 z-50">
                                    <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                        <h3 className="font-semibold text-gray-800">নোটিফিকেশনস</h3>
                                        <span className="text-xs text-gray-500" id="newNotificationCount">{notifications.filter(n => !n.read).length}টি নতুন</span>
                                    </div>
                                    <div className="py-2 max-h-60 overflow-y-auto" id="notificationList">
                                        {notifications.length > 0 ? (
                                            notifications.map(notification => (
                                                <a key={notification.id} href={notification.link || '#'} className={`block px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 ${notification.read ? 'opacity-70' : 'font-semibold'}`}
                                                   onClick={() => handleMarkAsRead(notification.id)}>
                                                    <p className="text-sm text-gray-800">{esc(notification.title || "শিরোনামহীন নোটিফিকেশন")}</p>
                                                    {notification.message && <p className="text-xs text-gray-500 mt-1">{esc(notification.message)}</p>}
                                                </a>
                                            ))
                                        ) : (
                                            <p className="text-center text-gray-500 py-2">কোনো নোটিফিকেশন নেই।</p>
                                        )}
                                    </div>
                                    <div className="px-4 py-3 border-t border-gray-200 text-center">
                                        <a href="#" className="text-sm text-blue-600 hover:text-blue-800 font-medium">সকল নোটিফিকেশন দেখুন</a>
                                    </div>
                                </div>
                            )}

                            <button aria-label="মেনু"
                                aria-controls="mobileSliderMenu"
                                aria-expanded={mobileMenuOpen}
                                onClick={toggleMobileMenu}
                                className="md:hidden text-indigo-600 hover:text-indigo-800 text-xl sm:text-2xl focus:outline-none">
                                <i className="fas fa-bars"></i>
                            </button>

                            <nav aria-label="প্রধান নেভিগেশন"
                                className="hidden md:flex items-center space-x-6 lg:space-x-8 text-indigo-600 font-semibold select-none text-base"
                                role="navigation">
                                <a className="hover:text-indigo-800 transition" href="#">ড্যাশবোর্ড</a>
                                <a className="hover:text-indigo-800 transition" href="#">টাস্ক</a>
                                <a className="hover:text-indigo-800 transition" href="#">লিডারবোর্ড</a>
                                <a className="hover:text-indigo-800 transition" href="#">অর্ডার</a>
                            </nav>
                        </div>
                    </div>

                    <div className={`mobile-slider-menu ${mobileMenuOpen ? 'active' : ''}`} role="menu" aria-label="মোবাইল স্লাইডার মেনু">
                        <div className="flex items-center space-x-3 p-4 border-b border-gray-200 mb-4">
                            <img alt="প্রোফাইল ছবি"
                                className="w-16 h-16 rounded-full border-2 border-indigo-500 shadow-md header-profile-logo"
                                loading="lazy"
                                src={profilePicUrl}
                            />
                            <div>
                                <p className="text-gray-700 font-semibold text-lg leading-tight">{welcomeMessage}</p>
                                <p className="text-gray-500 text-sm">আপনার প্রোফাইল</p>
                            </div>
                        </div>
                        <div id="sliderMenuContent" role="none">
                            <a className="menu-item" href="#" role="menuitem" tabIndex="0">ড্যাশবোর্ড</a>
                            <a className="menu-item" href="#" role="menuitem" tabIndex="0">আমার টাস্ক</a>
                            <a className="menu-item" href="#" role="menuitem" tabIndex="0">সম্পূর্ণ করা টাস্ক</a>
                            <a className="menu-item" href="#" role="menuitem" tabIndex="0">অর্ডার করুন</a>
                            <a className="menu-item" href="#" role="menuitem" tabIndex="0">রেফার করুন</a>
                            <a className="menu-item" href="#" role="menuitem" tabIndex="0">লিডারবোর্ড</a>
                        </div>
                        <div className="p-4 mt-auto border-t border-gray-200">
                            <button
                                onClick={handleLoginLogout}
                                className={`w-full py-2 px-4 rounded-md font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${userLoggedIn ? 'btn-logout' : 'btn-login'}`}
                            >
                                {userLoggedIn ? 'লগআউট করুন' : 'লগইন করুন'}
                            </button>
                        </div>
                    </div>
                    <div className={`slider-backdrop ${mobileMenuOpen ? 'active' : 'hidden'}`} onClick={toggleMobileMenu} tabIndex="-1" aria-hidden="true"></div>
                </header>

                {/* Promotion Card Container */}
                <div className="max-w-3xl mx-auto px-6 py-6 w-full">
                    {loadingPromotions ? (
                        <div className="promotion-card skeleton-card">
                            <div className="shimmer"></div>
                            <div className="promotion-image-wrapper">
                                <div className="skeleton-line w-full h-full rounded-lg"></div>
                            </div>
                        </div>
                    ) : (
                        promotion ? (
                            <div className="promotion-card">
                                <a href={esc(promotion.redirectLink)} target="_blank" rel="noopener noreferrer" className="block w-full promotion-link">
                                    <div className="promotion-image-wrapper">
                                        <img src={esc(promotion.imageUrl)} alt="প্রোমোশন ব্যানার ছবি" />
                                    </div>
                                </a>
                                <div className="sponsored-tag">Sponsored</div>
                            </div>
                        ) : null
                    )}
                </div>

                <main className="flex-grow max-w-3xl mx-auto px-6 py-12 w-full mt-[1px]">
                    <h2 className="text-3xl font-extrabold text-blue-800 mb-8 text-center">আপনার টাস্কসমূহ</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {loadingTasks ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="group relative flex flex-col gap-2 p-4 rounded-xl bg-white/80 backdrop-blur border border-blue-100 shadow-sm transition duration-200 skeleton-card">
                                    <div className="shimmer"></div>
                                    <div className="flex items-center gap-3">
                                        <div className="skeleton-circle w-14 h-14"></div>
                                        <div className="flex-1">
                                            <div className="skeleton-line h-6 w-3/4 mb-2"></div>
                                            <div className="skeleton-line h-4 w-1/2"></div>
                                        </div>
                                    </div>
                                    <div className="absolute top-3 right-3 skeleton-line h-5 w-20 rounded-full"></div>
                                    <div className="skeleton-line h-4 w-full mt-2"></div>
                                    <div className="skeleton-line h-4 w-5/6 mt-1"></div>
                                    <div className="flex justify-between items-center text-sm text-gray-600 font-medium mt-3 border-t pt-2">
                                        <div className="skeleton-line h-4 w-24"></div>
                                        <div className="skeleton-line h-4 w-24"></div>
                                    </div>
                                    <div className="skeleton-line h-9 w-full rounded-md mt-3"></div>
                                </div>
                            ))
                        ) : tasks.length > 0 ? (
                            tasks.map(task => (
                                <TaskCard key={task.id} task={task} onTaskClick={handleTaskClick} />
                            ))
                        ) : (
                            <div className="col-span-full text-center text-blue-700">কোনো টাস্ক নেই।</div>
                        )}
                    </div>
                    
                    <h2 className="text-3xl font-extrabold text-blue-800 mb-8 text-center mt-12">আপনার জমা করা অর্ডারসমূহ</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {loadingOrders ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="task-card skeleton-card">
                                    <div className="shimmer"></div>
                                    <div className="w-16 h-16 rounded-full bg-gray-300 skeleton-circle mb-4"></div>
                                    <div className="skeleton-line h-6 w-3/4 mb-2"></div>
                                    <div className="skeleton-line h-4 w-1/2 mb-4"></div>
                                    <div className="flex justify-between w-full text-sm font-medium border-t pt-2">
                                        <div className="skeleton-line h-4 w-1/3"></div>
                                        <div className="skeleton-line h-4 w-1/3"></div>
                                    </div>
                                    <div className="skeleton-line h-8 w-full rounded-md mt-4"></div>
                                </div>
                            ))
                        ) : orders.length > 0 ? (
                            orders.map(order => (
                                <OrderCard key={order.id} order={order} />
                            ))
                        ) : (
                            <div className="col-span-full text-center text-blue-700">
                                {userLoggedIn ? "আপনার কোনো অর্ডার জমা করা নেই।" : "আপনার অর্ডার দেখতে অনুগ্রহ করে লগইন করুন।"}
                            </div>
                        )}
                    </div>
                </main>

                <footer className="bg-blue-700 text-white py-6 mt-12">
                    <div className="max-w-5xl mx-auto px-6 text-center text-sm">© 2025 থিম. সর্বস্বত্ব সংরক্ষিত।</div>
                </footer>
            </body>
        </div>
    );
};


export default function App() {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
}


