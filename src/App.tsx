/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  Heart, 
  ShoppingCart, 
  Phone, 
  MessageCircle, 
  CheckCircle2, 
  Star, 
  Clock, 
  MapPin, 
  Filter, 
  X, 
  ChevronRight, 
  Eye, 
  Trash2,
  Plus,
  Minus,
  ArrowUpDown,
  Laptop,
  LayoutGrid,
  Columns,
  Mail,
  Quote
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from './firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';

// --- Constants ---
const SMOOTH_TRANSITION = { type: "spring", damping: 30, stiffness: 300 };
const SIDEBAR_TRANSITION = { type: "spring", damping: 35, stiffness: 300 };
const EASE_OUT_QUINT = [0.23, 1, 0.32, 1];

// --- Types ---
interface LaptopData {
  id: number;
  name: string;
  price: number;
  condition: string;
  brand: string;
  cpu: string;
  ram: string;
  storage: string;
  screen: string;
  location: string;
  image?: string;
}

// --- Components ---
const SmartImage = ({ src, alt, className, priority = false }: { src?: string, alt: string, className?: string, priority?: boolean }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  
  const displaySrc = src || '';

  if (!displaySrc || failed) {
    return (
      <div className={`${className} flex items-center justify-center bg-slate-100 text-slate-300`}>
        <Laptop className="w-12 h-12" />
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-100 animate-shimmer" />
      )}
      <motion.img 
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        src={displaySrc} 
        alt={alt} 
        className="w-full h-full object-cover" 
        onLoad={() => setIsLoaded(true)}
        onError={() => setFailed(true)}
        loading={priority ? "eager" : "lazy"}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

interface CartItem extends LaptopData {
  quantity: number;
}

interface Review {
  id: number;
  name: string;
  text: string;
  rating: number;
  date: string;
}

// --- Data ---
const reviews: Review[] = [
  { id: 1, name: "Tunde", text: "He's real. Quite polite and friendly. Recommended", rating: 5, date: "19/03/26" },
  { id: 2, name: "James Akor", text: "He's customer service is great and deal was very fair. Thank you sir", rating: 5, date: "11/03/25" },
  { id: 3, name: "Klaysab Filmz", text: "This man he's a wonderful person just as he said was what i got. I am enjoying my laptop 💻, he's 100% sure man", rating: 5, date: "23/04/23" },
  { id: 4, name: "Nnaemeka Ofonagoro", text: "Yaksonthreesons is a legit place to get your laptop pcs. P.s he's sales girls are nice and helpful.", rating: 5, date: "16/01/23" },
  { id: 5, name: "Ralph Kenny", text: "The deal went well. The seller was very friendly and accomodating. I got exactly what i wanted. Great deal at the end. I am giving him 5 star.", rating: 5, date: "16/12/22" }
];
const laptops: LaptopData[] = [
  { id: 1, name: "HP Pavilion 15-Cs3063cl", price: 700000, condition: "Open Box", brand: "HP", cpu: "Intel Core i5", ram: "8GB", storage: "512GB SSD", screen: "15.6\"", location: "Abuja, Wuse 2", image: "https://github.com/user-attachments/assets/33b3643d-c04f-4e0e-8f0b-6b41984c0f1b" },
  { id: 2, name: "HP Pavilion 15t", price: 380000, condition: "Open Box", brand: "HP", cpu: "Intel Core i5", ram: "12GB", storage: "512GB SSD", screen: "15.6\"", location: "Abuja, Wuse", image: "https://github.com/user-attachments/assets/17b7f109-4061-472c-9ad0-f380650cdcba" },
  { id: 3, name: "Apple MacBook Air 2015", price: 300000, condition: "Open Box", brand: "Apple", cpu: "Intel Core i5", ram: "8GB", storage: "128GB SSD", screen: "13.3\"", location: "Abuja, Wuse", image: "https://github.com/user-attachments/assets/d44ab953-19d2-45fc-81bf-8e274d0baf47" },
  { id: 4, name: "HP EliteBook 840 G7", price: 500000, condition: "Open Box", brand: "HP", cpu: "Intel Core i5", ram: "8GB", storage: "256GB SSD", screen: "13.3\"", location: "Abuja, Wuse", image: "https://github.com/user-attachments/assets/25e09e66-b0ac-41e1-bc38-66fcc4875afb" },
  { id: 5, name: "HP 15", price: 350000, condition: "Open Box", brand: "HP", cpu: "Intel Core i5", ram: "8GB", storage: "1TB HDD", screen: "15.6\"", location: "Abuja, Wuse", image: "https://github.com/user-attachments/assets/dd13ae92-d30a-426c-ba4b-8796595de7ae" },
  { id: 6, name: "HP EliteBook 840 G5", price: 500000, condition: "Open Box", brand: "HP", cpu: "Intel Core i7", ram: "16GB", storage: "512GB SSD", screen: "14\"", location: "Abuja, Wuse", image: "https://github.com/user-attachments/assets/d907ebe7-5775-4ed4-a423-e8df21ffa875" },
  { id: 7, name: "Apple MacBook Pro 2014", price: 450000, condition: "Open Box", brand: "Apple", cpu: "Intel Core i7", ram: "16GB", storage: "256GB SSD", screen: "15.6\"", location: "Abuja, Wuse", image: "" },
  { id: 8, name: "Apple MacBook Pro 2018", price: 850000, condition: "Open Box", brand: "Apple", cpu: "Intel Core i7", ram: "16GB", storage: "512GB SSD", screen: "13.3\"", location: "Abuja, Wuse", image: "" },
  { id: 9, name: "HP Envy 14", price: 1000000, condition: "Open Box", brand: "HP", cpu: "Intel Core i7", ram: "16GB", storage: "1TB SSD", screen: "14\"", location: "Abuja, Wuse", image: "" }
];

// --- Hooks ---
const useAssetPreloader = (assets: { images: string[], videos: string[] }) => {
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isFontsLoaded, setIsFontsLoaded] = useState(false);

  useEffect(() => {
    // Wait for fonts to be ready
    if (document.fonts) {
      document.fonts.ready.then(() => {
        setIsFontsLoaded(true);
      });
    } else {
      // Fallback for older browsers
      setIsFontsLoaded(true);
    }
  }, []);

  useEffect(() => {
    let loadedCount = 0;
    const totalAssets = assets.images.length + assets.videos.length;

    if (totalAssets === 0) {
      if (isFontsLoaded) setIsReady(true);
      return;
    }

    const updateProgress = () => {
      loadedCount++;
      setProgress(Math.round((loadedCount / totalAssets) * 100));
      if (loadedCount === totalAssets && isFontsLoaded) {
        // Add a small delay for smooth transition
        setTimeout(() => setIsReady(true), 800);
      }
    };

    // Preload Images
    assets.images.forEach(src => {
      if (!src) {
        updateProgress();
        return;
      }
      const img = new Image();
      img.src = src;
      img.onload = updateProgress;
      img.onerror = updateProgress;
    });

    // Preload Videos
    assets.videos.forEach(src => {
      if (!src) {
        updateProgress();
        return;
      }
      const video = document.createElement('video');
      video.src = src;
      video.preload = 'auto';
      video.oncanplaythrough = updateProgress;
      video.onerror = updateProgress;
    });

    // Safety timeout: force ready after 15 seconds if assets are hanging
    const safetyTimeout = setTimeout(() => {
      if (!isReady) setIsReady(true);
    }, 15000);

    return () => clearTimeout(safetyTimeout);
  }, [assets, isFontsLoaded]);

  return { progress, isReady: isReady && isFontsLoaded };
};

const useScrollProgress = () => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const updateScroll = () => {
      const currentScroll = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight) {
        setProgress(currentScroll / scrollHeight);
      }
    };
    window.addEventListener('scroll', updateScroll);
    return () => window.removeEventListener('scroll', updateScroll);
  }, []);
  return progress;
};

// --- Helper Components ---
const EditableText = ({ id, defaultText, className, element: Element = 'span' }: { id: string, defaultText: string, className?: string, element?: any }) => {
  const [text, setText] = useState(defaultText);

  useEffect(() => {
    const unsubText = onSnapshot(doc(db, 'site_content', id), (doc) => {
      if (doc.exists()) setText(doc.data().text);
    });
    return () => unsubText();
  }, [id]);

  return <Element className={className}>{text}</Element>;
};


const Logo = ({ className = "w-6 h-6" }: { className?: string }) => {
  return (
    <div className="relative">
      <SmartImage 
        src="https://github.com/user-attachments/assets/fce1f9fe-ed54-4a21-bf27-035ebee54405" 
        alt="Yakson Logo" 
        className={`${className} object-contain`}
        priority
      />
    </div>
  );
};

const FormatCurrency = ({ amount }: { amount: number }) => {
  return (
    <span className="font-bold text-emerald-600">
      ₦{amount.toLocaleString('en-NG')}
    </span>
  );
};

const ProductCardSkeleton = () => (
  <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm flex flex-col h-full animate-pulse">
    <div className="h-64 bg-slate-100 relative overflow-hidden">
      <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
    <div className="p-7 flex-1 space-y-4">
      <div className="flex justify-between">
        <div className="h-3 bg-slate-100 rounded w-1/4" />
        <div className="h-5 bg-slate-100 rounded w-1/5" />
      </div>
      <div className="h-6 bg-slate-100 rounded w-3/4" />
      <div className="flex gap-2">
        <div className="h-4 bg-slate-100 rounded w-12" />
        <div className="h-4 bg-slate-100 rounded w-16" />
      </div>
      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="h-3 bg-slate-50 rounded w-full" />
        <div className="h-3 bg-slate-50 rounded w-full" />
        <div className="h-3 bg-slate-50 rounded w-full" />
        <div className="h-3 bg-slate-50 rounded w-full" />
      </div>
      <div className="pt-6 flex justify-between items-center">
        <div className="h-8 bg-slate-100 rounded w-1/3" />
        <div className="h-12 bg-slate-100 rounded-2xl w-1/2" />
      </div>
    </div>
  </div>
);

interface ProductCardProps {
  laptop: LaptopData;
  onAddToCart: (l: LaptopData, e: React.MouseEvent) => void;
  onToggleWishlist: (id: number) => void;
  isWishlisted: boolean;
  onQuickView: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const ProductCard: React.FC<ProductCardProps> = React.memo(({ 
  laptop, 
  onAddToCart, 
  onToggleWishlist, 
  isWishlisted, 
  onQuickView,
  onMouseEnter,
  onMouseLeave
}) => {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ 
        layout: SMOOTH_TRANSITION,
        opacity: { duration: 0.4, ease: EASE_OUT_QUINT },
        scale: { duration: 0.4, ease: EASE_OUT_QUINT }
      }}
      whileHover={{ 
        y: -12,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 15px 20px -10px rgba(0, 0, 0, 0.08)"
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onQuickView}
      className="group bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col will-change-transform cursor-pointer"
    >
      {/* Image Area */}
      <div className="relative h-64 overflow-hidden bg-slate-50">
        <SmartImage 
          src={laptop.image} 
          alt={laptop.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="absolute top-5 left-5 flex flex-col gap-2">
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md ${
            laptop.condition === 'Brand New' ? 'bg-emerald-500/90 text-white' : 'bg-orange-500/90 text-white'
          }`}>
            {laptop.condition}
          </span>
          {laptop.price > 800000 && (
            <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-secondary/90 text-primary shadow-lg backdrop-blur-md">
              Premium
            </span>
          )}
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(laptop.id);
          }}
          className={`absolute top-5 right-5 p-2.5 rounded-full shadow-lg backdrop-blur-md transition-all active:scale-90 z-10 ${
            isWishlisted ? 'bg-rose-500 text-white' : 'bg-white/80 text-slate-900 hover:bg-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
        <div className="absolute bottom-5 left-5 right-5 translate-y-16 group-hover:translate-y-0 transition-transform duration-500 ease-out z-10">
          <button 
            onClick={onQuickView}
            className="w-full bg-white text-slate-900 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xl hover:bg-emerald-600 hover:text-white transition-all"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-7 flex-1 flex flex-col relative">
        <div className="flex justify-between items-start mb-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            {laptop.brand}
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              <Clock className="w-3 h-3" />
              Fast Reply
            </div>
          </div>
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-2 line-clamp-1 group-hover:text-emerald-700 transition-colors">
          {laptop.name}
        </h3>
        
        {/* Seller Feedback Summary */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
            <Star className="w-3 h-3 text-amber-500 fill-current" />
            <span className="ml-1.5 text-[11px] font-black text-slate-900">4.8</span>
          </div>
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/50 px-2 py-1 rounded-lg">94% Positive</span>
        </div>

        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[11px] text-slate-500 mb-6 font-bold">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            <span>{laptop.cpu}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            <span>{laptop.ram}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            <span>{laptop.storage}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            <span>{laptop.screen}</span>
          </div>
        </div>
        
        <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Price</span>
            <div className="text-xl font-black text-emerald-600">
              ₦{laptop.price.toLocaleString()}
            </div>
          </div>
          <button 
            onClick={(e) => onAddToCart(laptop, e)}
            className="group/btn relative bg-slate-900 hover:bg-emerald-600 text-white p-4 rounded-[1.25rem] transition-all active:scale-90 shadow-xl shadow-slate-200 overflow-hidden"
          >
            <ShoppingCart className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
});

const TableGallery = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const tablePics = [
    "https://github.com/user-attachments/assets/9408c2ca-a18a-4501-8c54-e0436aadb60e",
    "https://github.com/user-attachments/assets/e8ca762a-0c06-4572-9153-c5a0ac7ef143",
    "https://github.com/user-attachments/assets/65244a93-5b13-471a-8ed9-898f6b6ce7c9",
    "https://github.com/user-attachments/assets/a7f68586-db45-4254-a929-f4612dca1fe5",
    "https://github.com/user-attachments/assets/d45b80f5-c511-446d-8cab-ea0e16f4de72",
    "https://github.com/user-attachments/assets/93662dd3-a777-4217-ac71-c73c767ecfac",
  ];

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[500px] md:h-[700px] bg-[#e5e7eb] overflow-hidden rounded-[2.5rem] md:rounded-[4rem] border-4 md:border-8 border-white shadow-[inset_0_10px_40px_rgba(0,0,0,0.1)] mb-20 group/table"
    >
      {/* Table Texture/Pattern */}
      <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
      
      {/* Table Label */}
      <div className="absolute top-6 md:top-10 left-1/2 -translate-x-1/2 z-50">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/90 backdrop-blur-xl px-4 md:px-8 py-2 md:py-3 rounded-xl md:rounded-2xl shadow-2xl border border-slate-200 flex items-center gap-2 md:gap-3"
        >
          <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] md:text-xs font-black text-slate-900 uppercase tracking-[0.2em] md:tracking-[0.4em]">Interactive Table Gallery</span>
        </motion.div>
      </div>

      {/* Scattered Cards */}
      <div className="absolute inset-0">
        {dimensions.width > 0 && tablePics.map((src, index) => {
          const isMobile = dimensions.width < 768;
          const cardW = isMobile ? 120 : 224;
          const cardH = isMobile ? 160 : 288;
          
          // Responsive initial positions
          const cols = isMobile ? 2 : 3;
          const col = index % cols;
          const row = Math.floor(index / cols);
          
          const initialX = isMobile 
            ? (col * (dimensions.width / cols)) + (dimensions.width / cols - cardW) / 2
            : (col * (dimensions.width / cols)) + (dimensions.width / cols - cardW) / 2;
          const initialY = isMobile
            ? (row * (dimensions.height / 3)) + (dimensions.height / 3 - cardH) / 2
            : (row * (dimensions.height / 2)) + (dimensions.height / 2 - cardH) / 2;

          return (
            <motion.div
              key={index}
              drag
              dragConstraints={{
                left: -cardW / 2,
                right: dimensions.width - cardW / 2,
                top: -cardH / 2,
                bottom: dimensions.height - cardH / 2
              }}
              dragElastic={0.4}
              dragMomentum={true}
              dragTransition={{ bounceStiffness: 400, bounceDamping: 20 }}
              initial={{ 
                x: initialX, 
                y: initialY, 
                rotate: (index % 2 === 0 ? 1 : -1) * (index * 4 + 4) 
              }}
              whileDrag={{ 
                scale: 1.1, 
                rotate: 0,
                zIndex: 100,
                boxShadow: "0 40px 80px -15px rgba(0,0,0,0.3)" 
              }}
              className="absolute w-[120px] h-[160px] md:w-56 md:h-72 bg-white p-1.5 md:p-3 rounded-xl md:rounded-2xl shadow-2xl cursor-grab active:cursor-grabbing border border-slate-100 will-change-transform"
            >
              <div className="w-full h-full rounded-lg md:rounded-xl overflow-hidden bg-slate-50 relative group/card">
                <SmartImage src={src} alt={`Table Pic ${index + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />
                <div className="absolute bottom-2 md:bottom-3 left-2 md:left-3 right-2 md:right-3 text-white opacity-0 group-hover/card:opacity-100 transition-opacity">
                  <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Table Pic {index + 1}</p>
                </div>
              </div>
              {/* Realistic Card Shadow */}
              <div className="absolute -inset-1 bg-black/5 blur-xl -z-10 rounded-2xl" />
            </motion.div>
          );
        })}
      </div>

      {/* Table Edge Shadow */}
      <div className="absolute inset-x-0 bottom-0 h-16 md:h-24 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
    </div>
  );
};

// --- Helper Components ---
const FilterSection = ({ 
  title, 
  options, 
  field, 
  filters, 
  setFilters 
}: { 
  title: string, 
  options: string[], 
  field: string, 
  filters: any, 
  setFilters: any 
}) => (
  <div className="mb-6">
    <h4 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">{title}</h4>
    <div className="space-y-2">
      {options.map(opt => (
        <label key={opt} className="flex items-center group cursor-pointer">
          <input 
            type="checkbox" 
            className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            checked={(filters[field] as string[]).includes(opt)}
            onChange={(e) => {
              const current = filters[field] as string[];
              if (e.target.checked) {
                setFilters({ ...filters, [field]: [...current, opt] });
              } else {
                setFilters({ ...filters, [field]: current.filter((i: string) => i !== opt) });
              }
            }}
          />
          <span className="ml-2 text-sm text-slate-600 group-hover:text-emerald-600 transition-colors">{opt}</span>
        </label>
      ))}
    </div>
  </div>
);

const ReviewSlider = React.memo(() => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden bg-white rounded-[2.5rem] border border-slate-100 p-8 md:p-12 shadow-xl shadow-slate-200/50 will-change-transform">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Quote className="w-32 h-32 text-emerald-600" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-8">
          <div className="flex text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-current" />
            ))}
          </div>
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Verified Feedback</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.6, ease: EASE_OUT_QUINT }}
            className="min-h-[120px]"
          >
            <p className="text-xl md:text-2xl font-bold text-slate-900 leading-relaxed italic mb-8">
              "{reviews[currentIndex].text}"
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-black text-lg">
                  {reviews[currentIndex].name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-black text-slate-900">{reviews[currentIndex].name}</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verified Buyer • {reviews[currentIndex].date}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {reviews.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i === currentIndex ? 'w-8 bg-emerald-600' : 'bg-slate-200 hover:bg-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
});

const PriceSectionSlider = ({ 
  title, 
  items, 
  icon: Icon,
  onAddToCart,
  onToggleWishlist,
  wishlist,
  onQuickView,
  onMouseEnter,
  onMouseLeave
}: { 
  title: string, 
  items: LaptopData[], 
  icon: any,
  onAddToCart: (laptop: LaptopData, e: React.MouseEvent) => void,
  onToggleWishlist: (id: number) => void,
  wishlist: number[],
  onQuickView: (id: number) => void,
  onMouseEnter: () => void,
  onMouseLeave: () => void
}) => {
  if (items.length === 0) return null;
  
  return (
    <div className="mb-16 last:mb-0">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-100 rounded-xl">
          <Icon className="w-5 h-5 text-emerald-600" />
        </div>
        <h3 className="text-xl font-black text-slate-900 tracking-tight">
          {title} <span className="text-slate-400 font-bold ml-2">({items.length})</span>
        </h3>
      </div>
      <div className="relative group/slider">
        <div className="flex overflow-x-auto gap-8 pb-8 snap-x snap-mandatory no-scrollbar scroll-smooth">
          {items.map(laptop => (
            <div key={laptop.id} className="flex-shrink-0 w-[300px] sm:w-[350px] snap-center">
              <ProductCard 
                laptop={laptop} 
                onAddToCart={onAddToCart}
                onToggleWishlist={onToggleWishlist}
                isWishlisted={wishlist.includes(laptop.id)}
                onQuickView={() => onQuickView(laptop.id)}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
              />
            </div>
          ))}
        </div>
        {/* Visual Indicator for Horizontal Scroll */}
        <div className="absolute -bottom-2 left-0 flex items-center gap-2">
          <div className="w-8 h-1 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-emerald-500"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Swipe</span>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  // --- State ---
  const [dbLaptops, setDbLaptops] = useState<LaptopData[]>([]);

  useEffect(() => {
    const unsubLaptops = onSnapshot(query(collection(db, 'laptops'), orderBy('price', 'desc')), (snapshot) => {
      const items: LaptopData[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id as any, ...doc.data() } as LaptopData);
      });
      setDbLaptops(items);
    });

    return () => {
      unsubLaptops();
    };
  }, []);

  const allLaptops = useMemo(() => dbLaptops.length > 0 ? dbLaptops : laptops, [dbLaptops]);

  // Assets to preload
  const assetsToPreload = useMemo(() => ({
    images: [
      "https://github.com/user-attachments/assets/fce1f9fe-ed54-4a21-bf27-035ebee54405", // Logo
      "https://github.com/user-attachments/assets/eca61550-3dad-4abd-9837-2358c9b3cef4", // Hero
      "https://github.com/user-attachments/assets/23d7e7eb-0a89-4ff5-9b06-02e185540cdf", // About
      "https://github.com/user-attachments/assets/33b3643d-c04f-4e0e-8f0b-6b41984c0f1b",
      "https://github.com/user-attachments/assets/17b7f109-4061-472c-9ad0-f380650cdcba",
      "https://github.com/user-attachments/assets/d44ab953-19d2-45fc-81bf-8e274d0baf47",
      "https://github.com/user-attachments/assets/25e09e66-b0ac-41e1-bc38-66fcc4875afb",
      "https://github.com/user-attachments/assets/dd13ae92-d30a-426c-ba4b-8796595de7ae",
      "https://github.com/user-attachments/assets/d907ebe7-5775-4ed4-a423-e8df21ffa875",
      "https://picsum.photos/seed/macpro2014/800/1000",
      "https://picsum.photos/seed/macpro2018/800/1000",
      "https://picsum.photos/seed/hpenvy14/800/1000",
      ...allLaptops.map(l => l.image).filter(Boolean) as string[]
    ],
    videos: [
      "https://github.com/user-attachments/assets/fa81ead4-66cc-4077-b760-77d4ce1be31f" // Jiji Video
    ]
  }), [allLaptops]);

  const { progress: loadProgress, isReady: assetsReady } = useAssetPreloader(assetsToPreload);

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('yakson_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [wishlist, setWishlist] = useState<number[]>(() => {
    const saved = localStorage.getItem('yakson_wishlist');
    return saved ? JSON.parse(saved) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [quickViewId, setQuickViewId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    condition: [] as string[],
    brand: [] as string[],
    cpu: [] as string[],
    ram: [] as string[],
    storage: [] as string[],
    priceRange: [300000, 1000000] as [number, number],
  });
  const [sortBy, setSortBy] = useState<'low-high' | 'high-low' | 'default'>('default');
  const [viewMode, setViewMode] = useState<'grid' | 'slider'>('grid');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Sync isLoading with assetsReady
  useEffect(() => {
    if (assetsReady) {
      setIsLoading(false);
    }
  }, [assetsReady]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isHovering, setIsHovering] = useState(false);

  const phrases = ["Trusted Laptops Nationwide", "Open Box & Brand New", "Honest Form & Real Guaranty"];

  // --- Effects ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('yakson_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('yakson_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // --- Logic ---
  const filteredLaptops = useMemo(() => {
    let result = allLaptops.filter(laptop => {
      const matchesSearch = laptop.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          laptop.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCondition = filters.condition.length === 0 || filters.condition.includes(laptop.condition);
      const matchesBrand = filters.brand.length === 0 || filters.brand.includes(laptop.brand);
      const matchesCpu = filters.cpu.length === 0 || filters.cpu.some(c => laptop.cpu.includes(c));
      const matchesRam = filters.ram.length === 0 || filters.ram.includes(laptop.ram);
      const matchesStorage = filters.storage.length === 0 || filters.storage.includes(laptop.storage);
      const matchesPrice = laptop.price >= filters.priceRange[0] && laptop.price <= filters.priceRange[1];

      return matchesSearch && matchesCondition && matchesBrand && matchesCpu && matchesRam && matchesStorage && matchesPrice;
    });

    if (sortBy === 'low-high') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'high-low') {
      result.sort((a, b) => b.price - a.price);
    }

    return result.slice(0, 6);
  }, [searchQuery, filters, sortBy]);

  const [isCartShaking, setIsCartShaking] = useState(false);

  const addToCart = (laptop: LaptopData, e: React.MouseEvent) => {
    setIsCartShaking(true);
    setTimeout(() => setIsCartShaking(false), 500);

    // Ripple Effect
    const button = e.currentTarget as HTMLButtonElement;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.classList.add('ripple');
    
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);

    setCart(prev => {
      const existing = prev.find(item => item.id === laptop.id);
      if (existing) {
        return prev.map(item => item.id === laptop.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...laptop, quantity: 1 }];
    });
    
    // Visual confirmation
    const originalContent = button.innerHTML;
    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>';
    button.classList.add('bg-emerald-500');
    
    setTimeout(() => {
      button.innerHTML = originalContent;
      button.classList.remove('bg-emerald-500');
    }, 1500);

    setIsCartOpen(true);
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const orderRef = `YAK-${Math.random().toString(36).toUpperCase().substring(2, 8)}`;
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    let message = `*New Order from YaksonThreeSons Ltd*\n`;
    message += `Order Ref: #${orderRef}\n`;
    message += `--------------------------\n\n`;
    
    cart.forEach((item, index) => {
      const subtotal = item.price * item.quantity;
      message += `${index + 1}. *${item.name}*\n`;
      message += `   Qty: ${item.quantity} x ₦${item.price.toLocaleString()}\n`;
      message += `   Subtotal: ₦${subtotal.toLocaleString()}\n\n`;
    });
    
    message += `--------------------------\n`;
    message += `*Total Amount: ₦${total.toLocaleString()}*\n\n`;
    message += `Please confirm this order by replying with *'CONFIRM'*.\n`;
    message += `I'll provide payment details once confirmed. Thank you!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/2347013306552?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const getWhatsAppProductUrl = (laptop: LaptopData) => {
    const message = `Hi YaksonThreeSons Ltd, I'm interested in the *${laptop.name}* (₦${laptop.price.toLocaleString()}). Is it still available?`;
    return `https://wa.me/2347013306552?text=${encodeURIComponent(message)}`;
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const toggleWishlist = (id: number) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const clearFilters = () => {
    setFilters({
      condition: [],
      brand: [],
      cpu: [],
      ram: [],
      storage: [],
      priceRange: [300000, 1000000],
    });
    setSearchQuery('');
    setSortBy('default');
  };

  const quickViewLaptop = allLaptops.find(l => l.id === quickViewId);

  // --- Price Grouping for Slider ---
  const groupedLaptops = useMemo(() => {
    return {
      budget: filteredLaptops.filter(l => l.price < 450000),
      mid: filteredLaptops.filter(l => l.price >= 450000 && l.price < 700000),
      premium: filteredLaptops.filter(l => l.price >= 700000)
    };
  }, [filteredLaptops]);

  const scrollProgress = useScrollProgress();
  const heroY = scrollProgress * 200;

  return (
    <div className="min-h-screen bg-warm-bg font-sans text-slate-900 noise-bg">
      {/* Full Page Preloader */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="preloader"
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0,
              scale: 1.1,
              filter: "blur(20px)",
              transition: { duration: 1.2, ease: [0.23, 1, 0.32, 1] }
            }}
            className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.2, 0.1],
                  rotate: [0, 90, 0]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-1/2 -left-1/2 w-full h-full bg-emerald-500/10 rounded-full blur-[120px]"
              />
              <motion.div 
                animate={{ 
                  scale: [1.2, 1, 1.2],
                  opacity: [0.1, 0.15, 0.1],
                  rotate: [0, -90, 0]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-emerald-600/10 rounded-full blur-[120px]"
              />
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, ease: EASE_OUT_QUINT }}
              className="flex flex-col items-center relative z-10"
            >
              <div className="relative mb-12 group">
                <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
                <Logo className="w-24 h-24 text-emerald-500 relative z-10 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-6 border border-emerald-500/20 border-t-emerald-500 rounded-full"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-10 border border-emerald-500/10 border-b-emerald-500/30 rounded-full"
                />
              </div>

              <div className="text-center mb-12">
                <motion.h2 
                  initial={{ letterSpacing: "0.2em", opacity: 0 }}
                  animate={{ letterSpacing: "0.5em", opacity: 1 }}
                  transition={{ duration: 1.5, ease: EASE_OUT_QUINT }}
                  className="text-3xl font-black text-white uppercase mb-4"
                >
                  YaksonThreeSons
                </motion.h2>
                <div className="flex items-center justify-center gap-4">
                  <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-emerald-500/50" />
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Premium Tech Experience</span>
                  <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-emerald-500/50" />
                </div>
              </div>
              
              {/* Progress Bar Container */}
              <div className="w-80 relative">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest">System Initialization</span>
                  <span className="text-xl font-black text-white tabular-nums">{loadProgress}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden backdrop-blur-sm">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${loadProgress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" />
                  </motion.div>
                </div>
                <div className="mt-4 flex flex-col items-center gap-2">
                  <motion.p 
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]"
                  >
                    {loadProgress < 30 ? "Calibrating Interface..." : 
                     loadProgress < 60 ? "Optimizing Visual Assets..." : 
                     loadProgress < 90 ? "Finalizing Premium Experience..." : 
                     "Ready for Entry"}
                  </motion.p>
                </div>
              </div>
            </motion.div>

            {/* Bottom Branding */}
            <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-4 opacity-40">
              <div className="flex items-center gap-6">
                <span className="text-[8px] font-black text-white uppercase tracking-[0.5em]">Abuja</span>
                <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                <span className="text-[8px] font-black text-white uppercase tracking-[0.5em]">Lagos</span>
                <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                <span className="text-[8px] font-black text-white uppercase tracking-[0.5em]">Nationwide</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-emerald-500 z-[100] origin-left"
        style={{ scaleX: useScrollProgress() }}
      />

      {/* --- Header --- */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 gap-8">
            {/* Logo */}
            <a href="#" className="flex items-center gap-3 flex-shrink-0 group">
              <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform flex items-center justify-center overflow-hidden">
                <Logo className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-none">YaksonThreeSons</h1>
                <p className="text-[8px] sm:text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mt-1">Honest Deals Only</p>
              </div>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <a href="#" className="text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors">Home</a>
              <a href="#shop" className="text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors">Shop</a>
              <a href="#about" className="text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors">About</a>
              <a href="#reviews" className="text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors">Reviews</a>
              <a href="#footer" className="text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors">Contact</a>
            </nav>

            {/* Search Bar - Desktop Only */}
            <div className="hidden md:block flex-1 max-w-xs relative group/search">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within/search:text-emerald-600 transition-colors" />
              <input 
                type="text" 
                placeholder="Search laptops..." 
                className="w-full bg-slate-100 border-none rounded-full py-2 px-10 text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Icons */}
            <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
              <button 
                onClick={() => setIsWishlistOpen(true)}
                className="relative p-2 text-slate-600 hover:text-emerald-600 transition-all hover:scale-110"
              >
                <Heart className="w-5 h-5 sm:w-6 h-6" />
                {wishlist.length > 0 && (
                  <span className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
                    {wishlist.length}
                  </span>
                )}
              </button>

              <button 
                onClick={() => setIsCartOpen(true)}
                className={`relative p-2 text-slate-600 hover:text-emerald-600 transition-all hover:scale-110 ${isCartShaking ? 'animate-shake' : ''}`}
              >
                <ShoppingCart className="w-5 h-5 sm:w-6 h-6" />
                {cart.length > 0 && (
                  <span className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
                    {cart.reduce((acc, item) => acc + item.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* --- Hero Section --- */}
        <section className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-slate-950">
          <motion.div 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ 
              scale: [1.1, 1.2],
              opacity: 0.6,
              y: heroY
            }}
            transition={{ 
              opacity: { duration: 2, ease: EASE_OUT_QUINT },
              scale: { duration: 20, repeat: Infinity, repeatType: "reverse", ease: "linear" },
              y: { type: "spring", damping: 30, stiffness: 100 }
            }}
            className="absolute inset-0"
          >
            <SmartImage 
              src="https://github.com/user-attachments/assets/eca61550-3dad-4abd-9837-2358c9b3cef4" 
              alt="Premium Laptops" 
              className="w-full h-full object-cover brightness-[0.8] contrast-[1.1]"
              priority
            />
          </motion.div>
          
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/40 to-slate-950" />
          <div className="absolute inset-0 bg-slate-950/20" />
          
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: EASE_OUT_QUINT }}
            >
              <span className="inline-block bg-emerald-500/20 text-emerald-400 text-xs font-black px-4 py-2 rounded-full uppercase tracking-[0.3em] mb-6 backdrop-blur-sm border border-emerald-500/30">
                <EditableText id="hero-tag" defaultText="Nigeria's #1 Laptop Plug" />
              </span>
              <h1 className="text-5xl md:text-8xl font-black text-white mb-8 tracking-tight leading-[1.1]">
                <EditableText id="hero-title" defaultText="Nigeria's Most Trusted Laptop Plug." />
              </h1>
              <p className="text-lg md:text-xl text-slate-300 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
                <EditableText id="hero-desc" defaultText="Discover our curated selection of high-performance laptops. Verified hardware, real warranties, and the best prices in Nigeria." />
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <a 
                  href="#shop"
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black px-10 py-5 rounded-2xl transition-all shadow-2xl shadow-emerald-500/20 active:scale-95 text-lg"
                >
                  Start Shopping
                </a>
                <div className="w-full sm:w-auto relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search by brand or model..." 
                    className="w-full sm:w-80 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-5 pl-12 pr-6 text-white placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:bg-white/20 transition-all outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Scroll Indicator */}
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/30"
          >
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-1">
              <div className="w-1 h-2 bg-white/30 rounded-full" />
            </div>
          </motion.div>
        </section>

        {/* --- Features Section --- */}
        <section className="py-24 bg-white border-b border-slate-100 content-visibility-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">
                  <EditableText id="feat1-title" defaultText="Verified Hardware" />
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  <EditableText id="feat1-desc" defaultText="Every laptop undergoes a rigorous 25-point diagnostic check before listing." />
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">
                  <EditableText id="feat2-title" defaultText="14-Day Warranty" />
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  <EditableText id="feat2-desc" defaultText="Shop with confidence. We offer a real hardware warranty on all our products." />
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-6">
                  <MapPin className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">
                  <EditableText id="feat3-title" defaultText="Nationwide Delivery" />
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  <EditableText id="feat3-desc" defaultText="Fast and secure delivery across Nigeria, or visit our physical location in Abuja." />
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- About / Our Story Section --- */}
        <section id="about" className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="lg:flex">
                <div className="lg:w-1/2 p-12 md:p-20">
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-8 inline-block">Our Story</span>
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 leading-tight">
                    <EditableText id="about-title" defaultText='"We operate in honest form and our guaranty is real"' />
                  </h2>
                  <p className="text-lg text-slate-600 mb-10 leading-relaxed">
                    <EditableText id="about-desc" defaultText="YaksonThreeSons Ltd was founded on the principle of transparency. In a market full of uncertainty, we provide Nigeria with a reliable source for high-quality computing." />
                  </p>
                  
                  <div className="grid grid-cols-2 gap-8 mb-12">
                    <div>
                      <h4 className="text-3xl font-black text-emerald-600 mb-1">94%</h4>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Positive Feedback</p>
                    </div>
                    <div>
                      <h4 className="text-3xl font-black text-emerald-600 mb-1">5+ Yrs</h4>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">In Business</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <a 
                      href="https://wa.me/2347013306552" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-lg shadow-emerald-200 active:scale-95"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Chat with Founder
                    </a>
                    <div className="flex flex-col gap-2">
                      <a href="tel:07013306552" className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-black px-8 py-4 rounded-2xl transition-all active:scale-95">
                        <Phone className="w-5 h-5" />
                        07013306552
                      </a>
                      <a href="tel:07041533750" className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-black px-8 py-4 rounded-2xl transition-all active:scale-95">
                        <Phone className="w-5 h-5" />
                        07041533750
                      </a>
                    </div>
                  </div>

                  <div className="mt-12 pt-8 border-t border-slate-100">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-2">CEO & Founder</p>
                    <p className="text-2xl font-black text-slate-900">Mr Ugwoke James</p>
                  </div>
                </div>
                <div className="lg:w-1/2 bg-slate-900 relative min-h-[400px]">
                  <SmartImage 
                    src="https://github.com/user-attachments/assets/23d7e7eb-0a89-4ff5-9b06-02e185540cdf" 
                    alt="Cutting Edge Technology" 
                    className="w-full h-full object-cover"
                    priority
                  />
                  <div className="absolute inset-0 flex items-center justify-center p-12">
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[2rem] text-white">
                      <Quote className="w-10 h-10 text-emerald-500 mb-6" />
                      <p className="text-xl font-bold italic leading-relaxed mb-6">
                        <EditableText id="about-quote" defaultText='"The best laptop plug in Nigeria. Honest deals always. I got exactly what I wanted and the customer service was top-notch."' />
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center font-black">V</div>
                        <div>
                          <p className="font-black">Verified Buyer</p>
                          <p className="text-xs text-white/60">
                            <EditableText id="about-quote-sub" defaultText="Purchased HP EliteBook 840" />
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- Shop Section --- */}
        <section id="shop" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Table Gallery Section */}
            <TableGallery />

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
              <div>
                <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">
                  <EditableText id="shop-title" defaultText="Explore Our Collection" />
                </h2>
                <p className="text-slate-500 font-medium">
                  <EditableText id="shop-desc" defaultText="Find the perfect laptop for your needs and budget." />
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <LayoutGrid className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setViewMode('slider')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'slider' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Columns className="w-5 h-5" />
                  </button>
                </div>
                
                <button 
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-2 bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-800 transition-all"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-28 space-y-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-900">Filters</h3>
                <button 
                  onClick={clearFilters}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
                >
                  Clear All
                </button>
              </div>

              <FilterSection title="Condition" options={["Open Box", "Brand New"]} field="condition" filters={filters} setFilters={setFilters} />
              <FilterSection title="Brand" options={["HP", "Apple", "Dell", "Lenovo"]} field="brand" filters={filters} setFilters={setFilters} />
              <FilterSection title="CPU" options={["i3", "i5", "i7"]} field="cpu" filters={filters} setFilters={setFilters} />
              <FilterSection title="RAM" options={["8GB", "12GB", "16GB"]} field="ram" filters={filters} setFilters={setFilters} />
              <FilterSection title="Storage" options={["128GB SSD", "256GB SSD", "512GB SSD", "1TB SSD", "1TB HDD"]} field="storage" filters={filters} setFilters={setFilters} />

              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Price Range</h4>
                <div className="space-y-4">
                  <input 
                    type="range" 
                    min="300000" 
                    max="1000000" 
                    step="50000"
                    className="w-full accent-emerald-600"
                    value={filters.priceRange[1]}
                    onChange={(e) => setFilters({ ...filters, priceRange: [300000, parseInt(e.target.value)] })}
                  />
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>₦300k</span>
                    <span className="text-emerald-600">Up to ₦{(filters.priceRange[1]/1000).toFixed(0)}k</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl text-sm font-bold text-slate-700"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
                <p className="text-sm font-bold text-slate-500">
                  Showing <span className="text-slate-900">{filteredLaptops.length}</span> laptops
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode('slider')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'slider' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Slider View"
                  >
                    <Columns className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                  <ArrowUpDown className="w-4 h-4 text-slate-400" />
                  <select 
                    className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 py-0"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                    <option value="default">Sort by: Featured</option>
                    <option value="low-high">Price: Low to High</option>
                    <option value="high-low">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Product Grid / Slider */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-8 min-h-[600px]">
                {isLoading ? (
                  [...Array(6)].map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))
                ) : (
                  <AnimatePresence mode="popLayout">
                    {filteredLaptops.map(laptop => (
                      <ProductCard 
                        key={laptop.id} 
                        laptop={laptop} 
                        onAddToCart={addToCart}
                        onToggleWishlist={toggleWishlist}
                        isWishlisted={wishlist.includes(laptop.id)}
                        onQuickView={() => setQuickViewId(laptop.id)}
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => setIsHovering(false)}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            ) : (
              <div className="space-y-12 min-h-[600px]">
                {isLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-8 bg-slate-100 rounded w-48 mb-6" />
                      <div className="flex gap-8 overflow-hidden">
                        {[...Array(3)].map((_, j) => (
                          <div key={j} className="flex-shrink-0 w-[300px] h-[450px]">
                            <ProductCardSkeleton />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <PriceSectionSlider 
                      title="Budget Friendly" 
                      items={groupedLaptops.budget} 
                      icon={Clock} 
                      onAddToCart={addToCart}
                      onToggleWishlist={toggleWishlist}
                      wishlist={wishlist}
                      onQuickView={setQuickViewId}
                      onMouseEnter={() => setIsHovering(true)}
                      onMouseLeave={() => setIsHovering(false)}
                    />
                    <PriceSectionSlider 
                      title="Best Value" 
                      items={groupedLaptops.mid} 
                      icon={CheckCircle2} 
                      onAddToCart={addToCart}
                      onToggleWishlist={toggleWishlist}
                      wishlist={wishlist}
                      onQuickView={setQuickViewId}
                      onMouseEnter={() => setIsHovering(true)}
                      onMouseLeave={() => setIsHovering(false)}
                    />
                    <PriceSectionSlider 
                      title="Premium Selection" 
                      items={groupedLaptops.premium} 
                      icon={Star} 
                      onAddToCart={addToCart}
                      onToggleWishlist={toggleWishlist}
                      wishlist={wishlist}
                      onQuickView={setQuickViewId}
                      onMouseEnter={() => setIsHovering(true)}
                      onMouseLeave={() => setIsHovering(false)}
                    />
                    
                    {filteredLaptops.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="bg-slate-100 p-8 rounded-full mb-6">
                          <Search className="w-12 h-12 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">No laptops found</h3>
                        <p className="text-slate-500 mb-8 max-w-xs">We couldn't find any laptops matching your current filters.</p>
                        <button 
                          onClick={clearFilters}
                          className="bg-emerald-600 text-white font-bold px-8 py-3 rounded-2xl hover:bg-emerald-700 transition-colors"
                        >
                          Clear All Filters
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* View More Products on Jiji */}
            {!isLoading && filteredLaptops.length > 0 && (
              <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="relative flex flex-col justify-center p-12 rounded-[2.5rem] border border-slate-200 text-center lg:text-left overflow-hidden group/jiji">
                  {/* Background Video Space */}
                  <div className="absolute inset-0 z-0">
                    <video 
                      src="https://github.com/user-attachments/assets/fa81ead4-66cc-4077-b760-77d4ce1be31f" 
                      autoPlay 
                      muted 
                      loop 
                      playsInline
                      className="w-full h-full object-cover transition-transform duration-700 group-hover/jiji:scale-110"
                    />
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] group-hover/jiji:bg-white/70 transition-colors" />
                  </div>

                  <div className="relative z-10">
                    <div className="bg-emerald-600 w-16 h-16 flex items-center justify-center rounded-2xl shadow-lg shadow-emerald-200 mb-6 mx-auto lg:mx-0 overflow-hidden">
                      <Logo className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-3">Looking for more options?</h3>
                    <p className="text-slate-600 mb-8 max-w-md mx-auto lg:mx-0 font-medium">
                      We have a wider selection of premium laptops available on our official Jiji store. Check them out now!
                    </p>
                    <a 
                      href="https://jiji.ng/sellerpage-fm7yBLF4WlrLzuISjm9WZV5E" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group inline-flex items-center justify-center lg:justify-start gap-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-10 py-5 rounded-2xl transition-all shadow-xl shadow-emerald-200 active:scale-95 w-full sm:w-auto"
                    >
                      View More on Jiji
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </div>
                
                <ReviewSlider />
              </div>
            )}

            {filteredLaptops.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-slate-100 p-8 rounded-full mb-6">
                  <Search className="w-12 h-12 text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">No laptops found</h3>
                <p className="text-slate-500 mb-8 max-w-xs">We couldn't find any laptops matching your current filters.</p>
                <button 
                  onClick={clearFilters}
                  className="bg-emerald-600 text-white font-bold px-8 py-3 rounded-2xl hover:bg-emerald-700 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  </main>

      {/* --- Footer --- */}
      <motion.footer 
        id="footer" 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-white border-t border-slate-200 pt-20 pb-10 content-visibility-auto"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Logo className="w-8 h-8 text-emerald-600" />
                <h1 className="text-xl font-black text-slate-900 tracking-tight">YaksonThreeSons Ltd</h1>
              </div>
              <p className="text-slate-500 text-sm leading-relaxed">
                Nigeria's most trusted laptop dealer for over 5 years. We specialize in high-quality open box and brand new laptops with real guarantees.
              </p>
              <div className="flex gap-4">
                <a href="https://wa.me/2347013306552" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-emerald-600 hover:text-white transition-all">
                  <MessageCircle className="w-5 h-5" />
                </a>
                <a href="tel:07013306552" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-emerald-600 hover:text-white transition-all">
                  <Phone className="w-5 h-5" />
                </a>
                <a href="mailto:ugwokejames84@gmail.com" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-emerald-600 hover:text-white transition-all">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Quick Links</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-500">
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Home</a></li>
                <li><a href="#shop" className="hover:text-emerald-600 transition-colors">Shop Laptops</a></li>
                <li><a 
                  href="https://jiji.ng/sellerpage-fm7yBLF4WlrLzuISjm9WZV5E" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-emerald-600 transition-colors"
                >
                  View More on Jiji
                </a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Our Guaranty</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Verified Feedback</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Our Guaranty</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-500">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>14-Day Return Policy on all laptops</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>Real Hardware Warranty</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>Honest Condition Reporting</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Contact Info</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-500">
                <li className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>07013306552, 07041533750</span>
                </li>
                <li className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <a href="mailto:ugwokejames84@gmail.com" className="hover:text-emerald-600 transition-colors">ugwokejames84@gmail.com</a>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>Abuja, Wuse / Wuse 2, Nigeria</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-2 text-center md:text-left">
              <p className="text-xs font-bold text-slate-400">
                © 2026 YaksonThreeSons Ltd. Based on real customer feedback (46 good, 3 bad).
              </p>
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                Powered by <span className="text-emerald-500/80">Skepter Forge</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified on</span>
              <span className="text-sm font-black text-slate-900">Jiji</span>
            </div>
          </div>
        </div>
      </motion.footer>

      {/* --- Sidebars & Modals --- */}
      
      {/* Cart Sidebar */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
            />
            <motion.aside 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={SIDEBAR_TRANSITION}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6 text-emerald-600" />
                  <h3 className="text-xl font-black text-slate-900">Your Cart</h3>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="bg-slate-50 p-6 rounded-full mb-4">
                      <ShoppingCart className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="text-slate-500 font-bold">Your cart is empty</p>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="mt-4 text-emerald-600 font-black text-sm hover:underline"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-4 group">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 relative">
                        <SmartImage 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-black text-slate-900 mb-1 line-clamp-1">{item.name}</h4>
                        <div className="text-xs font-bold text-emerald-600 mb-2">
                          <FormatCurrency amount={item.price} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 bg-slate-100 rounded-lg px-2 py-1">
                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-emerald-600"><Minus className="w-3 h-3" /></button>
                            <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-emerald-600"><Plus className="w-3 h-3" /></button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-500">Subtotal</span>
                    <span className="text-xl font-black text-slate-900">
                      <FormatCurrency amount={cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)} />
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">
                    Contact YaksonThreeSons Ltd via WhatsApp to complete purchase
                  </p>
                  <button 
                    onClick={handleCheckout}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-200"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Checkout via WhatsApp
                  </button>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Floating Elements */}
      <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-4">
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: window.scrollY > 300 ? 1 : 0, scale: window.scrollY > 300 ? 1 : 0 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="p-4 bg-white text-emerald-600 rounded-full shadow-2xl border border-emerald-100 hover:bg-emerald-50 transition-colors"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <ArrowUpDown className="w-6 h-6 rotate-180" />
        </motion.button>
        
        <motion.a
          href="https://wa.me/2347013306552?text=Hi%20YaksonThreeSons%20Ltd%2C%20I%20have%20a%20question%20about%20your%20laptops."
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 bg-emerald-500 text-white rounded-full shadow-2xl animate-float hover:bg-emerald-600 transition-colors relative group"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-100">
            Chat with us!
          </span>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-ping" />
        </motion.a>
      </div>
      <AnimatePresence>
        {isWishlistOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsWishlistOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
            />
            <motion.aside 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={SIDEBAR_TRANSITION}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Heart className="w-6 h-6 text-rose-500" />
                  <h3 className="text-xl font-black text-slate-900">Your Wishlist</h3>
                </div>
                <button onClick={() => setIsWishlistOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {wishlist.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="bg-slate-50 p-6 rounded-full mb-4">
                      <Heart className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="text-slate-500 font-bold">Your wishlist is empty</p>
                  </div>
                ) : (
                  wishlist.map(id => {
                    const laptop = laptops.find(l => l.id === id);
                    if (!laptop) return null;
                    return (
                      <div key={laptop.id} className="flex gap-4 group">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 relative">
                          <SmartImage 
                            src={laptop.image} 
                            alt={laptop.name} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-black text-slate-900 mb-1 line-clamp-1">{laptop.name}</h4>
                          <div className="text-xs font-bold text-emerald-600 mb-2">
                            <FormatCurrency amount={laptop.price} />
                          </div>
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={(e) => {
                                addToCart(laptop, e);
                                toggleWishlist(laptop.id);
                              }}
                              className="text-xs font-black text-emerald-600 hover:underline"
                            >
                              Move to Cart
                            </button>
                            <button 
                              onClick={() => toggleWishlist(laptop.id)}
                              className="text-xs font-black text-slate-400 hover:text-rose-500 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Quick View Modal */}
      <AnimatePresence>
        {quickViewId && quickViewLaptop && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQuickViewId(null)}
              className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[80]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.6, ease: EASE_OUT_QUINT }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-4xl bg-white z-[90] rounded-[2rem] overflow-hidden shadow-2xl"
            >
              <div className="md:flex h-full max-h-[90vh] overflow-y-auto md:overflow-hidden">
                <div className="md:w-1/2 bg-slate-100 relative">
                  <SmartImage 
                    src={quickViewLaptop.image} 
                    alt={quickViewLaptop.name} 
                    className="w-full h-full object-cover"
                  />
                  <button 
                    onClick={() => setQuickViewId(null)}
                    className="absolute top-6 left-6 p-2 bg-white/80 backdrop-blur-sm rounded-full md:hidden"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="md:w-1/2 p-8 md:p-12 flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2 block">{quickViewLaptop.brand}</span>
                      <h2 className="text-3xl font-black text-slate-900 leading-tight">{quickViewLaptop.name}</h2>
                    </div>
                    <button onClick={() => setQuickViewId(null)} className="hidden md:block p-2 hover:bg-slate-100 rounded-full transition-colors">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mb-8">
                    <div className="text-3xl font-black text-emerald-600">
                      <FormatCurrency amount={quickViewLaptop.price} />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      quickViewLaptop.condition === 'Brand New' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {quickViewLaptop.condition}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Processor</span>
                      <p className="text-sm font-black text-slate-900">{quickViewLaptop.cpu}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Memory</span>
                      <p className="text-sm font-black text-slate-900">{quickViewLaptop.ram} RAM</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Storage</span>
                      <p className="text-sm font-black text-slate-900">{quickViewLaptop.storage}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Display</span>
                      <p className="text-sm font-black text-slate-900">{quickViewLaptop.screen} Screen</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Location</span>
                      <p className="text-sm font-black text-slate-900">{quickViewLaptop.location}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-8">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-slate-900">YaksonThreeSons Ltd Guarantee</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      <EditableText id="guarantee-text" defaultText='"We operate in honest form and our guaranty is real. 14-day return policy and full hardware support included."' />
                    </p>
                  </div>

                  <div className="mt-auto flex flex-col gap-3">
                    <button 
                      onClick={(e) => addToCart(quickViewLaptop, e)}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Add to Cart
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <a 
                        href={getWhatsAppProductUrl(quickViewLaptop)} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-all"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </a>
                      <a href="tel:07013306552" className="bg-white border border-slate-200 hover:border-emerald-600 hover:text-emerald-600 text-slate-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm transition-all">
                        <Phone className="w-4 h-4" />
                        Call Now
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Filter Sidebar */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={SIDEBAR_TRANSITION}
              className="fixed top-0 left-0 h-full w-full max-w-xs bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900">Filters</h3>
                <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <FilterSection title="Condition" options={["Open Box", "Brand New"]} field="condition" filters={filters} setFilters={setFilters} />
                <FilterSection title="Brand" options={["HP", "Apple", "Dell", "Lenovo"]} field="brand" filters={filters} setFilters={setFilters} />
                <FilterSection title="CPU" options={["i3", "i5", "i7"]} field="cpu" filters={filters} setFilters={setFilters} />
                <FilterSection title="RAM" options={["8GB", "12GB", "16GB"]} field="ram" filters={filters} setFilters={setFilters} />
                <FilterSection title="Storage" options={["128GB SSD", "256GB SSD", "512GB SSD", "1TB SSD", "1TB HDD"]} field="storage" filters={filters} setFilters={setFilters} />
              </div>
              <div className="p-6 border-t border-slate-100">
                <button 
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl"
                >
                  Apply Filters
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
