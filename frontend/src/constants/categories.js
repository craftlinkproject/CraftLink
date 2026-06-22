const CATEGORIES = [
  { id: "carpenter", en: "Carpenter", ar: "النجار" },
  { id: "plumber", en: "Plumber", ar: "سباك" },
  { id: "electrician", en: "Electrician", ar: "كهربائي" },
  { id: "mason", en: "Mason", ar: "بناء" },
  { id: "bricklayer", en: "Bricklayer", ar: "عامل بناء" },
  { id: "painter", en: "Painter", ar: "رسام" },
  { id: "welder", en: "Welder", ar: "لحام" },
  { id: "blacksmith", en: "Blacksmith", ar: "حداد" },
  { id: "roofer", en: "Roofer", ar: "عامل تركيب أسطح" },
  { id: "tiler", en: "Tiler", ar: "تيلر" },
  { id: "concrete-worker", en: "Concrete Worker", ar: "عامل خرسانة" },
  { id: "mechanic", en: "Mechanic", ar: "ميكانيكي" },
  { id: "auto-electrician", en: "Auto Electrician", ar: "كهربائي سيارات" },
  { id: "hvac-technician", en: "HVAC Technician", ar: "فني تكييف وتبريد" },
  { id: "refrigeration-technician", en: "Refrigeration Technician", ar: "فني تبريد" },
  { id: "technician", en: "Technician", ar: "فني" },
  { id: "electronics-technician", en: "Electronics Technician", ar: "فني إلكترونيات" },
  { id: "network-technician", en: "Network Technician", ar: "فني شبكات" },
  { id: "computer-technician", en: "Computer Technician", ar: "فني كمبيوتر" },
  { id: "tailor", en: "Tailor", ar: "خياط" },
  { id: "shoemaker", en: "Shoemaker", ar: "إسكافي" },
  { id: "weaver", en: "Weaver", ar: "نسّاج" },
  { id: "potter", en: "Potter", ar: "خزّاف" },
  { id: "goldsmith", en: "Goldsmith", ar: "صائغ ذهب" },
  { id: "silversmith", en: "Silversmith", ar: "صائغ فضة" },
  { id: "woodworker", en: "Woodworker", ar: "نجار" },
  { id: "sculptor", en: "Sculptor", ar: "نحات" },
  { id: "calligrapher", en: "Calligrapher", ar: "خطاط" },
  { id: "chef", en: "Chef", ar: "شيف" },
  { id: "cook", en: "Cook", ar: "طباخ" },
  { id: "baker", en: "Baker", ar: "خباز" },
  { id: "butcher", en: "Butcher", ar: "جزار" },
  { id: "pastry-chef", en: "Pastry Chef", ar: "شيف حلواني" },
  { id: "barista", en: "Barista", ar: "باريستا" },
  { id: "waiter", en: "Waiter", ar: "نادل" },
  { id: "restaurant-worker", en: "Restaurant Worker", ar: "عامل مطعم" },
  { id: "barber", en: "Barber", ar: "حلاق" },
  { id: "hairdresser", en: "Hairdresser", ar: "مصفف شعر" },
  { id: "makeup-artist", en: "Makeup Artist", ar: "ميكب أرتيست" },
  { id: "cleaner", en: "Cleaner", ar: "عامل نظافة" },
  { id: "gardener", en: "Gardener", ar: "بستاني" },
  { id: "babysitter", en: "Babysitter", ar: "جليسة أطفال" },
  { id: "driver", en: "Driver", ar: "سائق" },
  { id: "delivery-man", en: "Delivery Man", ar: "مندوب توصيل" },
  { id: "security-guard", en: "Security Guard", ar: "حارس أمن" },
  { id: "factory-worker", en: "Factory Worker", ar: "عامل مصنع" },
  { id: "metalworker", en: "Metalworker", ar: "عامل معادن" },
  { id: "textile-worker", en: "Textile Worker", ar: "عامل نسيج" },
  { id: "printer", en: "Printer", ar: "طبّاع" },
  { id: "assembler", en: "Assembler", ar: "عامل تجميع" },
  { id: "programmer", en: "Programmer", ar: "مبرمج" },
  { id: "web-developer", en: "Web Developer", ar: "مطور ويب" },
  { id: "mobile-developer", en: "Mobile Developer", ar: "مطور موبايل" },
  { id: "ui-ux-designer", en: "UI/UX Designer", ar: "مصمم واجهات وتجربة المستخدم" },
  { id: "graphic-designer", en: "Graphic Designer", ar: "مصمم جرافيك" },
  { id: "photographer", en: "Photographer", ar: "مصور" },
  { id: "artist", en: "Artist", ar: "فنان" },
  { id: "musician", en: "Musician", ar: "موسيقي" },
  { id: "video-editor", en: "Video Editor", ar: "مونتير" },
  { id: "farmer", en: "Farmer", ar: "مزارع" },
  { id: "fisherman", en: "Fisherman", ar: "صياد" },
  { id: "animal-breeder", en: "Animal Breeder", ar: "مربي حيوانات" },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export function getCategoryLabel(id, language) {
  const cat = CATEGORY_MAP[id];
  if (!cat) return id;
  return language === "ar" ? cat.ar : cat.en;
}

export function getCategoryId(label) {
  const found = CATEGORIES.find((c) => c.en === label || c.ar === label || c.id === label);
  return found ? found.id : label;
}

export const CATEGORY_GROUPS = [
  {
    labelKey: "Construction & Building",
    items: [
      "carpenter", "plumber", "electrician", "mason", "bricklayer",
      "painter", "welder", "blacksmith", "roofer", "tiler", "concrete-worker",
    ],
  },
  {
    labelKey: "Technical & Engineering",
    items: [
      "mechanic", "auto-electrician", "hvac-technician", "refrigeration-technician",
      "technician", "electronics-technician", "network-technician", "computer-technician",
    ],
  },
  {
    labelKey: "Crafts & Handicrafts",
    items: [
      "tailor", "shoemaker", "weaver", "potter", "goldsmith",
      "silversmith", "woodworker", "sculptor", "calligrapher",
    ],
  },
  {
    labelKey: "Food & Hospitality",
    items: [
      "chef", "cook", "baker", "butcher", "pastry-chef",
      "barista", "waiter", "restaurant-worker",
    ],
  },
  {
    labelKey: "Services",
    items: [
      "barber", "hairdresser", "makeup-artist", "cleaner", "gardener",
      "babysitter", "driver", "delivery-man", "security-guard",
    ],
  },
  {
    labelKey: "Industry & Labor",
    items: [
      "factory-worker", "metalworker", "textile-worker", "printer", "assembler",
    ],
  },
  {
    labelKey: "Creative & Digital",
    items: [
      "programmer", "web-developer", "mobile-developer", "ui-ux-designer",
      "graphic-designer", "photographer", "artist", "musician", "video-editor",
    ],
  },
  {
    labelKey: "Agriculture & Nature",
    items: [
      "farmer", "fisherman", "gardener", "animal-breeder",
    ],
  },
];

export const LEVELS = [
  { id: "Beginner", en: "Beginner", ar: "مبتدئ" },
  { id: "Intermediate", en: "Intermediate", ar: "متوسط" },
  { id: "Advanced", en: "Advanced", ar: "متقدم" },
];

const LEVEL_MAP = Object.fromEntries(LEVELS.map((l) => [l.id, l]));

export function getLevelLabel(id, language) {
  const level = LEVEL_MAP[id];
  if (!level) return id;
  return language === "ar" ? level.ar : level.en;
}

export function getLevelId(label) {
  const found = LEVELS.find((l) => l.en === label || l.ar === label || l.id === label);
  return found ? found.id : label;
}

export default CATEGORIES;
