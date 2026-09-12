from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "processed" / "shelter_dogs_database.csv"
df_dogs = pd.read_csv(DATA_PATH)

TRAIT_COLS = [
    "energy_level",
    "noise_level",
    "maintenance_level",
    "apartment_suitability",
    "kid_friendliness",
    "independence_level",
    "trainability",
    "space_requirement",
    "exercise_intensity",
]


def recommend_dogs(user_input: dict, top_n: int = 5) -> list[dict]:
    filtered_df = df_dogs.copy()

    # 1. Size Filtering
    size_pref = user_input.get("size_category")
    if isinstance(size_pref, list):
        size_pref = [s for s in size_pref if s and s != "Any"]
        if size_pref:
            filtered_df = filtered_df[filtered_df["size_category"].isin(size_pref)]
    elif isinstance(size_pref, str) and size_pref != "Any" and size_pref:
        filtered_df = filtered_df[filtered_df["size_category"] == size_pref]

    # 2. Age Filtering
    age_pref = user_input.get("age_category")
    if isinstance(age_pref, list):
        age_pref = [a for a in age_pref if a and a != "Any"]
        if age_pref:
            filtered_df = filtered_df[filtered_df["age_category"].isin(age_pref)]
    elif isinstance(age_pref, str) and age_pref != "Any" and age_pref:
        filtered_df = filtered_df[filtered_df["age_category"] == age_pref]

    # 3. Sex Filtering (Strictly for 'Sex upon Outcome')
    sex_pref = user_input.get("sex_category") or user_input.get("sex")
    sex_col = "Sex upon Outcome"

    if sex_col in filtered_df.columns and sex_pref:
        if isinstance(sex_pref, str):
            sex_pref = [sex_pref]

        # Clean array of selected choices (e.g., ['Male'])
        sex_pref_clean = [str(s).strip().lower() for s in sex_pref if s and s != "Any"]

        if sex_pref_clean:
            # Clean database column string values
            clean_series = filtered_df[sex_col].fillna("Unknown").astype(str).str.strip()
            allowed_values = []
            
            if "male" in sex_pref_clean:
                allowed_values.extend(["Intact Male", "Neutered Male"])
            if "female" in sex_pref_clean:
                allowed_values.extend(["Intact Female", "Spayed Female"])

            if allowed_values:
                filtered_df = filtered_df[clean_series.isin(allowed_values)]

    # Return empty list if no dogs match criteria
    if filtered_df.empty:
        return []

    # Stage 2: Cosine Similarity Scoring
    user_vector = np.array(user_input["traits"]).reshape(1, -1)
    dog_matrix = filtered_df[TRAIT_COLS].values

    similarity_scores = cosine_similarity(user_vector, dog_matrix)[0]

    filtered_df = filtered_df.copy()
    filtered_df["match_score"] = (similarity_scores * 100).round(1)

    top_matches = filtered_df.sort_values(by="match_score", ascending=False).head(top_n)
    return top_matches.fillna("").to_dict(orient="records")