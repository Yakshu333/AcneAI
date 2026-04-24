import os
import io
from PIL import Image
import numpy as np

# Load the real keras model
import tensorflow as tf

# Must match the generated folder names during training exactly:
ACNE_CLASSES = [
    "Blackheads", "Cyst", "Papules", 
    "Pustules", "Whiteheads"
]

model = None
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'acne_best_model.h5')

def load_model():
    """
    Load the trained CNN model.
    """
    global model
    print(f"Loading CNN model from {MODEL_PATH}...")
    try:
        model = tf.keras.models.load_model(MODEL_PATH)
        print("Model loaded successfully!")
        return True
    except Exception as e:
        print(f"Warning: Failed to load model from {MODEL_PATH}. Error: {e}")
        print("Please run `python train_model.py` first to generate the model.")
        return False

def preprocess_image(image_path, target_size=(224, 224)):
    """
    Standard image preprocessing before feeding to the CNN.
    Resize, convert to array, expand dimensions, normalize to [0,1].
    """
    try:
        img = Image.open(image_path).convert('RGB')
        img = img.resize(target_size)
        
        # Convert to numpy array and normalize to [0, 1]
        img_array = np.array(img) / 255.0
        
        # Add batch dimension: shape becomes (1, 224, 224, 3)
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    except Exception as e:
        print(f"Error processing image {image_path}: {e}")
        return None

def predict_acne_type(image_path):
    """
    Run the prediction using the real loaded model.
    """
    global model
    
    # 1. Preprocess the image
    img_array = preprocess_image(image_path)
    if img_array is None:
        raise ValueError("Failed to preprocess image.")
    
    # 2. Make prediction
    if model is None:
        # Fallback if model hasn't been loaded (e.g. not trained yet)
        return "Model Not Trained", 0.0
        
    predictions = model.predict(img_array)
    prediction_idx = np.argmax(predictions[0])
    confidence = float(predictions[0][prediction_idx])
    predicted_class = ACNE_CLASSES[prediction_idx]
    
    return predicted_class, round(confidence, 4)

