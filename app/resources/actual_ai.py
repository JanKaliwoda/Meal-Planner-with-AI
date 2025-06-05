from tensorflow.keras.models import load_model
import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS
from nltk.stem import WordNetLemmatizer
import pickle
import re
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESOURCES_DIR = os.path.join(BASE_DIR, 'resources')

model = load_model(os.path.join(RESOURCES_DIR, "recipe_model.h5"))
label_encoder = joblib.load(os.path.join(RESOURCES_DIR, "label_encoder.pkl"))
recipes_df = pd.read_pickle(os.path.join(RESOURCES_DIR, "recipe_embeddings.pkl"))
with open(os.path.join(RESOURCES_DIR, "small_glove.pkl"), "rb") as f:
    embeddings_index = pickle.load(f)

lemmatizer = WordNetLemmatizer()

def load_glove_embeddings(glove_path):
    embeddings_index = {}
    with open(glove_path, encoding="utf-8") as f:
        for line in f:
            values = line.split()
            word = values[0]
            vector = np.asarray(values[1:], dtype="float32")
            embeddings_index[word] = vector
    return embeddings_index

def preprocess_ingredients(ingredients):
    words = [w for w in ingredients.lower().split()]
    words = [lemmatizer.lemmatize(w) for w in words]
    return ' '.join(words)

def get_embedding(text, embeddings_index):
    words = text.split()
    embeddings = [embeddings_index[word] for word in words if word in embeddings_index]
    if embeddings:
        return np.mean(embeddings, axis=0)
    else:
        return np.zeros(next(iter(embeddings_index.values())).shape)

def get_phrase_embedding(ingredient_list, embeddings_index):
    embeddings = []
    for phrase in ingredient_list:
        # Clean up phrase: lowercase, remove punctuation
        phrase_clean = re.sub(r'[^\w\s]', '', phrase.lower())
        words = phrase_clean.split()
        # Average GloVe for all words in phrase
        phrase_vecs = [embeddings_index[w] for w in words if w in embeddings_index]
        if phrase_vecs:
            phrase_embedding = np.mean(phrase_vecs, axis=0)
            embeddings.append(phrase_embedding)
    if embeddings:
        return np.mean(embeddings, axis=0)
    else:
        return np.zeros(next(iter(embeddings_index.values())).shape)

ingredient_weights = {
    'beef': 13.0,
    'chicken': 14.0,
    'fish': 7.0,
    'pasta': 2.0,
    'cake': 2.0,
    'pepper': 1.0,
    'onion': 0.7,
    'garlic': 1.5,
    'tomato': 1.5,
    'sugar': 0.8,
    'flour': 1.0,
    'water': 0.5,
    'milk': 1.0,
    'eggs': 1.0,
    'yeast': 1.0,
    'butter': 1.1,
    'oil': 1.1,
    'salt': 0.5,
}
default_weight = 0.9

def get_weighted_phrase_embedding(ingredient_list, embeddings_index):
    embeddings = []
    weights = []
    for phrase in ingredient_list:
        # Clean up phrase: lowercase, remove punctuation
        phrase_clean = re.sub(r'[^\w\s]', '', phrase.lower())
        words = phrase_clean.split()
        main_word = words[-1] if words else ""
        # Average GloVe for all words in phrase
        phrase_vecs = [embeddings_index[w] for w in words if w in embeddings_index]
        if phrase_vecs:
            phrase_embedding = np.mean(phrase_vecs, axis=0)
            weight = ingredient_weights.get(main_word, default_weight)
            embeddings.append(phrase_embedding * weight)
            weights.append(weight)
    if embeddings:
        return np.sum(embeddings, axis=0) / np.sum(weights)
    else:
        return np.zeros(next(iter(embeddings_index.values())).shape)

def find_recipes_by_ingredients(ingredient_list, top_n=3):
    """
    Given a list of ingredient names, use all helper functions and return a list of top recipe titles predicted by the AI.
    """
    # Preprocess ingredients (lemmatize, etc.)
    processed_ingredients = [preprocess_ingredients(ing) for ing in ingredient_list]

    # Get weighted embedding for the input
    new_vec = get_weighted_phrase_embedding(processed_ingredients, embeddings_index).reshape(1, -1)

    # Predict dish type
    predictions = model.predict(new_vec)
    top_indices = np.argsort(predictions[0])[::-1][:top_n]
    top_types = label_encoder.inverse_transform(top_indices)

    # Find best matching recipes for each top dish type
    recipe_titles = []
    for dish_type in top_types:
        recipes = recipes_df[recipes_df['dish_type'] == dish_type]
        if not recipes.empty:
            recipe_embs = np.vstack(recipes['embedding'].values)
            sim = np.dot(recipe_embs, new_vec[0])
            best_idx = np.argmax(sim)
            best_recipe = recipes.iloc[best_idx]
            recipe_titles.append(best_recipe['title'])
    return recipe_titles