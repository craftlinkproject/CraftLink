import Course from "../model/courseModel.js";
import {
  detectLanguage,
  detectIntent,
  expandQuery,
  mapToCategories,
  detectSkills,
  translateToEnglish,
} from "../utils/semanticSearch/conceptMapper.js";
import { TfIdfVectorizer } from "../utils/semanticSearch/vectorizer.js";
import { rankResults, combineFallback } from "../utils/semanticSearch/rankingEngine.js";

export const smartSearchCourses = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.length < 2) {
      return res.json({
        query: query || "",
        intent: "",
        skills_detected: [],
        results: [],
        suggestions: [],
        fallback_used: false,
      });
    }

    const lang = detectLanguage(query);

    // Translate Arabic queries to English for searching against the English
    // database using the built-in bilingual dictionary (covers 30+ trades
    // and common Arabic words). Unknown words pass through untranslated.
    const englishQuery = translateToEnglish(query);

    const intent = detectIntent(query);
    const expandedTerms = expandQuery(englishQuery, "en");
    // Also run category/skill detection against the original query (Arabic)
    // so that even when translation misses some words, category matching works.
    const matchedCategories = mapToCategories(
      lang === "ar" || lang === "mixed" ? query : englishQuery,
      lang
    );
    const skills = detectSkills(
      lang === "ar" || lang === "mixed" ? query : englishQuery,
      lang
    );

    const courses = await Course.find({ isPublished: true })
      .populate({ path: "reviews", select: "rating", strictPopulate: false })
      .populate({ path: "creator", select: "name photoUrl", strictPopulate: false })
      .populate({ path: "lectures", select: "duration", strictPopulate: false })
      .lean();

    const idMapped = courses.map((c) => ({
      ...c,
      _id: c._id.toString(),
      enrolledCount: c.enrolledCraftsmen?.length || c.studentsEnrolled || 0,
      creator: c.creator || { name: "", photoUrl: "" },
      lectures: c.lectures || [],
    }));

    // Build fresh vectorizer and search using English query for matching against English DB
    const vec = new TfIdfVectorizer();
    const expandedQueryText = [...new Set([englishQuery, ...expandedTerms])].join(" ");
    const scored = vec.search(expandedQueryText, idMapped, ["title", "subTitle", "description", "category"]);

    const semanticMap = new Map();
    scored.forEach((s) => semanticMap.set(s.item._id, s.score));

    const ranked = rankResults({
      items: idMapped,
      query: englishQuery,
      expandedTerms,
      intent,
      matchedCategories,
      skills,
      semanticScores: semanticMap,
    });

    const mapCourse = (item, relevance_score) => ({
      _id: item._id,
      title: item.title,
      subTitle: item.subTitle || "",
      description: item.description || "",
      category: item.category,
      level: item.level || "",
      price: item.price || 0,
      thumbnail: item.thumbnail || "",
      enrolledCount: item.enrolledCount,
      creator: item.creator || { name: "", photoUrl: "" },
      lectures: item.lectures || [],
      reviews: item.reviews || [],
      relevance_score,
    });

    let results = [];
    let suggestions = [];
    let fallbackUsed = false;

    if (ranked.length === 0) {
      fallbackUsed = true;
      let fallbackCourses = combineFallback(idMapped, matchedCategories, skills, englishQuery, 12);

      // For Arabic queries, guarantee results by falling back
      // through skills → categories → popular courses.
      if (fallbackCourses.length === 0 && (lang === "ar" || lang === "mixed")) {
        // Try matching by detected skills -> course categories
        const skillCats = skills
          .map((s) => s.replace(/-/g, " ").toLowerCase());
        const skillMatched = idMapped
          .filter((c) =>
            skillCats.some((sc) =>
              (c.category || "").toLowerCase().includes(sc) ||
              sc.includes((c.category || "").toLowerCase())
            )
          )
          .sort((a, b) => (b.enrolledCount || 0) - (a.enrolledCount || 0))
          .slice(0, 12);
        if (skillMatched.length > 0) {
          fallbackCourses = skillMatched;
        } else {
          // Ultimate fallback: most popular published courses
          fallbackCourses = [...idMapped]
            .sort((a, b) => (b.enrolledCount || 0) - (a.enrolledCount || 0))
            .slice(0, 12);
        }
      }

      results = fallbackCourses.map((item) => mapCourse(item, 0));

      // Build additional suggestions from popular courses not in results
      const resultIds = new Set(results.map((r) => r._id));
      const popularCourses = idMapped
        .filter((item) => !resultIds.has(item._id))
        .sort((a, b) => b.enrolledCount - a.enrolledCount)
        .slice(0, 6);

      suggestions = popularCourses.map((item) => ({
        ...mapCourse(item, 0),
        reason: item.enrolledCount > 0 ? "popular" : "available",
      }));

      return res.json({
        query,
        english_query: englishQuery,
        intent,
        skills_detected: skills,
        matched_categories: matchedCategories,
        results,
        suggestions,
        fallback_used: fallbackUsed,
        total_results: results.length,
      });
    }

    results = ranked.slice(0, 12).map((r) => mapCourse(r.item, r.score));

    // If fewer than 3 results, add suggestions
    if (results.length < 3) {
      const resultIds = new Set(results.map((r) => r._id));
      const popularCourses = idMapped
        .filter((item) => !resultIds.has(item._id))
        .sort((a, b) => b.enrolledCount - a.enrolledCount)
        .slice(0, 6);

      suggestions = popularCourses.map((item) => ({
        ...mapCourse(item, 0),
        reason: item.enrolledCount > 0 ? "popular" : "available",
      }));
    }

    res.json({
      query,
      english_query: englishQuery,
      intent,
      skills_detected: skills,
      matched_categories: matchedCategories,
      results,
      suggestions,
      fallback_used: fallbackUsed,
      total_results: results.length,
    });
  } catch (err) {
    console.error("Semantic Search Error:", err.message);
    res.status(500).json({
      query: req.body.query || "",
      english_query: "",
      intent: "",
      skills_detected: [],
      matched_categories: [],
      results: [],
      suggestions: [],
      fallback_used: true,
      total_results: 0,
      error: "Search failed",
    });
  }
};