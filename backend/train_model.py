import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model

train_dir = "AcneDataset/train"
valid_dir = "AcneDataset/valid"
test_dir = "AcneDataset/test"

IMG_SIZE = 224
BATCH = 32

# ======================
# DATA
# ======================

train_gen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=25,
    zoom_range=0.3,
    shear_range=0.2,
    horizontal_flip=True,
    fill_mode="nearest"
)

valid_gen = ImageDataGenerator(rescale=1./255)

train_data = train_gen.flow_from_directory(
    train_dir,
    target_size=(224,224),
    batch_size=BATCH,
    class_mode="categorical"
)

valid_data = valid_gen.flow_from_directory(
    valid_dir,
    target_size=(224,224),
    batch_size=BATCH,
    class_mode="categorical"
)

test_data = valid_gen.flow_from_directory(
    test_dir,
    target_size=(224,224),
    batch_size=BATCH,
    class_mode="categorical",
    shuffle=False
)

num_classes = train_data.num_classes


# ======================
# BASE MODEL
# ======================

base = MobileNetV2(
    weights="imagenet",
    include_top=False,
    input_shape=(224,224,3)
)

# Fine tuning (IMPORTANT)
for layer in base.layers[:-30]:
    layer.trainable = False

for layer in base.layers[-30:]:
    layer.trainable = True


# ======================
# TOP LAYERS
# ======================

x = base.output
x = GlobalAveragePooling2D()(x)
x = Dense(512, activation="relu")(x)
x = Dropout(0.5)(x)
output = Dense(num_classes, activation="softmax")(x)

model = Model(inputs=base.input, outputs=output)


# ======================
# COMPILE
# ======================

model.compile(
    optimizer=tf.keras.optimizers.Adam(0.0001),
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

model.summary()


# ======================
# TRAIN
# ======================

history = model.fit(
    train_data,
    validation_data=valid_data,
    epochs=25
)


# ======================
# TEST
# ======================

loss, acc = model.evaluate(test_data)
print("Test accuracy:", acc)


model.save("acne_best_model.h5")
