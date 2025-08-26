// This is the main page component for the Next.js application.
// It combines the HTML structure and JavaScript logic into a single,
// self-contained React component.

import { useEffect, useState } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, child, query, limitToFirst, startAfter, endBefore, orderByKey } from "firebase/database";
import { getAuth, onAuthStateChanged, signOut, signInAnonymously } from "firebase/auth";
import Head from 'next/head';

// Define the global CSS for the application
// This would be in a separate file like `globals.css` in a real Next.js project.
// We are including it here for a single-file, self-contained example.
const globalCss = `
  body {
      font-family: 'Hind Siliguri', sans-serif;
      overflow-x: hidden;
  }

  /* Skeleton Loading Styles for cards */
  .skeleton-card {
      background-color: #f3f4f6;
      overflow: hidden;
      position: relative;
  }

  .shimmer {
      width: 100%;
      height: 100%;
      background: linear-gradient(to right, #f3f4f6 8%, #e5e7eb 18%, #f3f4f6 33%); /* gray-100, gray-200 */
      background-size: 800px 104px;
      position: absolute;
      top: 0;
      left: -800px; /* Start off-screen to the left */
      animation: shimmer 1.5s infinite linear;
  }

  @keyframes shimmer {
      0% {
          left: -800px;
      }
      100% {
          left: 800px;
      }
  }

  .skeleton-line {
      background-color: #e5e7eb; /* gray-200 */
      border-radius: 4px;
      position: relative;
      overflow: hidden;
  }

  .skeleton-circle {
      background-color: #e5e7eb; /* gray-200 */
      border-radius: 50%;
      position: relative;
      overflow: hidden;
  }

  /* Styles for profile picture */
  .header-profile-logo {
      width: 48px; /* Matches logo size */
      height: 48px; /* Matches logo size */
      border-radius: 50%; /* Circular */
      border: 2px solid #007bff; /* Example border */
      object-fit: cover;
  }

  /* Styles for mobile slide-out menu */
  .mobile-slider-menu {
      position: fixed;
      top: 0;
      right: -280px; /* Hidden state */
      width: 280px; /* Sidebar width */
      height: 100%;
      background-color: #ffffff; /* White background */
      box-shadow: -8px 0 15px rgba(0, 0, 0, 0.15), inset 4px 0 8px rgba(255, 255, 255, 0.6);
      z-index: 1000; /* Ensures it's on top of everything */
      transition: right 0.35s cubic-bezier(0.4, 0, 0.2, 1); /* Smooth slide animation */
      padding-top: 5rem; /* According to header height */
      display: flex;
      flex-direction: column;
      border-top-left-radius: 1rem;
      border-bottom-left-radius: 1rem;
      backdrop-filter: saturate(180%) blur(12px);
      -webkit-backdrop-filter: saturate(180%) blur(12px);
  }

  .mobile-slider-menu.active {
      right: 0; /* Visible state */
      box-shadow: -12px 0 25px rgba(0, 0, 0, 0.25), inset 4px 0 12px rgba(255, 255, 255, 0.7);
  }

  #sliderMenuContent {
      flex-grow: 1; /* Allows menu items to fill empty space */
      padding: 1.5rem 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
  }

  #sliderMenuContent .menu-item {
      display: flex;
      align-items: center;
      padding: 0.75rem 1.75rem;
      color: #4338ca; /* indigo-700 */
      font-weight: 600; /* font-semibold */
      font-size: 1.125rem; /* text-lg */
      border-radius: 0.75rem;
      transition: background-color 0.3s ease, color 0.3s ease, transform 0.2s ease;
      text-decoration: none; /* Removes underline */
      box-shadow: 0 0 0 0 transparent;
      user-select: none;
      position: relative;
      overflow: hidden;
  }

  #sliderMenuContent .menu-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 4px;
      background: #4338ca;
      border-top-right-radius: 0.75rem;
      border-bottom-right-radius: 0.75rem;
      transform: scaleY(0);
      transform-origin: center;
      transition: transform 0.3s ease;
      z-index: 1;
  }

  #sliderMenuContent .menu-item:hover::before,
  #sliderMenuContent .menu-item:focus-visible::before {
      transform: scaleY(1);
  }

  #sliderMenuContent .menu-item:hover {
      background-color: #4338ca; /* indigo-700 */
      color: #e0e7ff; /* indigo-100 */
      transform: translateX(6px);
      box-shadow: 0 8px 15px rgba(67, 56, 202, 0.3);
      z-index: 10;
      outline: none;
  }

  #sliderMenuContent .menu-item:focus-visible {
      outline: 2px solid #4338ca;
      outline-offset: 2px;
  }

  /* Overlay backdrop */
  .slider-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.45); /* Dark backdrop */
      z-index: 999; /* Stays below the slider */
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(2px);
      -webkit-backdrop-filter: blur(2px);
  }

  .slider-backdrop.active {
      opacity: 1;
      visibility: visible;
  }

  /* New styles for notification dropdown - caret */
  #notificationDropdown::before {
      content: '';
      position: absolute;
      top: -10px; /* Upwards from dropdown */
      right: 18px; /* Aligned with notification button */
      border-width: 0 10px 10px 10px; /* Creates a triangle */
      border-color: transparent transparent white transparent; /* White triangle */
      filter: drop-shadow(0 -2px 1px rgba(0,0,0,0.05)); /* Light shadow */
      z-index: 51; /* Will be above dropdown */
  }

  #notificationDropdown::after {
      content: '';
      position: absolute;
      top: -11px; /* 1px above for border */
      right: 343px; /* Aligned with notification button */
      border-width: 0 10px 10px 10px;
      border-color: transparent transparent #e2e8f0 transparent; /* Border color */
      z-index: 50; /* Above dropdown but below white triangle */
  }

  /* Adjust notification dropdown position for mobile screens (if needed) */
  @media (max-width: 639px) { /* Below sm breakpoint */
      #notificationDropdown::before,
      #notificationDropdown::after {
          right: 25px; /* Adjust position for small screens */
      }
  }

  /* Additional styles for spinner */
  .spinner {
      border: 2px solid rgba(0, 0, 0, 0.1);
      border-left-color: #4f46e5; /* indigo-600 */
      border-radius: 50%;
      width: 16px;
      height: 16px;
      animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* New styles for login/logout buttons */
  .btn-login {
      background-color: #22c55e; /* green-500 */
      color: white;
  }

  .btn-login:hover {
      background-color: #16a34a; /* green-600 */
  }

  .btn-login:focus {
      outline: none;
      box-shadow: 0 0 0 2px #4ade80, 0 0 0 4px rgba(34, 197, 94, 0.5); /* green-300 ring */
  }

  .btn-logout {
      background-color: #ef4444; /* red-500 */
      color: white;
  }

  .btn-logout:hover {
      background-color: #dc2626; /* red-600 */
  }

  .btn-logout:focus {
      outline: none;
      box-shadow: 0 0 0 2px #f87171, 0 0 0 4px rgba(239, 68, 68, 0.5); /* red-300 ring */
  }

  /* Promotion Card Specific Styles */
  .promotion-card {
      background-color: #ffffff;
      border-radius: 0.75rem; /* rounded-xl */
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* shadow-md */
      padding: 0; /* No padding */
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      position: relative; /* For positioning the sponsored tag */
      overflow: hidden;
      border: 1px solid #e2e8f0; /* border-gray-200 */
  }

  /* Container for the 16:9 image */
  .promotion-image-wrapper {
      position: relative;
      width: 100%;
      padding-bottom: 56.25%; /* 16:9 Aspect Ratio (9 / 16 * 100) */
      overflow: hidden;
      border-radius: 0.5rem; /* rounded-lg */
  }

  .promotion-image-wrapper img {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover; /* Ensures the image covers the area, cropping if necessary */
      border-radius: 0.5rem; /* rounded-lg */
  }

  .promotion-card a.promotion-link {
      display: block;
      width: 100%;
      height: 100%; /* Make the link take full height of the card */
  }

  /* New style for the sponsored tag */
  .sponsored-tag {
      position: absolute;
      top: 0.6rem; /* 12px from top */
      left: 0.6rem; /* 12px from left */
      background-color: rgba(255, 255, 255, 0.2); /* Slightly transparent white */
      color: #ffffff;
      padding: 0.25rem 0.75rem; /* py-1 px-3 */
      border-radius: 1rem; /* rounded-lg */
      font-size: 0.3rem; /* text-xs */
      font-weight: 600; /* font-semibold */
      text-transform: uppercase;
      letter-spacing: 0.05em; /* tracking-wider */
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* subtle shadow */
      z-index: 10; /* Ensure it's above the image */
      backdrop-filter: blur(4px); /* Frosted glass effect */
      -webkit-backdrop-filter: blur(4px);
      border: 1px solid rgba(255, 255, 255, 0.3); /* Light border */
  }

  /* Task-specific styles */
  .task-card {
      background-color: #ffffff;
      border-radius: 0.75rem; /* rounded-xl */
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); /* shadow-md */
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      position: relative;
      overflow: hidden;
      border: 1px solid #e2e8f0; /* border-gray-200 */
      transition: all 0.3s ease;
  }

  .task-card:hover {
      transform: translateY(-0.25rem);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
`;

const DEFAULT_PROFILE_PIC_URL = 'https://i.pravatar.cc/300';
const firebaseConfig = {
    apiKey: "AIzaSyAC4h55aA0Zz--V5ejyndzR5WC_-9rAPio",
    authDomain: "subscribe-bot-6f9b2.firebaseapp.com",
    databaseURL: "https://subscribe-bot-6f9b2-default-rtdb.firebaseio.com",
    projectId: "subscribe-bot-6f9b2",
    storageBucket: "subscribe-bot-6f9b2.firebasestorage.app",
    messagingSenderId: "141787931031",
    appId: "1:141787931031:web:2108a3e930f5ce4fbc64d2",
    measurementId: "G-HSDKCJB14Y"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Utility function for escaping HTML
const esc = (str = "") => {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
};

// Component for rendering a single Task Card
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
                    {esc(task.title || "Untitled")}
                </h3>
            </div>
            <span className={`absolute top-3 right-3 text-xs px-2 py-1 rounded-full border ${categoryColor(task.category)}`}>
                {esc(task.category || "Uncat")}
            </span>
            {task.description && <p className="text-sm text-slate-600 mt-2">{esc(task.description)}</p>}
            <div className="flex justify-between items-center text-sm text-gray-600 font-medium mt-3 border-t pt-2">
                <div>
                    <i className="fas fa-bullseye text-cyan-500 mr-1"></i>
                    টার্গেট: <span className="font-semibold text-slate-800">{esc(task.completed || "0")}/{esc(task.target || "0")}</span>
                </div>
                <div>
                    <i className="fas fa-user-tie text-cyan-500 mr-1"></i>
                    আপলোড করেছেন: <span className="font-medium text-slate-800">{esc(task.uploaderName || "Unknown")}</span>
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

// Component for rendering a single Order Card
const OrderCard = ({ order }) => {
    // Get status color
    let statusColorClass = 'bg-gray-400';
    if (order.status === 'pending') {
        statusColorClass = 'bg-yellow-500';
    } else if (order.status === 'processing') {
        statusColorClass = 'bg-blue-500';
    } else if (order.status === 'completed') {
        statusColorClass = 'bg-green-500';
    }

    // Get category text
    const categoryText = (order.category === 'youtube') ? 'ইউটিউব' : 'ফেসবুক';
    
    // Get sub-category text
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

    // Format timestamp
    const formatTimeAgo = (timestamp) => {
        if (!timestamp) return "এইমাত্র";
        const date = new Date(timestamp);
        const now = new Date();
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


export default function App() {
    const [welcomeMessage, setWelcomeMessage] = useState("Your Name");
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
    const [currentPage, setCurrentPage] = useState(1);
    const [lastLoadedKeys, setLastLoadedKeys] = useState([]);
    const taskLimit = 20;

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
            // Redirect to login page or show login modal
            window.location.href = 'login.html';
        }
    };
    
    // --- Data Loading Functions (moved into useEffect) ---

    // Function to load all notifications for UI
    const loadAllNotificationsForUI = async (user) => {
        if (!user) {
            setNotifications([]);
            return;
        }

        try {
            const snapshot = await get(child(ref(db), "notifications"));
            if (!snapshot.exists()) {
                setNotifications([]);
                return;
            }

            const notificationsData = snapshot.val();
            const allNotificationData = [];
            for (const notificationId in notificationsData) {
                const data = notificationsData[notificationId];
                const isRead = data.readBy && data.readBy[user.uid];
                allNotificationData.push({ id: notificationId, ...data, read: isRead });
            }
            allNotificationData.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            setNotifications(allNotificationData);
        } catch (error) {
            console.error("Error loading notifications from Realtime Database:", error);
            setNotifications([]);
        }
    };

    // Function to load tasks
    const loadTasks = async (startKey = null, isPrevious = false) => {
        setLoadingTasks(true);
        try {
            let tasksRef = ref(db, 'tasks');
            let tasksQuery;

            if (isPrevious) {
                const lastKey = lastLoadedKeys[lastLoadedKeys.length - 2];
                tasksQuery = query(tasksRef, orderByKey(), endBefore(lastKey), limitToLast(taskLimit));
            } else if (startKey) {
                tasksQuery = query(tasksRef, orderByKey(), startAfter(startKey), limitToFirst(taskLimit));
            } else {
                tasksQuery = query(tasksRef, orderByKey(), limitToFirst(taskLimit));
            }

            const snapshot = await get(tasksQuery);
            if (!snapshot.exists()) {
                setTasks([]);
                setLoadingTasks(false);
                return;
            }

            const tasksData = snapshot.val();
            let taskArray = Object.keys(tasksData).map(key => ({
                id: key,
                ...tasksData[key]
            }));

            if (isPrevious) {
                taskArray.reverse();
            }

            setTasks(taskArray);
            if (!isPrevious && taskArray.length > 0) {
                setLastLoadedKeys([...lastLoadedKeys, taskArray[taskArray.length - 1].id]);
            }
            setLoadingTasks(false);
        } catch (error) {
            console.error("Realtime Database থেকে টাস্ক লোড করতে সমস্যা:", error);
            setTasks([]);
            setLoadingTasks(false);
        }
    };

    // Function to load orders
    const loadOrders = async (user) => {
        if (!user) {
            setOrders([]);
            setLoadingOrders(false);
            return;
        }

        setLoadingOrders(true);
        try {
            const snapshot = await get(ref(db, 'orders'));
            if (!snapshot.exists()) {
                setOrders([]);
                setLoadingOrders(false);
                return;
            }

            const ordersData = snapshot.val();
            const userOrders = Object.keys(ordersData)
                .map(key => ({ id: key, ...ordersData[key] }))
                .filter(order => order.userId === user.uid)
                .sort((a, b) => b.timestamp - a.timestamp);

            setOrders(userOrders);
            setLoadingOrders(false);
        } catch (error) {
            console.error("অর্ডার লোড করতে সমস্যা:", error);
            setOrders([]);
            setLoadingOrders(false);
        }
    };

    // Function to load promotion banner
    const loadPromotionBanner = async () => {
        setLoadingPromotions(true);
        try {
            const snapshot = await get(child(ref(db), "promotions"));
            let latestPromotion = null;

            if (snapshot.exists()) {
                const promotionsData = snapshot.val();
                const activePromotions = Object.values(promotionsData).filter(p => p.active);
                if (activePromotions.length > 0) {
                    latestPromotion = activePromotions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];
                }
            }
            setPromotion(latestPromotion);
            setLoadingPromotions(false);
        } catch (error) {
            console.error("প্রমোশন ব্যানার লোড করতে সমস্যা:", error);
            setPromotion(null);
            setLoadingPromotions(false);
        }
    };

    // Main useEffect for data loading and auth state
    useEffect(() => {
        // Initial setup on mount
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserLoggedIn(true);
                // Load user data
                const userRef = child(ref(db), `users/${user.uid}`);
                const userSnap = await get(userRef);
                const userData = userSnap.exists() ? userSnap.val() : {};

                const displayName = userData.displayName || user.email || "ইউজার";
                setWelcomeMessage(`স্বাগতম, ${displayName}`);
                setUserPoints(userData.points || 0);
                setProfilePicUrl(userData.profilePictureUrl || DEFAULT_PROFILE_PIC_URL);

                // Load user-specific data
                loadAllNotificationsForUI(user);
                loadOrders(user);
            } else {
                setUserLoggedIn(false);
                setWelcomeMessage("স্বাগতম, অতিথি");
                setUserPoints(0);
                setProfilePicUrl(DEFAULT_PROFILE_PIC_URL);
                setOrders([]);
                loadAllNotificationsForUI(null);
                signInAnonymously(auth).catch(e => console.error("Error signing in anonymously:", e));
            }
        });

        // Load general data that doesn't depend on auth state immediately
        loadTasks();
        loadPromotionBanner();

        const closeNotifications = () => setShowNotifications(false);
        document.addEventListener('click', closeNotifications);

        return () => {
            unsubscribe();
            document.removeEventListener('click', closeNotifications);
        };
    }, []);

    return (
        <div lang="bn">
            <Head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Water Drop Theme Dashboard</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri&display=swap" rel="stylesheet" />
                <style>{globalCss}</style>
            </Head>

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
                                                <span>{userPoints} Points</span>
                                            </div>
                                        ) : (
                                            <div aria-label="সাইন-ইন স্ট্যাটাস" onClick={() => window.location.href = 'login.html'} className="flex items-center bg-red-50 text-red-700 font-semibold px-2 py-1 rounded-full shadow select-none text-xs scale-90 cursor-pointer">
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
                                                   onClick={() => { /* markAsRead */ }}>
                                                    <p className="text-sm text-gray-800">{esc(notification.title || "Untitled Notification")}</p>
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
                                <a className="hover:text-indigo-800 transition" href="/dashboard">ড্যাশবোর্ড</a>
                                <a className="hover:text-indigo-800 transition" href="/mytasklist">টাস্ক</a>
                                <a className="hover:text-indigo-800 transition" href="/leaderboard">লিডারবোর্ড</a>
                                <a className="hover:text-indigo-800 transition" href="/order">অর্ডার</a>
                            </nav>
                        </div>
                    </div>

                    <div className={`mobile-slider-menu ${mobileMenuOpen ? 'active' : ''}`} role="menu" aria-label="মোবাইল স্লাইডার মেনু">
                        <div className="flex items-center space-x-3 p-4 border-b border-gray-200 mb-4">
                            <img alt="স্লাইডার প্রোফাইল ছবি"
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
                            <a className="menu-item" href="/dashboard" role="menuitem" tabIndex="0">ড্যাশবোর্ড</a>
                            <a className="menu-item" href="/mytasklist" role="menuitem" tabIndex="0">আমার টাস্ক</a>
                            <a className="menu-item" href="/completedtask" role="menuitem" tabIndex="0">সম্পূর্ণ করা টাস্ক</a>
                            <a className="menu-item" href="/order" role="menuitem" tabIndex="0">অর্ডার করুন</a>
                            <a className="menu-item" href="/reffer" role="menuitem" tabIndex="0">রেফার করুন</a>
                            <a className="menu-item" href="/leaderboard" role="menuitem" tabIndex="0">লিডারবোর্ড</a>
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
                                        <img src={esc(promotion.imageUrl)} alt="প্রমোশন ব্যানার ছবি" />
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
                                <TaskCard key={task.id} task={task} onTaskClick={(id) => window.location.href = `taskdetails.html?id=${id}`} />
                            ))
                        ) : (
                            <div className="col-span-full text-center text-blue-700">কোনো টাস্ক নেই।</div>
                        )}
                    </div>
                    {/* Pagination */}
                    <div className="flex justify-center items-center space-x-4 mt-8">
                        <button
                            onClick={() => {
                                if (currentPage > 1) {
                                    setCurrentPage(currentPage - 1);
                                    loadTasks(lastLoadedKeys[currentPage - 2], true);
                                }
                            }}
                            disabled={currentPage === 1 || loadingTasks}
                            className="bg-blue-600 text-white font-semibold p-3 rounded-full transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        <div className="text-lg font-semibold text-gray-700">
                            পেজ {currentPage}
                        </div>
                        <button
                            onClick={() => {
                                setCurrentPage(currentPage + 1);
                                loadTasks(lastLoadedKeys[lastLoadedKeys.length - 1]);
                            }}
                            disabled={tasks.length < taskLimit || loadingTasks}
                            className="bg-blue-600 text-white font-semibold p-3 rounded-full transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <i className="fas fa-chevron-right"></i>
                        </button>
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
}

