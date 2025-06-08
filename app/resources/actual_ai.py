from tensorflow.keras.models import load_model
import joblib
import pandas as pd
from nltk.stem import WordNetLemmatizer
import re
import os

# Load model, label encoder, and precomputed recipe embeddings
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESOURCES_DIR = os.path.join(BASE_DIR, 'resources')

model = load_model(os.path.join(RESOURCES_DIR, "recipe_model.keras"))
label_encoder = joblib.load(os.path.join(RESOURCES_DIR, "label_encoder.pkl"))
recipes_df = pd.read_pickle(os.path.join(RESOURCES_DIR, "recipe_embeddings.pkl"))

# Ingredient normalization function
lemmatizer = WordNetLemmatizer()
def normalize_ingredient(word):
    word = word.lower()
    word = re.sub(r'[^\w\s]', '', word)  # Remove punctuation
    return lemmatizer.lemmatize(word)

# Precompute normalized ingredients ONCE
def precompute_normalized_ingredients(df):
    return df.assign(
        normalized_ingredients=df['ner_labeled'].apply(
            lambda s: set(normalize_ingredient(w) for w in s.split())
        )
    )

recipes_df = precompute_normalized_ingredients(recipes_df)

def recommend_by_ingredient_subset(user_ingredients, recipes_df):
    """
    Return all recipes that contain at least all user ingredients (may have more).
    """
    user_set = set(normalize_ingredient(i.strip()) for i in user_ingredients)
    mask = recipes_df['normalized_ingredients'].apply(lambda s: user_set.issubset(s))
    filtered = recipes_df[mask]
    return filtered

def find_recipes_by_ingredients(ingredient_list, top_n=9):
    """
    Returns a list of recipe titles that contain at least all the given ingredients.
    """
    filtered_results = recommend_by_ingredient_subset(ingredient_list, recipes_df)
    recipe_titles = list(filtered_results['title'])[:top_n]
    return recipe_titles