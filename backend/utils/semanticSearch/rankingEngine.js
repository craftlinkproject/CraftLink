const MIN_RELEVANCE_THRESHOLD = 0.01;

const rankResults = ({
  items,
  query,
  expandedTerms,
  intent,
  matchedCategories,
  skills,
  semanticScores,
  weights = {
    semantic: 0.4,
    category: 0.25,
    title: 0.2,
    popularity: 0.1,
    intentBonus: 0.05,
  },
}) => {
  const normQuery = query.toLowerCase();
  const queryTerms = normQuery.split(/\s+/).filter((t) => t.length >= 2);

  return items
    .map((item) => {
      let score = 0;

      // 1. Semantic similarity score
      const semantic = semanticScores.get(item._id) || 0;
      score += semantic * weights.semantic;

      // 2. Category match strength
      const cat = item.category || "";
      const catLower = cat.toLowerCase();
      let catScore = 0;

      matchedCategories.forEach((matchedCat, idx) => {
        if (catLower.includes(matchedCat.toLowerCase()) ||
            matchedCat.toLowerCase().includes(catLower)) {
          catScore += Math.max(0, 1 - idx * 0.15);
        }
      });

      // Also check expanded terms against category
      expandedTerms.forEach((term) => {
        if (catLower.includes(term)) {
          catScore += 0.3;
        }
      });

      score += Math.min(catScore, 1) * weights.category;

      // 3. Title match (direct term overlap)
      const title = (item.title || "").toLowerCase();
      let titleScore = 0;

      if (title === normQuery) titleScore += 1;
      else if (title.startsWith(normQuery)) titleScore += 0.8;
      else if (title.includes(normQuery)) titleScore += 0.6;

      // Subtitle match
      const subTitle = (item.subTitle || "").toLowerCase();
      let subTitleScore = 0;
      if (subTitle.includes(normQuery)) subTitleScore += 0.4;
      queryTerms.forEach((qt) => {
        if (subTitle.includes(qt)) subTitleScore += 0.2;
      });

      // Description match
      const desc = (item.description || "").toLowerCase();
      let descScore = 0;
      if (desc.includes(normQuery)) descScore += 0.3;
      queryTerms.forEach((qt) => {
        if (desc.includes(qt)) descScore += 0.15;
      });

      // Term-level title match
      const titleTerms = title.split(/\s+/);
      let termOverlap = 0;
      queryTerms.forEach((qt) => {
        if (titleTerms.some((tt) => tt.includes(qt) || qt.includes(tt))) {
          termOverlap++;
        }
      });
      titleScore = Math.max(titleScore, termOverlap / Math.max(queryTerms.length, 1));

      score += titleScore * weights.title;

      // 4. Description/subTitle boost (combined extra weight)
      const textScore = Math.min(subTitleScore + descScore, 0.5);
      score += textScore * 0.1;

      // 5. Popularity boost
      const enrolled = item.enrolledCraftsmen?.length || item.studentsEnrolled || 0;
      const popScore = Math.min(enrolled / 100, 1);
      score += popScore * weights.popularity;

      // 6. Intent bonus
      if (intent === "learning" && catScore > 0) score += weights.intentBonus;
      if (intent === "creation" && (catScore > 0 || titleScore > 0)) score += weights.intentBonus;

      return { item, score: Math.round(score * 1000) / 1000 };
    })
    .filter((r) => r.score >= MIN_RELEVANCE_THRESHOLD)
    .sort((a, b) => b.score - a.score);
};

const hasArabic = (text) => /[\u0600-\u06FF]/.test(text);

const skillToCategory = {
  carpentry: "carpentry", plumbing: "plumbing", electricity: "electricity",
  painting: "painting", masonry: "construction", welding: "metal works",
  roofing: "construction", mechanics: "mechanics", "auto-electric": "technical",
  hvac: "technical", electronics: "electronics", networking: "technical",
  "computer-tech": "technical", tailoring: "crafts", shoemaking: "crafts",
  weaving: "crafts", pottery: "crafts", calligraphy: "crafts",
  culinary: "food", butchery: "food", barista: "food",
  barbering: "services", beauty: "services", cleaning: "services",
  gardening: "services", driving: "services", security: "services",
  programming: "creative", "web-dev": "creative", "mobile-dev": "creative",
  "ui-ux": "creative", photography: "creative", music: "creative",
  farming: "agriculture", fishing: "agriculture", "animal-husbandry": "agriculture",
  freelancing: "creative", "digital-marketing": "creative", ecommerce: "creative",
};

const combineFallback = (items, matchedCategories, skills = [], query = "", limit = 12) => {
  const scored = items.map((item) => {
    let score = 0;

    // Popularity is the primary signal for fallback
    const enrolled = item.enrolledCraftsmen?.length || item.studentsEnrolled || 0;
    score += Math.min(enrolled / 50, 1) * 0.5;

    // Category match
    const cat = item.category || "";
    const catLower = cat.toLowerCase();
    if (matchedCategories.some((mc) =>
      catLower.includes(mc.toLowerCase()) || mc.toLowerCase().includes(catLower)
    )) {
      score += 0.3;
    }

    // Skill-based category match
    if (skills.length > 0) {
      const matchedSkillCategory = skills.some((sk) => {
        const skillCat = skillToCategory[sk];
        return skillCat && catLower.includes(skillCat);
      });
      if (matchedSkillCategory) score += 0.25;
    }

    // Partial text match against query.
    // If the query still contains Arabic, it can't match English course text,
    // so rely on category + popularity + skill matching instead. For English
    // queries, also try text matching.
    if (query && !hasArabic(query)) {
      const norm = query.toLowerCase();
      const title = (item.title || "").toLowerCase();
      const desc = (item.description || "").toLowerCase();
      if (title.includes(norm)) score += 0.4;
      else if (desc.includes(norm)) score += 0.2;
      else {
        const queryTerms = norm.split(/\s+/).filter((t) => t.length >= 2);
        const allText = `${title} ${desc} ${catLower}`;
        const matchCount = queryTerms.filter((t) => allText.includes(t)).length;
        score += (matchCount / Math.max(queryTerms.length, 1)) * 0.2;
      }
    }

    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.item);
};

export { rankResults, combineFallback };
