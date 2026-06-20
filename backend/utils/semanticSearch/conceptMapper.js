import { stopWords } from "./stopWords.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const concepts = [
  // ── Construction & Building ──
  {
    id: "carpentry",
    category: "Carpentry",
    terms: {
      en: [
        "wood", "carpenter", "carpentry", "woodwork", "woodworking",
        "joinery", "furniture", "cabinet", "timber", "saw", "drill",
        "hammer", "nail", "screw", "plank", "cutting wood",
        "wood carving", "wood cutting", "cabinetry", "carpenter",
      ],
      ar: [
        "نجارة", "نجار", "نجارين", "خشب", "أخشاب", "أثاث", "منشار", "مطرقة",
        "تقطيع الخشب", "نحت الخشب", "دواليب", "طاولة",
      ],
    },
  },
  {
    id: "plumbing",
    category: "Plumbing",
    terms: {
      en: [
        "plumb", "pipe", "water", "drain", "faucet", "toilet",
        "sink", "bathroom", "plumber", "sewer", "leak",
      ],
      ar: [
        "سباكة", "سباك", "سباكين", "سباكات", "مواسير", "مياه", "حوض", "مرحاض",
        "تسريب", "صرف صحي", "حمام", "مطبخ",
      ],
    },
  },
  {
    id: "electricity",
    category: "Electricity",
    terms: {
      en: [
        "electri", "wire", "circuit", "light", "power", "switch",
        "socket", "electrician", "fuse", "voltage", "current",
        "wiring", "electrical", "LED", "panel", "breaker",
      ],
      ar: [
        "كهرباء", "كهربائي", "كهربائيين", "أسلاك", "دائرة", "لمبة", "فيشة",
        "مفتاح", "قاطع", "تيار", "فولت", "لوحة كهرباء",
      ],
    },
  },
  {
    id: "painting",
    category: "Painting",
    terms: {
      en: [
        "paint", "painter", "painting", "wall", "color", "roller",
        "brush", "coating", "spray", "interior", "exterior",
      ],
      ar: [
        "دهان", "دهانات", "دهانين", "رسام", "لون", "حائط", "جدران", "فرشاة",
        "رول", "طلاء", "دهان داخلي", "دهان خارجي",
      ],
    },
  },
  {
    id: "masonry",
    category: "Construction & Building",
    terms: {
      en: [
        "mason", "brick", "concrete", "cement", "tile", "tiler",
        "block", "mortar", "plaster", "foundation", "wall building",
      ],
      ar: [
        "بناء", "بنّاء", "بنائين", "طوب", "أسمنت", "خرسانة", "بلاط",
        "بلاطة", "بلاطات", "جبس", "محارة", "بناء جدار",
      ],
    },
  },
  {
    id: "welding",
    category: "Metal Works",
    terms: {
      en: [
        "weld", "welder", "welding", "metal", "iron", "steel",
        "solder", "torch", "metalwork", "metalworking", "blacksmith",
        "silver", "gold", "forge", "smith",
      ],
      ar: [
        "لحام", "لحّام", "لحامين", "حداد", "حدادين", "حديد", "معدن", "معادن", "صلب",
        "صهر", "تشكيل معادن", "ذهب", "فضة", "حدادة",
      ],
    },
  },
  {
    id: "roofing",
    category: "Construction & Building",
    terms: {
      en: ["roof", "roofer", "roofing", "shingle", "gutter", "ceiling"],
      ar: ["أسطح", "عامل أسطح", "سقف", "مزراب", "سقف منزل"],
    },
  },

  // ── Technical & Engineering ──
  {
    id: "mechanics",
    category: "Mechanics",
    terms: {
      en: [
        "mechanic", "mechanics", "auto", "car", "engine", "vehicle",
        "repair", "automotive", "diesel", "brake", "transmission",
        "motor", "garage", "tire", "battery",
      ],
      ar: [
        "ميكانيكا", "ميكانيكي", "ميكانيكيين", "سيارة", "سيارات", "محرك", "محركات", "مركبة",
        "تصليح", "إصلاح", "ديزل", "فرامل", "ناقل حركة", "موتور", "بطارية",
      ],
    },
  },
  {
    id: "auto-electric",
    category: "Technical & Engineering",
    terms: {
      en: [
        "auto electric", "car electric", "vehicle wiring",
        "automotive electric", "ECU",
      ],
      ar: ["كهرباء سيارات", "كهربائي سيارات", "كمبيوتر سيارة"],
    },
  },
  {
    id: "hvac",
    category: "Technical & Engineering",
    terms: {
      en: [
        "HVAC", "air condition", "AC", "cooling", "heating",
        "refrigeration", "ventilation", "thermostat", "refrigerator",
        "cooler",
      ],
      ar: [
        "تكييف", "تبريد", "فني تكييف", "فنيين تكييف", "ثلاجة", "ثلاجات", "مكيف", "مكيفات",
        "تدفئة", "تهوية", "ترموستات", "غاز", "فريون",
      ],
    },
  },
  {
    id: "electronics",
    category: "Electronics",
    terms: {
      en: [
        "electronic", "circuit board", "solder", "microcontroller",
        "arduino", "sensor", "PCB", "transistor", "diode",
        "electronics technician", "repair electronics",
      ],
      ar: [
        "إلكترونيات", "فني إلكترونيات", "فنيين إلكترونيات", "لوحة إلكترونية",
        "حساس", "حساسات", "ترانزستور", "دايود", "تصليح إلكترونيات",
      ],
    },
  },
  {
    id: "networking",
    category: "Technical & Engineering",
    terms: {
      en: [
        "network", "networking", "router", "switch", "server",
        "IT", "LAN", "WAN", "cyber", "security", "network technician",
        "cabling", "CCTV",
      ],
      ar: [
        "شبكات", "فني شبكات", "فنيين شبكات", "راوتر", "سيرفر", "كاميرات",
        "مراقبة", "أمن سيبراني", "إنترنت", "كابلات", "واي فاي",
      ],
    },
  },
  {
    id: "computer-tech",
    category: "Technical & Engineering",
    terms: {
      en: [
        "computer", "PC", "laptop", "hardware", "desktop",
        "repair computer", "IT support", "computer technician",
        "troubleshoot", "Windows", "Linux", "macOS",
      ],
      ar: [
        "كمبيوتر", "فني كمبيوتر", "فنيين كمبيوتر", "لابتوب", "لابتوبات", "صيانة كمبيوتر",
        "هاردوير", "دعم فني", "ويندوز", "معالج", "رامات",
      ],
    },
  },

  // ── Crafts & Handicrafts ──
  {
    id: "tailoring",
    category: "Crafts & Handicrafts",
    terms: {
      en: [
        "tailor", "sew", "sewing", "fabric", "cloth", "dress",
        "fashion", "garment", "stitch", "embroidery", "textile",
        "pattern", "shirt", "pant", "suit", "alteration",
      ],
      ar: [
        "خياطة", "خياط", "خياطين", "قماش", "أقمشة", "فستان", "فساتين", "أزياء", "ملابس",
        "تطريز", "باترون", "خياطة ملابس", "تصميم أزياء", "مقص", "إبرة",
      ],
    },
  },
  {
    id: "shoemaking",
    category: "Crafts & Handicrafts",
    terms: {
      en: [
        "shoe", "shoemaker", "cobbler", "leather", "boot",
        "sandal", "footwear",
      ],
      ar: ["إسكافي", "أحذية", "جلود", "حذاء", "كوبلر", "جزمة"],
    },
  },
  {
    id: "weaving",
    category: "Crafts & Handicrafts",
    terms: {
      en: [
        "weave", "weaver", "weaving", "loom", "carpet", "rug",
        "textile", "fiber", "yarn", "knit", "knitting",
      ],
      ar: [
        "نسيج", "نسّاج", "سجاد", "مفروشات", "غزل", "نسج",
        "صوف", "حرير", "قطن",
      ],
    },
  },
  {
    id: "pottery",
    category: "Crafts & Handicrafts",
    terms: {
      en: [
        "pottery", "potter", "ceramic", "clay", "kiln", "wheel",
        "glaze", "mold", "sculpture", "sculpt", "vase", "bowl",
        "pottery making", "ceramic bowl",
      ],
      ar: [
        "خزف", "خزّاف", "فخار", "طين", "سيراميك", "جرة",
        "نحت", "فخار يدوي", "تشكيل طين",
      ],
    },
  },
  {
    id: "calligraphy",
    category: "Crafts & Handicrafts",
    terms: {
      en: [
        "calligraphy", "calligrapher", "handwriting", "ink",
        "lettering", "arabic calligraphy", "pen",
      ],
      ar: [
        "خطاط", "خط عربي", "خط", "حبر", "قلم", "زخرفة",
        "رسم حروف",
      ],
    },
  },

  // ── Food & Hospitality ──
  {
    id: "culinary",
    category: "Food & Hospitality",
    terms: {
      en: [
        "cook", "cooking", "chef", "culinary", "kitchen", "food",
        "recipe", "meal", "bake", "baking", "grill", "fry",
        "pasta", "pizza", "bread", "cake", "pastry", "dessert",
        "cuisine", "italian", "french", "japanese", "chinese",
        "mexican", "indian", "arabic", "mortar",
      ],
      ar: [
        "طبخ", "طباخ", "طباخين", "شيف", "شيفات", "مطبخ", "مطابخ", "طعام", "وصفة", "وصفات",
        "طهي", "خبز", "مقلاة", "حلويات", "كيك", "باستا",
        "بيتزا", "مطبخ إيطالي", "مطبخ مصري", "معجنات",
      ],
    },
  },
  {
    id: "butchery",
    category: "Food & Hospitality",
    terms: {
      en: ["butcher", "butchery", "meat", "slaughter", "cut meat"],
      ar: ["جزار", "لحوم", "تقطيع لحوم", "جزارة"],
    },
  },
  {
    id: "barista",
    category: "Food & Hospitality",
    terms: {
      en: [
        "barista", "coffee", "espresso", "latte", "cappuccino",
        "cafe", "beverage", "drink",
      ],
      ar: ["باريستا", "قهوة", "اسبريسو", "لاتيه", "كابتشينو", "مقهى"],
    },
  },

  // ── Services ──
  {
    id: "barbering",
    category: "Services",
    terms: {
      en: [
        "barber", "hair", "haircut", "hairstyle", "grooming",
        "beard", "shave", "salon",
      ],
      ar: [
        "حلاق", "حلاقين", "حلاقة", "شعر", "تصفيف شعر", "مقص",
        "موس", "صالون حلاقة", "صالونات", "لحية", "دقن",
      ],
    },
  },
  {
    id: "beauty",
    category: "Services",
    terms: {
      en: [
        "makeup", "beauty", "cosmetic", "skincare", "nail",
        "eyelash", "hair styling", "hairdresser", "salon",
        "beautician",
      ],
      ar: [
        "ميكب", "تجميل", "عناية بالبشرة", "بشرة", "أظافر",
        "مصفف شعر", "مصففين", "صالون", "صالونات", "مكياج", "كوافير", "كوافيرات",
      ],
    },
  },
  {
    id: "cleaning",
    category: "Services",
    terms: {
      en: [
        "clean", "cleaning", "housekeeping", "janitor",
        "maid", "sanitize", "disinfect",
      ],
      ar: ["نظافة", "عامل نظافة", "عمال نظافة", "تنظيف", "تعقيم", "خدمات نظافة"],
    },
  },
  {
    id: "gardening",
    category: "Services",
    terms: {
      en: [
        "garden", "gardener", "gardening", "plant", "landscaping",
        "lawn", "tree", "flower", "irrigation",
      ],
      ar: [
        "بستاني", "بستانيين", "زراعة", "حديقة", "حدائق", "نبات", "نباتات", "تشجير",
        "ري", "تنسيق حدائق",
      ],
    },
  },
  {
    id: "driving",
    category: "Services",
    terms: {
      en: [
        "driver", "driving", "delivery", "transport", "truck",
        "bus", "taxi", "courier",
      ],
      ar: ["سائق", "سائقين", "قيادة", "توصيل", "نقل", "شاحنة", "شاحنات", "تاكسي"],
    },
  },
  {
    id: "security",
    category: "Services",
    terms: {
      en: [
        "security", "guard", "surveillance", "safety",
        "protection", "watchman",
      ],
      ar: ["حارس أمن", "حراس أمن", "أمن", "حراسة", "مراقبة", "كاميرات"],
    },
  },

  // ── Creative & Digital ──
  {
    id: "programming",
    category: "Creative & Digital",
    terms: {
      en: [
        "program", "programming", "code", "coding", "software",
        "developer", "development", "app", "web", "website",
        "mobile app", "android", "iOS", "flutter", "react native",
        "python", "javascript", "java", "c++", "ruby", "php",
        "backend", "frontend", "full stack", "API",
        "make money online", "build app", "build website",
      ],
      ar: [
        "برمجة", "مبرمج", "مبرمجين", "تطوير", "كود", "برمجيات",
        "تطبيق", "تطبيقات", "موقع", "مواقع", "أندرويد", "iOS", "ويب",
        "تطوير تطبيقات", "flutter", "python", "جافا",
        "ربح من الإنترنت", "برمجة مواقع", "برمجة ويب",
      ],
    },
  },
  {
    id: "web-dev",
    category: "Creative & Digital",
    terms: {
      en: [
        "web developer", "web development", "HTML", "CSS",
        "react", "angular", "vue", "node", "website building",
        "frontend", "backend", "full stack",
      ],
      ar: [
        "مطور ويب", "تطوير ويب", "تصميم مواقع",
        "فرونت إيند", "باك إيند",
      ],
    },
  },
  {
    id: "mobile-dev",
    category: "Creative & Digital",
    terms: {
      en: [
        "mobile developer", "mobile app", "android", "iOS",
        "flutter", "react native", "kotlin", "swift",
        "app development", "build mobile app",
      ],
      ar: [
        "مطور تطبيقات", "تطبيقات موبايل", "أندرويد",
        "iOS", "تطوير تطبيقات",
      ],
    },
  },
  {
    id: "ui-ux",
    category: "Creative & Digital",
    terms: {
      en: [
        "UI", "UX", "designer", "design", "user interface",
        "user experience", "Figma", "sketch", "prototype",
        "wireframe", "graphic", "visual",
      ],
      ar: [
        "مصمم", "مصممين", "تصميم", "واجهات", "تجربة مستخدم",
        "جرافيك", "جرافيكس", "فوتوشوب", "فيجما", "تصميم جرافيك",
      ],
    },
  },
  {
    id: "photography",
    category: "Creative & Digital",
    terms: {
      en: [
        "photo", "photograph", "photography", "camera",
        "video", "videography", "edit", "editing", "film",
        "shoot", "lighting", "photoshop",
      ],
      ar: [
        "تصوير", "مصور", "مصورين", "كاميرا", "كاميرات", "فيديو", "مونتاج",
        "تعديل", "إضاءة", "فوتوشوب", "تصوير فيديو",
      ],
    },
  },
  {
    id: "music",
    category: "Creative & Digital",
    terms: {
      en: [
        "music", "musician", "instrument", "guitar", "piano",
        "drum", "sing", "song", "audio", "sound", "producer",
      ],
      ar: ["موسيقى", "عزف", "جيتار", "بيانو", "غناء", "موسيقي"],
    },
  },

  // ── Agriculture & Nature ──
  {
    id: "farming",
    category: "Agriculture & Nature",
    terms: {
      en: [
        "farm", "farmer", "farming", "crop", "harvest",
        "agriculture", "field", "soil", "tractor",
      ],
      ar: ["زراعة", "مزارع", "مزارعين", "محصول", "محاصيل", "أرض", "أراضي", "فلاحة", "تربة"],
    },
  },
  {
    id: "fishing",
    category: "Agriculture & Nature",
    terms: {
      en: ["fish", "fishing", "fisherman", "net", "sea", "boat"],
      ar: ["صيد", "صياد", "صيادين", "سمك", "بحر", "شبكة صيد"],
    },
  },
  {
    id: "animal-husbandry",
    category: "Agriculture & Nature",
    terms: {
      en: [
        "animal", "livestock", "breed", "breeder", "veterinary",
        "cattle", "sheep", "chicken", "poultry",
      ],
      ar: ["مربي حيوانات", "مربين", "حيوان", "حيوانات", "مواشي", "دواجن", "بيطري"],
    },
  },

  // ── Business & Freelancing ──
  {
    id: "freelancing",
    category: "Creative & Digital",
    terms: {
      en: [
        "freelance", "freelancing", "online work", "remote work",
        "make money", "earn", "income", "side hustle",
        "work from home", "gig",
      ],
      ar: [
        "عمل حر", "فريلانس", "فريلانسر", "عمل عبر الإنترنت",
        "ربح", "دخل", "عمل عن بعد", "عن بعد", "أونلاين",
      ],
    },
  },
  {
    id: "digital-marketing",
    category: "Creative & Digital",
    terms: {
      en: [
        "digital marketing", "marketing", "social media",
        "seo", "ads", "content", "influencer", "e-commerce",
        "affiliate", "online business", "sell",
        "make money online",
      ],
      ar: [
        "تسويق", "تسويق إلكتروني", "تسويق الكتروني", "سوشيال ميديا",
        "إعلانات", "اعلانات", "تجارة إلكترونية", "بيع",
        "تسويق بالعمولة", "ربح من الإنترنت", "ماركتينج",
      ],
    },
  },
  {
    id: "ecommerce",
    category: "Creative & Digital",
    terms: {
      en: [
        "ecommerce", "e-commerce", "online store", "shopify",
        "amazon", "sell online", "dropshipping",
      ],
      ar: [
        "متجر إلكتروني", "تجارة إلكترونية", "بيع أونلاين",
        "شوبيفاي",
      ],
    },
  },
];

// ============================================================
// ── Arabic normalization (NEW) ──
// Strips diacritics, unifies alef/hamza forms, teh marbuta/heh,
// alef maksura/yeh, and removes the definite article "ال".
// This runs BEFORE any dictionary lookup or term matching so
// that spelling variants collapse to the same key.
// ============================================================
const normalizeArabic = (text) => {
  if (!text) return text;
  return text
    // strip Arabic diacritics (tashkeel) and tatweel
    .replace(/[\u064B-\u0652\u0640]/g, "")
    // unify hamza/alef forms: أ إ آ ا -> ا
    .replace(/[أإآ]/g, "ا")
    // unify teh marbuta -> heh (سباكة/سباكه both become سباكه)
    .replace(/ة/g, "ه")
    // unify alef maksura -> yeh (على/علي)
    .replace(/ى/g, "ي")
    // remove standalone hamza on the line if present
    .replace(/ء/g, "")
    .trim();
};

// Strip the definite article "ال" from the start of a word.
// Only strips when what remains is still a "real" word (length >= 2)
// to avoid mangling short words that happen to start with ال.
const stripAl = (word) => {
  if (word.length > 3 && word.startsWith("ال")) {
    return word.slice(2);
  }
  return word;
};

// Full Arabic-side normalization used for both dictionary keys
// and incoming query words: lowercase pass-through (no-op for Arabic,
// kept for mixed-language tokens), diacritic/letter unification,
// then definite-article stripping.
const normalizeArabicWord = (word) => {
  const unified = normalizeArabic(word.toLowerCase());
  return stripAl(unified);
};

const escapeRegex2 = escapeRegex; // keep original export-compatible helper

const allTermsEn = concepts.flatMap((c) => c.terms.en);
const allTermsAr = concepts.flatMap((c) => c.terms.ar);

// ── Build term index, keyed by NORMALIZED Arabic / lowercase English ──
const buildTermIndex = () => {
  const index = {};
  concepts.forEach((concept) => {
    // Index by English terms
    concept.terms.en.forEach((t) => {
      const key = t.toLowerCase();
      if (!index[key]) index[key] = [];
      index[key].push(concept);
    });
    // Index by concept id (used by translateToEnglish, e.g. "plumbing")
    const idKey = concept.id.toLowerCase();
    if (!index[idKey]) index[idKey] = [];
    if (!index[idKey].some((c) => c.id === concept.id)) index[idKey].push(concept);
    // Index by concept id with hyphens replaced by spaces (e.g. "auto electric")
    const idSpaceKey = concept.id.replace(/-/g, " ").toLowerCase();
    if (idSpaceKey !== idKey) {
      if (!index[idSpaceKey]) index[idSpaceKey] = [];
      if (!index[idSpaceKey].some((c) => c.id === concept.id)) index[idSpaceKey].push(concept);
    }
    // Index by Arabic terms (normalized + raw)
    concept.terms.ar.forEach((t) => {
      const key = normalizeArabicWord(t);
      if (!index[key]) index[key] = [];
      if (!index[key].some((c) => c.id === concept.id)) index[key].push(concept);
      const rawKey = t.toLowerCase();
      if (rawKey !== key) {
        if (!index[rawKey]) index[rawKey] = [];
        if (!index[rawKey].some((c) => c.id === concept.id)) index[rawKey].push(concept);
      }
    });
  });
  return index;
};

const termIndex = buildTermIndex();

// ── Arabic→English Translation Dictionary ──
// NOTE: keys are stored normalized (no "ال", unified letters) so lookups
// against a normalized query word succeed regardless of spelling variant.
const commonArToEnRaw = {
  "تعلم": "learn", "اتعلم": "learn", "ادرس": "study", "أدرس": "study",
  "كيف": "how", "أريد": "i want", "اريد": "i want",
  "عايز": "i want", "عاوز": "i want", "نفسي": "i want",
  "ابغى": "i want", "ابغا": "i want", "حابب": "i want", "ودي": "i want",
  "محتاج": "i need", "أحتاج": "i need", "احتاج": "i need",
  "احترف": "master", "اتقن": "master", "أتقن": "master", "محترف": "professional",
  "افهم": "understand", "فهم": "understand",
  "إنشاء": "create", "انشاء": "create", "اعمل": "create",
  "أفضل": "best", "افضل": "best", "احسن": "best",
  "دورات": "courses", "كورسات": "courses",
  "دورة": "course", "كورس": "course",
  "شرح": "explanation", "درس": "lesson", "دروس": "lessons",
  "مهارة": "skill", "مهارات": "skills",
  "مهنة": "profession", "حرفة": "craft", "صنعة": "craft",
  "شغل": "work", "عمل": "work", "وظيفة": "job",
  "مجال": "field", "تخصص": "specialty",
  "احترافي": "professional", "مبتدئ": "beginner",
  "متقدم": "advanced", "متوسط": "intermediate",
  "مجاني": "free", "ببلاش": "free",
  "سعر": "price", "رخيص": "cheap",
  "اونلاين": "online", "انترنت": "internet",
  "عن بعد": "remote", "من البيت": "from home",
  "منزل": "home", "المنزل": "home",
  "المبتدئين": "beginners", "المتقدمين": "advanced",
  "المتوسط": "intermediate", "مستوى": "level",
  "السلامة": "safety", "امان": "safety",
  "أساسيات": "basics", "اساسيات": "basics",
  "مبادئ": "principles", "قواعد": "rules",
  "تمارين": "exercises", "تدريب": "training",
  "تطبيقات": "applications", "مشاريع": "projects",
  "أدوات": "tools", "ادوات": "tools", "معدات": "equipment",
  "فني": "technician", "فنيين": "technicians",
  "حرفي": "craftsman", "حرفيين": "craftsmen",
  "مهني": "vocational", "مهنية": "vocational",
  "إصلاح": "repair", "اصلاح": "repair",
  "صيانة": "maintenance",
  "تعليم": "education",
  "صناعة": "industry",
  "إدارة": "management", "ادارة": "management",
  "مشروع": "project",
  "ميكانيك": "mechanics",
  "الكهرباء": "electricity",
  "السباكة": "plumbing",
  "النجارة": "carpentry",
  "البناء": "construction",
  "الدهان": "painting",
  "اللحام": "welding",
  "التبريد": "refrigeration",
  "التكييف": "air conditioning",
};

// Normalize every dictionary key once at startup.
const buildNormalizedDict = (rawDict) => {
  const dict = {};
  for (const [key, value] of Object.entries(rawDict)) {
    const normKey = normalizeArabicWord(key);
    // Don't let a later raw key silently overwrite an earlier
    // normalized collision with a different translation —
    // first one wins, consistent with previous behavior.
    if (!dict[normKey]) dict[normKey] = value;
  }
  return dict;
};

const buildArToEnDict = () => {
  const dict = buildNormalizedDict(commonArToEnRaw);
  concepts.forEach((concept) => {
    // Use concept id as the representative English term (e.g. "plumbing" not "plumb")
    const rep = concept.id.replace(/-/g, " ").toLowerCase();
    concept.terms.ar.forEach((arTerm) => {
      const key = normalizeArabicWord(arTerm);
      if (!dict[key]) {
        dict[key] = rep;
      }
    });
  });
  return dict;
};

const arToEnDict = buildArToEnDict();

// Translate Arabic input to English by normalizing each word first,
// then looking it up. Falls back to the original word (untranslated)
// if no dictionary entry exists, same as before — but the normalization
// step means far more real-world spelling variants now resolve correctly.
// Generate Arabic morphological variants for a normalized word,
// helping the dictionary resolve plurals and inflected forms.
// Handles:
//   - Feminine sound plural (ات): سيارة → سيارات → try stem + "ه"
//   - Masculine sound plural (ون/ين): نجار → نجارون/نجارين
//   - Dual (ان/ين): نجاران/نجارين
//   - Possessive pronoun suffixes: هم, هن, كم, كن, نا, ها, يه, ني
const generateMorphVariants = (normWord) => {
  if (!normWord || normWord.length < 3) return [normWord];
  const variants = [normWord];
  const len = normWord.length;

  // Feminine plural: strip "ات", try stem and stem+"ه"
  if (normWord.endsWith("ات") && len > 4) {
    const stem = normWord.slice(0, -2);
    variants.push(stem);
    variants.push(stem + "ه");
  }
  // Masculine plural / dual: strip "ون", "ين", "ان"
  for (const s of ["ون", "ين", "ان"]) {
    if (normWord.endsWith(s) && len - s.length >= 3) {
      variants.push(normWord.slice(0, -s.length));
    }
  }
  // Possessive pronoun suffixes
  for (const s of ["هم", "هن", "كم", "كن", "نا", "ها", "يه", "ني"]) {
    if (normWord.endsWith(s) && len - s.length >= 3) {
      variants.push(normWord.slice(0, -s.length));
    }
  }

  return [...new Set(variants)];
};

const translateToEnglish = (text) => {
  if (!text || !hasArabic(text)) return text;
  const words = text.trim().split(/\s+/);
  const translated = words.map((word) => {
    if (!hasArabic(word)) return word; // leave Latin/mixed tokens untouched
    const normWord = normalizeArabicWord(word);
    let translation = arToEnDict[normWord];
    if (!translation) {
      // Try morphological variants (plurals, inflections)
      const variants = generateMorphVariants(normWord);
      for (const variant of variants) {
        if (variant !== normWord) {
          translation = arToEnDict[variant];
          if (translation) break;
        }
      }
    }
    return translation || word;
  });
  return translated.join(" ");
};

/**
 * Same dictionary-first translation as translateToEnglish, but for any
 * word the local dictionary doesn't cover, falls back to an external
 * translation API (LibreTranslate) for just those missing words.
 *
 * This is async because it may make a network call — use this in the
 * search controller; keep using the sync translateToEnglish anywhere
 * a network call would be inappropriate (e.g. inside expandQuery,
 * which is called many times per request).
 *
 * @param {(words: string[]) => Promise<Map<string,string>>} translateBatchFn
 *   Injected dependency (e.g. translateWordsBatch from translateFallback.js)
 *   so this module stays free of a hard import/network dependency and
 *   stays easily testable. If omitted, behaves exactly like the sync
 *   translateToEnglish (no fallback attempted).
 */
const translateToEnglishWithFallback = async (text, translateBatchFn = null) => {
  if (!text || !hasArabic(text)) return { text, usedFallback: false };

  const words = text.trim().split(/\s+/);
  const resolved = words.map((word) => {
    if (!hasArabic(word)) return { word, translated: word, needsFallback: false };
    const normWord = normalizeArabicWord(word);
    const dictHit = arToEnDict[normWord];
    return {
      word,
      translated: dictHit || null,
      needsFallback: !dictHit,
    };
  });

  const missingWords = resolved.filter((r) => r.needsFallback).map((r) => r.word);

  // Fast path: dictionary covered everything, no network call needed.
  if (missingWords.length === 0 || typeof translateBatchFn !== "function") {
    const finalWords = resolved.map((r) => r.translated || r.word);
    return { text: finalWords.join(" "), usedFallback: false };
  }

  // Slow path: ask the fallback API for ONLY the missing words, in one batch.
  let fallbackMap = new Map();
  try {
    fallbackMap = await translateBatchFn(missingWords);
  } catch (err) {
    // Defensive: even if the injected fn throws instead of resolving null,
    // never let translation failure break the search request.
    console.error("Translation fallback threw:", err.message);
  }

  const finalWords = resolved.map((r) => {
    if (r.translated) return r.translated; // dictionary hit
    const fb = fallbackMap.get(r.word);
    return fb || r.word; // fallback hit, or give up and keep original Arabic word
  });

  return {
    text: finalWords.join(" "),
    usedFallback: fallbackMap.size > 0,
  };
};

const normalizeQuery = (q) => {
  return q.toLowerCase().replace(/[^\w\s\u0600-\u06FF]/g, " ").replace(/\s+/g, " ").trim();
};

const hasArabic = (text) => /[\u0600-\u06FF]/.test(text);
const hasLatin = (text) => /[a-zA-Z]/.test(text);

const extractKeywords = (text, lang = "en") => {
  const normalized = normalizeQuery(text);
  const words = normalized.split(/\s+/).filter((w) => w.length >= 2);
  if (lang === "mixed") {
    return words.filter((w) => !stopWords.en?.has(w) && !stopWords.ar?.has(w));
  }
  return words.filter((w) => !stopWords[lang]?.has(w));
};

const detectLanguage = (q) => {
  const arabic = hasArabic(q);
  const latin = hasLatin(q);
  if (arabic && latin) return "mixed";
  return arabic ? "ar" : "en";
};

const detectIntent = (q) => {
  const normalized = normalizeQuery(q);
  const intentVerbs = [
    { verbs: ["learn", "study", "master", "understand", "know", "تعلم", "ادرس", "أتقن"], intent: "learning" },
    { verbs: ["build", "create", "make", "develop", "construct", "صنع", "بناء", "إنشاء", "تطوير"], intent: "creation" },
    { verbs: ["cook", "bake", "prepare", "make food", "اطبخ", "اطبخ", "خبز", "حضر"], intent: "cooking" },
    { verbs: ["fix", "repair", "maintain", "اصلح", "صيانة", "إصلاح"], intent: "repair" },
    { verbs: ["design", "draw", "paint", "sketch", "صمم", "ارسم", "رسم"], intent: "design" },
    { verbs: ["install", "setup", "mount", "ركب", "تثبيت", "تنصيب"], intent: "installation" },
    { verbs: ["earn", "make money", "work", "freelance", "اكسب", "اربح", "اعمل"], intent: "earning" },
    { verbs: ["teach", "train", "instruct", "علم", "درب", "درس"], intent: "teaching" },
  ];

  for (const group of intentVerbs) {
    for (const verb of group.verbs) {
      if (containsWholeTerm(normalized, verb)) return group.intent;
    }
  }
  return "general";
};

const getConceptTerms = (concept, lang) => {
  if (lang === "mixed") return [...concept.terms.en, ...concept.terms.ar];
  return lang === "ar" ? concept.terms.ar : concept.terms.en;
};

// Expand a query into a wider set of related terms.
// CHANGED: the old "fuzzy" pass did a substring includes() against the
// ENTIRE termIndex for every query word, regardless of word length. With
// short words (2-3 chars, common in Arabic after stripping "ال") that
// caused massive false-positive expansion into unrelated concepts, which
// diluted TF-IDF and ranking quality. Now:
//   1. Words are normalized first (handles "النجارة" -> "نجاره" -> matches
//      the "نجارة"/"نجاره" key directly, no fuzzy needed for this case).
//   2. The fuzzy substring pass only runs for words of length >= 4,
//      and only matches keys of length >= 4 too, to avoid noisy short-token
//      collisions (e.g. a 2-letter leftover word matching dozens of terms).
const MIN_FUZZY_LEN = 4;

// Safe substring check for fuzzy term matching — ARABIC ONLY.
// Plain `a.includes(b)` is too permissive even with prefix/suffix
// anchoring: English short strings often share a real suffix with no
// semantic relation at all (e.g. "earn" is a suffix of "learn", but
// they're unrelated words). Arabic inflections, by contrast, genuinely
// do add/drop a short prefix or suffix for the same root
// (نجار / نجارة / نجاره), so anchored fuzzy matching is safe there.
// English relies on exact dictionary/term-index lookups instead.
const isSafeFuzzyMatch = (a, b) => {
  if (!hasArabic(a) && !hasArabic(b)) return false;
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
  if (shorter.length < MIN_FUZZY_LEN) return false;
  // shorter must be at least 70% the length of longer (close inflections only)
  if (shorter.length / longer.length < 0.7) return false;
  // must be a prefix or suffix match, not a buried substring
  return longer.startsWith(shorter) || longer.endsWith(shorter);
};

const expandQuery = (q, lang) => {
  const words = extractKeywords(q, lang);
  const expandedTerms = new Set(words);

  words.forEach((word) => {
    const normWord = lang === "ar" || hasArabic(word) ? normalizeArabicWord(word) : word;

    const entries = termIndex[word] || termIndex[normWord] || [];
    entries.forEach((concept) => {
      const terms = getConceptTerms(concept, lang);
      terms.forEach((t) => expandedTerms.add(t.toLowerCase()));
    });

    if (normWord.length < MIN_FUZZY_LEN) return;

    // Fuzzy: add partial matches from term index, restricted to
    // longer keys and a prefix/suffix-anchored match (see isSafeFuzzyMatch)
    // to keep matches meaningful and avoid false positives like
    // "car" falsely matching inside "carpentry".
    for (const [key, entries] of Object.entries(termIndex)) {
      if (isSafeFuzzyMatch(key, normWord)) {
        entries.forEach((concept) => {
          const terms = getConceptTerms(concept, lang);
          terms.forEach((t) => expandedTerms.add(t.toLowerCase()));
        });
      }
    }
  });

  return [...expandedTerms];
};

// Checks whether `term` appears in `text` as a whole word (or whole
// phrase, for multi-word terms), not merely as a buried substring.
// This is the fix for the original bug where a short term like "car"
// (Mechanics) or "pen" (Calligraphy) would match inside completely
// unrelated words like "carpentry" or "calligraphy" just because
// `"carpentry".includes("car")` is true. A simple word-boundary regex
// check (with \b) avoids this without needing fuzzy-matching at all.
//
// English stemming exception: some dictionary terms are deliberately
// stored as short roots (e.g. "plumb" so it matches "plumb",
// "plumbing", "plumber"). A plain word-boundary check would break this.
// So for non-Arabic terms of 5+ characters, also allow a prefix match
// (term is the start of a longer word) — 5 chars is long/specific
// enough that this doesn't reintroduce the "car"/"carpentry" (3 chars)
// or "pen"/"calligraphy" (3 chars) false positives.
const MIN_STEM_LEN = 5;

const containsWholeTerm = (text, term) => {
  if (!text || !term) return false;
  if (hasArabic(term) || hasArabic(text)) {
    const idx = text.indexOf(term);
    if (idx === -1) return false;
    const before = idx === 0 ? " " : text[idx - 1];
    const afterIdx = idx + term.length;
    const after = afterIdx >= text.length ? " " : text[afterIdx];
    const isBoundary = (ch) => /\s/.test(ch) || ch === undefined;
    return isBoundary(before) && isBoundary(after);
  }
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`\\b${escaped}`).test(text) && term.length >= MIN_STEM_LEN) {
    // prefix-of-a-word match allowed for long-enough roots (plumb -> plumbing)
    return new RegExp(`\\b${escaped}[a-z]*\\b`).test(text);
  }
  return new RegExp(`\\b${escaped}\\b`).test(text);
};

const mapToCategories = (q, lang) => {
  const normalized = normalizeQuery(q);
  const matched = new Map();

  concepts.forEach((concept) => {
    const terms = getConceptTerms(concept, lang);
    let score = 0;

    // Deduplicate terms for matching (a word might appear in both en and ar for mixed)
    const seen = new Set();
    terms.forEach((term) => {
      const t = term.toLowerCase();
      if (seen.has(t)) return;
      seen.add(t);
      // Compare against both the raw normalized query and an
      // Arabic-letter-normalized version, so "النجارة" matches "نجارة".
      // Uses whole-word matching (see containsWholeTerm) so short terms
      // like "car" don't falsely match inside "carpentry".
      if (
        containsWholeTerm(normalized, t) ||
        containsWholeTerm(normalizeArabicWord(normalized), normalizeArabicWord(t))
      ) {
        score += Math.max(10, t.length * 2);
      }
    });

    // Check word-level matches even for partial phrases (Arabic
    // inflections only — see isSafeFuzzyMatch).
    const words = extractKeywords(q, lang);
    words.forEach((word) => {
      const normWord = hasArabic(word) ? normalizeArabicWord(word) : word;
      if (normWord.length < MIN_FUZZY_LEN) return;
      seen.forEach((t) => {
        if (isSafeFuzzyMatch(t, normWord)) {
          score += 5;
        }
      });
    });

    if (score > 0) {
      const existing = matched.get(concept.category) || 0;
      matched.set(concept.category, existing + score);
    }
  });

  return [...matched.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => cat);
};

const detectSkills = (q, lang) => {
  const normalized = normalizeQuery(q);
  const normalizedAr = normalizeArabicWord(normalized);
  const skills = [];

  concepts.forEach((concept) => {
    const terms = getConceptTerms(concept, lang);
    const seen = new Set();
    for (const term of terms) {
      const t = term.toLowerCase();
      if (seen.has(t)) continue;
      seen.add(t);
      if (containsWholeTerm(normalized, t) || containsWholeTerm(normalizedAr, normalizeArabicWord(t))) {
        skills.push(concept.id);
        break;
      }
    }
  });

  // Check individual words (normalized for Arabic so spelling
  // variants and "ال" prefixes resolve to the same index entry).
  const words = extractKeywords(q, lang);
  words.forEach((word) => {
    const normWord = hasArabic(word) ? normalizeArabicWord(word) : word;
    const matches = termIndex[word] || termIndex[normWord];
    if (matches) {
      matches.forEach((m) => {
        if (!skills.includes(m.id)) skills.push(m.id);
      });
    }
  });

  return [...new Set(skills)];
};

export {
  concepts,
  termIndex,
  normalizeQuery,
  normalizeArabic,
  normalizeArabicWord,
  extractKeywords,
  detectLanguage,
  detectIntent,
  expandQuery,
  mapToCategories,
  detectSkills,
  translateToEnglish,
  translateToEnglishWithFallback,
  allTermsEn,
  allTermsAr,
};