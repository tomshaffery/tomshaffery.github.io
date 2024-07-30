import os
import requests
from flask import Flask, request, jsonify, session, render_template
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = os.urandom(24)

jsonbin_master_key = 'YOUR_JSONBIN_SECRET_KEY'
bin_id = 'YOUR_BIN_ID'
gbooks_api_key = 'YOUR_GOOGLE_BOOKS_API_KEY'

def get_bin():
    url = f"https://api.jsonbin.io/v3/b/{bin_id}/latest"
    headers = {
        'X-Master-Key': jsonbin_master_key
    }
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        return {"error": f"Failed to fetch bin data. Status code: {response.status_code}, Response: {response.text}"}

def update_bin(data):
    url = f"https://api.jsonbin.io/v3/b/{bin_id}"
    headers = {
        'Content-Type': 'application/json',
        'X-Master-Key': jsonbin_master_key
    }
    response = requests.put(url, json=data, headers=headers)
    return response.json()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data['username']
    password = data['password']
    
    bin_data = get_bin()
    if username in [user['username'] for user in bin_data['record']['users']]:
        return jsonify({"message": "User already exists"}), 400
    
    new_user = {
        "username": username,
        "password": generate_password_hash(password),
        "reading_list": [],
        "ratings": {},
        "groups": [],
        "comments": []
    }
    bin_data['record']['users'].append(new_user)
    update_bin(bin_data['record'])
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data['username']
    password = data['password']
    
    bin_data = get_bin()
    user = next((user for user in bin_data['record']['users'] if user['username'] == username), None)
    if not user or not check_password_hash(user['password'], password):
        return jsonify({"message": "Invalid credentials"}), 400
    
    session['username'] = username
    return jsonify({"message": "Logged in successfully"}), 200

@app.route('/logout', methods=['POST'])
def logout():
    session.pop('username', None)
    return jsonify({"message": "Logged out successfully"}), 200

@app.route('/add_to_reading_list', methods=['POST'])
def add_to_reading_list():
    if 'username' not in session:
        return jsonify({"message": "Unauthorized"}), 401
    
    data = request.json
    volume_id = data['volume_id']
    
    bin_data = get_bin()
    user = next(user for user in bin_data['record']['users'] if user['username'] == session['username'])
    if volume_id not in user['reading_list']:
        user['reading_list'].append(volume_id)
        update_bin(bin_data['record'])
    
    return jsonify({"message": "Book added to reading list"}), 200

@app.route('/join_group', methods=['POST'])
def join_group():
    if 'username' not in session:
        return jsonify({"message": "Unauthorized"}), 401
    
    data = request.json
    group_name = data['group_name']
    
    bin_data = get_bin()
    user = next(user for user in bin_data['record']['users'] if user['username'] == session['username'])
    if group_name not in user['groups']:
        user['groups'].append(group_name)
        update_bin(bin_data['record'])
    
    return jsonify({"message": "Joined group"}), 200

@app.route('/comment', methods=['POST'])
def comment():
    if 'username' not in session:
        return jsonify({"message": "Unauthorized"}), 401
    
    data = request.json
    volume_id = data['volume_id']
    comment_text = data['comment']
    
    bin_data = get_bin()
    user = next(user for user in bin_data['record']['users'] if user['username'] == session['username'])
    user['comments'].append({"volume_id": volume_id, "comment": comment_text})
    update_bin(bin_data['record'])
    
    return jsonify({"message": "Comment added"}), 200

@app.route('/search_books', methods=['GET'])
def search_books_route():
    query = request.args.get('query')
    if not query:
        return jsonify({"message": "Query parameter is required"}), 400

    search_results = search_books(query, gbooks_api_key)
    if search_results:
        return jsonify(search_results)
    else:
        return jsonify({"message": "Error searching books"}), 500

def search_books(query, api_key, max_results=10):
    url = "https://www.googleapis.com/books/v1/volumes"
    params = {
        'q': query,
        'maxResults': max_results,
        'key': api_key
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        return None

if __name__ == '__main__':
    app.run(debug=True)
