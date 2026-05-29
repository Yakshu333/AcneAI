import os
import io
from PIL import Image
import numpy as np
import yolov5
import torch
import functools
import pathlib

# Fix for PosixPath issue when loading Linux-saved models on Windows
pathlib.PosixPath = pathlib.WindowsPath

# Fix for PyTorch 2.6+ weights_only=True default issue
# YOLOv5 models saved as whole objects require weights_only=False
original_torch_load = torch.load
torch.load = functools.partial(torch.load, weights_only=False)

# Classes will be dynamically loaded from the model, but we keep this for reference
# and fallback if needed.
ACNE_CLASSES = [
    "Blackheads", "Cyst", "Papules", 
    "Pustules", "Whiteheads"
]

model = None
# We expect best.pt to be a file in the backend directory
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'best.pt')

def load_model():
    """
    Load the trained YOLOv5 model.
    """
    global model
    print(f"Loading YOLOv5 model from {MODEL_PATH}...")
    try:
        # Using the yolov5 package for better compatibility
        model = yolov5.load(MODEL_PATH)
        print("YOLOv5 Model loaded successfully!")
        return True
    except Exception as e:
        print(f"Warning: Failed to load model from {MODEL_PATH}. Error: {e}")
        return False

def predict_acne_type(image_path):
    """
    Run the prediction using the loaded YOLOv5 model.
    """
    global model
    
    if model is None:
        if not load_model():
            return "Model Not Loaded", 0.0
    
    try:
        # 1. Run inference
        # YOLOv5 can take image path directly
        results = model(image_path)
        
        # Get image dimensions for scaling in the frontend
        img = Image.open(image_path)
        width, height = img.size

        # 2. Process results
        # results.pandas().xyxy[0] returns a DataFrame with detections
        predictions = results.pandas().xyxy[0]
        
        if predictions.empty:
            return "No Acne Detected", 0.0, [], [width, height]
            
        # Get all detections as a list of dicts for the frontend
        detections = []
        for _, row in predictions.iterrows():
            detections.append({
                "box": [float(row['xmin']), float(row['ymin']), float(row['xmax']), float(row['ymax'])],
                "class": str(row['name']).capitalize(),
                "confidence": round(float(row['confidence']), 4)
            })

        # Get the most frequent class among detections
        top_class = predictions['name'].value_counts().idxmax()
        
        # Get average confidence for the top class
        top_class_predictions = predictions[predictions['name'] == top_class]
        avg_confidence = float(top_class_predictions['confidence'].mean())
        
        return top_class.capitalize(), round(avg_confidence, 4), detections, [width, height]
        
    except Exception as e:
        print(f"Error during YOLOv5 prediction: {e}")
        raise ValueError(f"Inference failed: {str(e)}")


