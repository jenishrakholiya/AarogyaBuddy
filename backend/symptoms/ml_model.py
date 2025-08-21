# ml_model.py - CORRECTED

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.utils.class_weight import compute_class_weight
import warnings
import os
from django.conf import settings

warnings.filterwarnings('ignore')

class ImprovedDiseasePredictor:
    """
    Enhanced disease prediction model with robust training.
    """
    def __init__(self, dataset_path='dataset.csv', min_samples=5):
        self.dataset_path = os.path.join(settings.BASE_DIR, dataset_path)
        self.feature_columns = [
            'age', 'gender', 'primary_symptom_duration', 'fever', 'cough', 'headache',
            'sore_throat', 'fatigue', 'body_ache', 'runny_nose', 'sneezing',
            'shortness_of_breath', 'chills', 'nausea', 'vomiting', 'diarrhea',
            'abdominal_pain', 'joint_pain', 'rash', 'frequent_urination',
            'burning_sensation_urination', 'back_pain', 'excessive_thirst',
            'blurred_vision', 'anxiety', 'insomnia', 'depression'
        ]
        self.min_samples = min_samples
        self.ml_model = None
        self.model_columns = None
        self.full_dataset_df = None
        # IMPORTANT: We call train_model() upon initialization.
        self.train_model()

    def load_and_filter(self):
        """Load dataset and filter out classes with insufficient samples"""
        df = pd.read_csv(self.dataset_path)
        if 'prognosis' not in df.columns:
            raise ValueError("Target column 'prognosis' not found in dataset.")
        
        counts = df['prognosis'].value_counts()
        valid_classes = counts[counts >= self.min_samples].index
        df = df[df['prognosis'].isin(valid_classes)].copy()
        
        print(f"Dataset loaded: {len(df)} samples across {len(valid_classes)} diseases")
        self.full_dataset_df = df.copy()
        return df

    def preprocess_data(self, df):
        """Preprocess data for the model."""
        features_in_df = [col for col in self.feature_columns if col in df.columns]
        X = df[features_in_df]
        y = df['prognosis']
        
        cat_cols = ['gender', 'primary_symptom_duration']
        X = pd.get_dummies(X, columns=[col for col in cat_cols if col in X.columns], drop_first=True)
        self.model_columns = X.columns.tolist()
        return X, y

    def train_model(self):
        """Train model with improved parameters and validation"""
        df = self.load_and_filter()
        
        if df.empty:
            print("ERROR: Dataset is empty after filtering. Model cannot be trained.")
            return

        X, y = self.preprocess_data(df)

        try:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, stratify=y, random_state=42
            )
        except ValueError as e:
            print(f"Warning: Stratification failed: {e}. Falling back to non-stratified split.")
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
        
        self.ml_model = RandomForestClassifier(
            n_estimators=300,
            random_state=42,
            class_weight='balanced',
            max_depth=20,
            min_samples_split=5,
            min_samples_leaf=2,
            n_jobs=-1
        )
        self.ml_model.fit(X_train, y_train)
        
        y_pred = self.ml_model.predict(X_test)
        print("--- Model Training Complete ---")
        print(f"Validation Accuracy: {accuracy_score(y_test, y_pred):.4f}")

    def predict(self, symptom_dict):
        """Predict disease with confidence scores."""
        if self.ml_model is None or self.model_columns is None:
            return {"error": "Model is not trained or available."}
        
        input_df = pd.DataFrame([symptom_dict])
        input_df = pd.get_dummies(input_df, columns=['gender', 'primary_symptom_duration'], drop_first=True)
        input_df = input_df.reindex(columns=self.model_columns, fill_value=0)
        
        try:
            prediction = self.ml_model.predict(input_df)[0]
            probabilities = self.ml_model.predict_proba(input_df)[0]
            
            prob_dict = dict(zip(self.ml_model.classes_, probabilities))
            top_3 = sorted(prob_dict.items(), key=lambda x: x[1], reverse=True)[:3]
            
            return {
                "primary_prediction": prediction,
                "confidence": round(prob_dict[prediction], 4),
                "top_3_predictions": [(disease, round(prob, 4)) for disease, prob in top_3]
            }
        except Exception as e:
            return {"error": f"Prediction error: {e}"}


# Singleton class with LAZY LOADING to manage model initialization
class ModelService:
    _instance = None
    _predictor = None  # This will hold the actual predictor instance

    def __new__(cls):
        if cls._instance is None:
            print("Creating ModelService singleton instance.")
            cls._instance = super(ModelService, cls).__new__(cls)
        return cls._instance

    def get_predictor(self):
        """
        This is the key method. It returns the predictor instance,
        and initializes it ONLY on the first call.
        """
        if self._predictor is None:
            print("Initializing the disease predictor model for the first time...")
            try:
                # The model is only created and trained HERE, not when the app starts.
                self._predictor = ImprovedDiseasePredictor()
                print("Model initialized successfully.")
            except Exception as e:
                print(f"FATAL: Failed to initialize the prediction model: {e}")
                # Re-raise the exception so the view can handle it gracefully.
                raise e
        
        return self._predictor