import os
from datetime import datetime, timezone, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from bson import ObjectId

from api_manager import get_api_manager
from intelligence.argument_analyzer import analyze_with_response
from intelligence.drift_service import calculate_drift_score
from intelligence.drift_policy import interpret_drift_score
from intelligence.dds_engine import update_difficulty
from models.user_state import UserState
from intelligence.ai_judge import generate_debate_summary, calculate_quick_score

load_dotenv()

try:
    api_manager = get_api_manager()
except Exception as e:
    print(f"❌ Failed to initialize API manager: {e}")
    api_manager = None

MONGO_URI = os.getenv("MONGO_URI")
mongo_client = MongoClient(MONGO_URI)
db = mongo_client.debate_platform
debates_collection = db.debates
users_collection = db.users
summaries_collection = db.debate_summaries

app = Flask(__name__)

CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",
            "https://ai-debate-platform-ecru.vercel.app"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "super-secret-key")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)  # Tokens valid for 7 days
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

@app.route("/api/register", methods=["POST"])
def register():
    data = request.json or {}
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password required"}), 400

    if users_collection.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409

    users_collection.insert_one({
        "name": name,
        "email": email,
        "password": bcrypt.generate_password_hash(password).decode(),
        "created_at": datetime.now(timezone.utc),
        "auth_provider": "email"
    })

    return jsonify({"message": "Registered successfully"}), 201

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json or {}
    email = data.get("email")
    password = data.get("password")

    user = users_collection.find_one({"email": email})

    if user and "password" in user and bcrypt.check_password_hash(user["password"], password):
        token = create_access_token(identity=email)
        return jsonify({
            "access_token": token,
            "user_id": str(user["_id"]),
            "name": user.get("name", email.split('@')[0]),
            "email": email
        })

    return jsonify({"error": "Invalid credentials"}), 401

@app.route("/api/auth/google", methods=["POST"])
def google_auth():
    data = request.json or {}
    email = data.get("email")
    name = data.get("name")
    google_id = data.get("google_id")
    image = data.get("image")

    if not email or not google_id:
        return jsonify({"error": "Missing required fields"}), 400

    user = users_collection.find_one({"email": email})

    if user:
        if not user.get("google_id"):
            users_collection.update_one(
                {"email": email},
                {"$set": {"google_id": google_id, "image": image}}
            )
    else:
        users_collection.insert_one({
            "name": name or email.split('@')[0],
            "email": email,
            "google_id": google_id,
            "image": image,
            "created_at": datetime.now(timezone.utc),
            "auth_provider": "google"
        })
        user = users_collection.find_one({"email": email})

    token = create_access_token(identity=email)

    return jsonify({
        "access_token": token,
        "user_id": str(user["_id"]),
        "name": user.get("name", email.split('@')[0]),
        "email": email
    }), 200

@app.route("/api/debate", methods=["POST"])
@jwt_required()
def handle_debate():
    current_user = get_jwt_identity()

    data = request.json or {}
    topic = data.get("topic", "").strip()
    argument = data.get("argument", "").strip()

    if not topic or not argument:
        return jsonify({"error": "Topic and argument required"}), 400

    if len(argument) < 10:
        return jsonify({"error": "Argument too short"}), 400

    if not api_manager:
        return jsonify({"error": "AI service unavailable"}), 503

    try:
        user_state = UserState()

        # Calculate drift score for metrics only (don't enforce)
        def drift_call(api_key):
            return calculate_drift_score(api_key, topic, argument)

        drift_score = api_manager.call_with_retry(drift_call, key_type="analysis")
        drift_result = interpret_drift_score(drift_score)
        
        print(f"🔍 DRIFT CHECK - Topic: '{topic}'")
        print(f"🔍 Argument: '{argument[:50]}...'")
        print(f"🔍 Drift Score: {drift_score:.3f} | Status: {drift_result['status']}")

        # AI will handle off-topic detection in its response
        user_state.drift_score = drift_score
        difficulty_level = update_difficulty(user_state)

        def combined_call(api_key):
            return analyze_with_response(api_key, topic, argument, difficulty_level)

        result = api_manager.call_with_retry(combined_call, key_type="debate")

        ai_reply = result["ai_response"]
        metrics = result["metrics"]

        user_state.update_from_metrics(metrics, drift_score)
        turn_score = calculate_quick_score(metrics, drift_score)

        debate_doc = {
            "user_id": current_user,
            "topic": topic,
            "user_argument": argument,
            "ai_response": ai_reply,
            "difficulty_level": difficulty_level,
            "drift_score": drift_score,
            "metrics": metrics,
            "turn_score": turn_score,
            "created_at": datetime.now(timezone.utc)
        }

        result_db = debates_collection.insert_one(debate_doc)
        debate_id = str(result_db.inserted_id)

        return jsonify({
            "debate_id": debate_id,
            "ai_response": ai_reply,
            "difficulty_level": difficulty_level,
            "drift_score": round(drift_score, 3),
            "drift_status": drift_result,
            "turn_score": turn_score,
            "metrics": metrics
        })

    except Exception as e:
        print("DEBATE ERROR:", e)
        return jsonify({"error": "AI quota exceeded or internal error"}), 503

@app.route("/api/debate/summary", methods=["POST"])
@jwt_required()
def generate_summary():
    current_user = get_jwt_identity()

    data = request.json or {}
    topic = data.get("topic")
    debate_ids = data.get("debate_ids", [])

    if not topic or not debate_ids:
        return jsonify({"error": "Topic and debate_ids required"}), 400

    if not api_manager:
        return jsonify({"error": "AI service unavailable"}), 503

    try:
        debates = list(debates_collection.find({
            "_id": {"$in": [ObjectId(id) for id in debate_ids]},
            "user_id": current_user
        }).sort("created_at", 1))

        if not debates:
            return jsonify({"error": "No debates found"}), 404

        debate_data = {
            "topic": topic,
            "user_arguments": [d["user_argument"] for d in debates],
            "ai_responses": [d["ai_response"] for d in debates],
            "metrics": [d.get("metrics", {}) for d in debates],
            "drift_scores": [d.get("drift_score", 0) for d in debates],
            "difficulty_level": debates[-1].get("difficulty_level", 3)
        }

        def summary_call(api_key):
            return generate_debate_summary(api_key, debate_data)

        summary = api_manager.call_with_retry(summary_call, key_type="judge")

        summary_doc = {
            "user_id": current_user,
            "topic": topic,
            "debate_ids": debate_ids,
            "summary": summary,
            "created_at": datetime.now(timezone.utc)
        }

        result_db = summaries_collection.insert_one(summary_doc)
        summary_id = str(result_db.inserted_id)

        return jsonify({
            "summary_id": summary_id,
            "summary": summary
        })

    except Exception as e:
        print("SUMMARY ERROR:", e)
        return jsonify({"error": str(e)}), 500

@app.route("/api/debate/history/<debate_id>", methods=["GET"])
@jwt_required()
def get_debate_history(debate_id):
    current_user = get_jwt_identity()

    try:
        debate = debates_collection.find_one({
            "_id": ObjectId(debate_id),
            "user_id": current_user
        })

        if not debate:
            return jsonify({"error": "Debate not found"}), 404

        debate["_id"] = str(debate["_id"])
        return jsonify(debate)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/debate/summary/<summary_id>", methods=["GET"])
@jwt_required()
def get_summary(summary_id):
    current_user = get_jwt_identity()

    try:
        summary = summaries_collection.find_one({
            "_id": ObjectId(summary_id),
            "user_id": current_user
        })

        if not summary:
            return jsonify({"error": "Summary not found"}), 404

        summary["_id"] = str(summary["_id"])
        return jsonify(summary)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/dashboard", methods=["GET"])
@jwt_required()
def dashboard():
    current_user = get_jwt_identity()

    debates = list(
        debates_collection.find(
            {
                "user_id": current_user,
                "ai_response": {"$exists": True, "$ne": ""}
            },
            {"_id": 0}
        ).sort("created_at", -1).limit(50)
    )

    summaries = list(
        summaries_collection.find(
            {"user_id": current_user},
            {"_id": 1, "topic": 1, "created_at": 1, "summary": 1}
        ).sort("created_at", -1).limit(20)
    )

    for s in summaries:
        s["_id"] = str(s["_id"])

    return jsonify({
        "debates": debates,
        "summaries": summaries
    })

@app.route("/api/health", methods=["GET"])
def health_check():
    try:
        from intelligence.embedding_engine import get_cache_stats
        cache_stats = get_cache_stats()

        key_status = api_manager.get_key_status() if api_manager else {}

        return jsonify({
            "status": "healthy",
            "api_keys": key_status,
            "cache_stats": cache_stats
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Starting AI Debate Platform")
    print("=" * 60)
    if api_manager:
        key_status = api_manager.get_key_status()
        print(f"✅ DEBATE_KEY: {'Loaded' if key_status['debate_key_loaded'] else 'Missing'}")
        print(f"✅ ANALYSIS_KEY: {'Loaded' if key_status['analysis_key_loaded'] else 'Missing'}")
        print(f"✅ JUDGE_KEY: {'Loaded' if key_status['judge_key_loaded'] else 'Missing'}")
    print(f"✅ Database Connected: {MONGO_URI is not None}")
    print("=" * 60)

    port = int(os.getenv("PORT", 5001))
    debug = os.getenv("FLASK_ENV") != "production"

    app.run(
        host="0.0.0.0",
        port=port,
        debug=debug
    )
