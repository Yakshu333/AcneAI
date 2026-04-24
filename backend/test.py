import os
# Suppress TensorFlow logging
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix

# ======================
# LOAD MODEL
# ======================
print("Loading model...")
model = tf.keras.models.load_model("acne_best_model.h5")

# ======================
# LOAD TEST DATA
# ======================
test_dir = "AcneDataset/test"

test_gen = ImageDataGenerator(rescale=1./255)

test_data = test_gen.flow_from_directory(
    test_dir,
    target_size=(224, 224),
    batch_size=32,
    class_mode="categorical",
    shuffle=False
)

# ======================
# BASIC ACCURACY
# ======================
print("\nEvaluating model on test data...")
loss, acc = model.evaluate(test_data, verbose=1)
print(f"Test Accuracy: {acc:.4f}")

# ======================
# PREDICTIONS
# ======================
print("\nGenerating predictions...")
# Resetting generator to ensure it starts from the first image
test_data.reset()
predictions = model.predict(test_data, verbose=1)
y_pred = np.argmax(predictions, axis=1)
y_true = test_data.classes

# ======================
# CLASS NAMES
# ======================
# More robust way to get class names in the correct order
class_names = [k for k, v in sorted(test_data.class_indices.items(), key=lambda item: item[1])]

# ======================
# DETAILED REPORT
# ======================
print("\nClassification Report:")
print(classification_report(y_true, y_pred, target_names=class_names))

# ======================
# CONFUSION MATRIX
# ======================
print("\nConfusion Matrix:")
print(confusion_matrix(y_true, y_pred))

print("\nAnalysis Complete.")