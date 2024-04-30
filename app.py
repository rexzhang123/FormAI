from flask import Flask, request, render_template, jsonify, redirect, url_for, flash
import os
import base64
from PIL import Image
import io
import cv2
import numpy as np
import mediapipe as mp
from dotenv import load_dotenv
from gpt import process_keypoints_data
from posemanual import get_pose_coordinates, draw_keypoints_on_image
from models import db, User
# from dotenv import load_dotenv
import os

app = Flask(__name__)

# set a secret_key for running app
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///mydatabase.db'  # or another database URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize SQLAlchemy with the Flask Application
db.init_app(app)

# Create tables in the database for all models that inherit from db.Model
with app.app_context():
    db.create_all()

# load_dotenv()
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

@app.route('/')
def home():
    return render_template('index.html')

# @app.route('/login')
# def login():
#     return render_template('login.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        return render_template('login.html')
    elif request.method == 'POST':
        username_or_email = request.form['username']
        password = request.form['password']
        
        user = User.query.filter((User.username == username_or_email) | (User.email == username_or_email)).first()
        if user and user.check_password(password):
            # Log the user in (set up session, etc.)
            flash('Login successful! Redirecting...', 'success')
            return render_template('login.html', success='true')
        else:
            flash('Invalid username/email or password', 'error')
            return render_template('login.html')



@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'GET':
        return render_template('register.html', success='false')
    elif request.method == 'POST':
        email = request.form['email']
        username = request.form['username']
        password = request.form['password']

        user = User.query.filter((User.email == email) | (User.username == username)).first()
        if user:
            flash('User already exists', 'error')
            return render_template('register.html', success='false')
        
        new_user = User(email=email, username=username)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()

        flash('Account created successfully! Redirecting to login...', 'success')
        return render_template('register.html', success='true')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/analyze')
def analyze():
    return render_template('analyze.html')


@app.route('/get-suggestions', methods=['POST'])
def get_suggestions():
    data = request.get_json()
    if not data or 'keypoints' not in data:
        return jsonify({'error': 'No keypoints data provided'}), 400
    
    # Call the processing function directly with the keypoints data
    print(data['keypoints'])
    suggestions = process_keypoints_data(data['keypoints'])
    return jsonify({'suggestions': suggestions})

@app.route('/process-image', methods=['POST'])
def process_image():
    try:
        data = request.get_json()
        if not data or 'imageBase64' not in data:
            return jsonify({'error': 'No image data provided'}), 400

        image_data = data['imageBase64'].split(",")[1]
        image_data = base64.b64decode(image_data)
        image_array = np.frombuffer(image_data, dtype=np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

        if image is None or image.size == 0:
            return jsonify({'error': 'Failed to decode the image or the image is empty'}), 400

        # Process the image to get coordinates
        keypoints, processed_image = get_pose_coordinates(image)

        if processed_image is None or processed_image.size == 0:
            return jsonify({'error': 'Processed image is empty'}), 500

        # Convert processed image to a PNG and encode to base64
        return send_image_as_response(processed_image, keypoints)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def send_image_as_response(image, keypoints):
    # Convert OpenCV image to PIL Image
    image_pil = Image.fromarray(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    img_byte_arr = io.BytesIO()
    image_pil.save(img_byte_arr, format='PNG')
    image_base64 = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
    
    return jsonify({
        'keypoints': keypoints,
        'processedImage': 'data:image/png;base64,' + image_base64
    })

if __name__ == '__main__':
    app.run(debug=True)