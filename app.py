import os
import sqlite3
import hashlib
from flask_cors import CORS
from flask import Flask, request, jsonify, session
 
 
app = Flask(__name__) # Flask constructor
 
# 🔧 שינוי 1: סוד מוצפן - Render יגדיר את המשתנה הזה אוטומטית
app.secret_key = os.environ.get("SECRET_KEY", "tele-magica-dev")
 
# 🔧 שינוי 2: כתובת ה-Frontend שלך ב-Netlify - עדכני אחרי ההעלאה
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://YOUR-SITE.netlify.app")
 
CORS(app, supports_credentials=True, origins=[FRONTEND_URL])
 
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = FRONTEND_URL
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    return response
 
# 🔧 שינוי 3: הגדרות Session מותאמות לאינטרנט
app.config.update(
    SESSION_COOKIE_SAMESITE="None",   # שונה מ-Lax ל-None לתמיכה ב-cross-site
    SESSION_COOKIE_SECURE=True        # שונה מ-False ל-True (חובה ב-Render)
)
 
# 🔧 שינוי 4: נתיב ה-DB מגיע ממשתנה סביבה
DB_PATH = os.environ.get("DB_PATH", "telenovelas.db")
 
 
# Block 1: signup
@app.route('/signup', methods=['POST'])
def signup():
    # Convert the type of the user input to json
    data = request.json
    name = data.get('fullName')
    email = data.get('email')
    password = data.get('password')
    # Encrypt the password by sha256
    password_bytes = password.encode('utf-8') 
    Encrypted_password = hashlib.sha256(password_bytes).hexdigest()
 
    try:
        # Connect to the database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        # Add the data of the account of the new user to the table
        query = "INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)"
        cursor.execute(query, (name, email, Encrypted_password))
        conn.commit()
        conn.close()
        # If there is no problem, return a positive answer with status 201
        return jsonify({"message": "¡Cuenta creada con éxito!"}), 201
    # If the email is already in the table (there is a different account with this email)
    except sqlite3.IntegrityError:
        return jsonify({"message": "¡Este email ya está en uso!"}), 400
    except Exception as e:
        return jsonify({"message": f"Error de sistema {str(e)}"}), 500
    
 
 
# block 2: login
@app.route('/login', methods=['POST'])
def login():
    # Convert the type of the user input to json
    data = request.json
    email = data.get('email')
    password = data.get('password')
    # Encrypt the password by sha256
    password_bytes = password.encode('utf-8') 
    Encrypted_password = hashlib.sha256(password_bytes).hexdigest()
    # Connect to the database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Find if the inputs in login are right
    query = "SELECT * FROM users WHERE email = ? AND password = ?"
    cursor.execute(query, (email, Encrypted_password))
    # Get the result from the searching
    user = cursor.fetchone()
    conn.close()
    # If the input the user put is in the table return a positive answer with status 200
    if user:
        session['user_name'] = user[0]
        session['user_email'] = user[1]
        return jsonify({"message": f"¡Bienvenido/a de nuevo!"}), 200
    else:
        return jsonify({"message": "¡Correo electrónico o contraseña incorrectos!"}), 401
 
 
# block 3: get data from user
@app.route('/get_user_data', methods=['GET'])
def get_user_data():
    if 'user_name' in session:
        return jsonify({
            "name": session['user_name'],
            "email": session['user_email']
        }), 200
    else:
        return jsonify({"message": "Not logged in"}), 401
 
 
# block 4: logout
@app.route('/logout')
def logout():
    session.clear()
    response = jsonify({"message": "Logged out successfully"})
    response.set_cookie('session', '', expires=0) 
    return response, 200
 
 
@app.route('/search')
def search():
    query = request.args.get('q', '')
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM catalog WHERE title LIKE ?", ('%' + query + '%',))
    
    results = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(results)
 
 
@app.route('/get_catalog_data')
def get_catalog_data():
    content_type = request.args.get('type')
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    query = "SELECT id, title, image_url FROM catalog WHERE type = ?"
    cursor.execute(query, (content_type,))
    
    rows = cursor.fetchall()
    
    result = []
    for row in rows:
        result.append({
            "id": row["id"],
            "title": row["title"],
            "image_url": row["image_url"]
        })
    conn.close()
    return jsonify(result)
 
 
@app.route('/get_item_details', methods=['GET'])
def get_item_details():
    item_id = request.args.get('id')
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT title, image_url, summary FROM catalog WHERE id = ?", (item_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return jsonify(dict(row))
    return jsonify({"error": f"Item {item_id} not found"}), 404
 
 
 
@app.route('/get_seasons_list')
def get_seasons_list():
    series_id = request.args.get('id')
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT season_num FROM episodes WHERE series_id = ? ORDER BY season_num ASC", (series_id,))
    seasons = [row[0] for row in cursor.fetchall()]
    conn.close()
    return jsonify(seasons)
 
 
@app.route('/get_episodes')
def get_episodes():
    series_id = request.args.get('id')
    season_num = request.args.get('season')
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    if season_num:
        query = "SELECT episode_num, episode_title, youtube_link, summary FROM episodes WHERE series_id = ? AND season_num = ? ORDER BY episode_num ASC"
        cursor.execute(query, (series_id, season_num))
    else:
        query = "SELECT episode_num, episode_title, youtube_link, summary FROM episodes WHERE series_id = ? ORDER BY episode_num ASC"
        cursor.execute(query, (series_id,))
    
    rows = cursor.fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])
 
 
if __name__ == '__main__':
    app.run(debug=True, port=5000)