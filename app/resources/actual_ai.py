from tensorflow.keras.models import load_model
import joblib
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS
from nltk.stem import WordNetLemmatizer
import pickle
import re
import os

# Ingredient normalization function
lemmatizer = WordNetLemmatizer()
def normalize_ingredient(word):
    word = word.lower()
    word = re.sub(r'[^\w\s]', '', word)  # Remove punctuation
    return lemmatizer.lemmatize(word)

def recommend_by_ingredient_overlap(user_ingredients, recipes_df, top_n=3):
    # Normalize user ingredients
    user_set = set([normalize_ingredient(i.strip()) for i in user_ingredients])
    results = []
    for idx, row in recipes_df.iterrows():
        recipe_ingredients = set([normalize_ingredient(w) for w in row['ner_labeled'].split()])
        overlap = user_set & recipe_ingredients
        results.append((len(overlap), row['title'], row['dish_type'], row['ner_labeled']))
    # Sort by number of overlapping ingredients, descending
    results.sort(reverse=True, key=lambda x: x[0])
    return results[:top_n]

# You need to load recipes_df somewhere above, e.g.:

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESOURCES_DIR = os.path.join(BASE_DIR, 'resources')
recipes_df = pd.read_pickle(os.path.join(RESOURCES_DIR, "recipe_embeddings.pkl"))

def find_recipes_by_ingredients(ingredient_list, top_n=3):
    """
    Returns a list of top recipe titles based on ingredient overlap.
    """
    overlap_results = recommend_by_ingredient_overlap(ingredient_list, recipes_df, top_n=top_n)
    recipe_titles = [title for _, title, _, _ in overlap_results]
    return recipe_titles