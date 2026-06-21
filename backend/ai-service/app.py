from flask import Flask, request, jsonify
from flask_cors import CORS
from ai_engine import find_answer
from utils import load_memory, save_memory
import os
import requests
import time

app = Flask(__name__)
CORS(app)

# =========================
# 🔑 CONFIG (Hugging Face API)
# =========================
HF_TOKEN = os.environ.get("HF_TOKEN")
MODEL_ID = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
API_URL = f"https://api-inference.huggingface.co/models/{MODEL_ID}"
headers = {"Authorization": f"Bearer {HF_TOKEN}"}

def query_huggingface(payload):
    """جلب الـ Embeddings من Hugging Face"""
    if not HF_TOKEN:
        print("❌ HF_TOKEN is missing!")
        return None
        
    for _ in range(3):
        response = requests.post(API_URL, headers=headers, json=payload)
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 503:
            time.sleep(5)
            continue
        else:
            print(f"❌ API Error: {response.status_code} - {response.text}")
            return None
    return None

def cosine_similarity(vec1, vec2):
    """حساب التشابه يدوياً لتوفير مساحة المكتبات"""
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    norm_a = sum(a * a for a in vec1) ** 0.5
    norm_b = sum(b * b for b in vec2) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0
    return dot_product / (norm_a * norm_b)

# =========================
# 🤖 CHAT
# =========================
@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    user_id = data.get("user_id", "guest")
    message = data.get("message")
    memory = load_memory()
    if user_id not in memory:
        memory[user_id] = []
    memory[user_id].append(message)
    save_memory(memory)
    answer, confidence = find_answer(message)
    if not answer:
        answer = "ممكن توضح أكتر؟ 👌"
    return jsonify({
        "reply": answer,
        "confidence": confidence
    })

# =========================
# 🧠 SEARCH ENGINE (LIGHTWEIGHT)
# =========================
course_embeddings = {}
category_embeddings = {}

def get_embedding(text):
    """جلب embedding لنص واحد"""
    res = query_huggingface({"inputs": [text]})
    if res and isinstance(res, list) and len(res) > 0:
        return res[0]
    return None

@app.route("/search", methods=["POST"])
def search():
    data = request.json
    query = data.get("query", "")
    courses = data.get("courses", [])
    
    if not query.strip() or not courses:
        return jsonify(courses[:10])

    # 1. Get Query Embedding
    query_emb = get_embedding(query)
    if not query_emb:
        return jsonify(courses[:10])

    # 2. Score Courses
    scored = []
    
    # تحضير النصوص التي سنقوم بعمل embedding لها لتقليل عدد الـ API calls
    # ملاحظة: في النسخة الاحترافية يفضل تخزين الـ embeddings في داتابيز
    for course in courses:
        cid = str(course.get("_id"))
        
        # Semantic Match
        if cid not in course_embeddings:
            text = f"{course.get('title', '')} {course.get('description', '')}"
            course_embeddings[cid] = get_embedding(text)
        
        course_emb = course_embeddings[cid]
        if not course_emb: continue
        
        semantic = cosine_similarity(query_emb, course_emb)
        
        # Category Guidance
        cat = course.get("category", "Other")
        if cat not in category_embeddings:
            category_embeddings[cat] = get_embedding(f"course category: {cat}")
        
        cat_emb = category_embeddings[cat]
        category_score = cosine_similarity(query_emb, cat_emb) if cat_emb else 0
        
        final_score = (semantic * 0.85) + (category_score * 0.15)
        scored.append({"course": course, "score": final_score})

    # 3. Sort and Filter
    scored.sort(key=lambda x: x["score"], reverse=True)
    
    if scored:
        top = scored[0]["score"]
        threshold = max(top * 0.75, 0.50)
        filtered = [x for x in scored if x["score"] >= threshold]
    else:
        filtered = []

    if not filtered:
        filtered = scored[:5]
        
    return jsonify(filtered[:10])

# =========================
# 🚀 RUN
# =========================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)