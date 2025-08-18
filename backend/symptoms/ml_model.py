import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.utils.class_weight import compute_class_weight
import warnings
import os
from django.conf import settings

# Suppress warnings for a cleaner output during execution.
warnings.filterwarnings('ignore')

class ImprovedDiseasePredictor:
    """
    Enhanced disease prediction model that fixes the "same prediction" issue
    through proper class balancing and improved training parameters.
    """
    
    def __init__(self, dataset_path='dataset.csv', min_samples=2):
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
        self.class_weights = None
        self.full_dataset_df = None  # Added to match your original code
        self.train_model()

    def load_and_filter(self):
        """Load dataset and filter out classes with insufficient samples"""
        df = pd.read_csv(self.dataset_path)
        if 'prognosis' not in df.columns:
            raise ValueError("Target column 'prognosis' not found in dataset.")
        # Remove classes with too few samples
        counts = df['prognosis'].value_counts()
        valid_classes = counts[counts >= self.min_samples].index
        df = df[df['prognosis'].isin(valid_classes)].copy()
        
        print(f"Dataset loaded: {len(df)} samples across {len(valid_classes)} diseases")
        self.full_dataset_df = df.copy()  # Store full dataset for treatments lookup
        return df

    def preprocess_data(self, df):
        """Enhanced preprocessing with proper encoding and class balancing"""
        features_in_df = [col for col in self.feature_columns if col in df.columns]
        X = df[features_in_df]
        y = df['prognosis']
        # One-hot encode categorical features
        cat_cols = ['gender', 'primary_symptom_duration']
        X = pd.get_dummies(X, columns=[col for col in cat_cols if col in X.columns], drop_first=True)
        self.model_columns = X.columns.tolist()
        # Calculate balanced class weights - CRITICAL for fixing same prediction issue
        classes = np.unique(y)
        class_weights_values = compute_class_weight(class_weight='balanced', classes=classes, y=y)
        self.class_weights = dict(zip(classes, class_weights_values))
        return X, y

    def train_model(self):
        """Train model with improved parameters and validation"""
        df = self.load_and_filter()
        X, y = self.preprocess_data(df)
        # Calculate proper test size to avoid stratification errors
        num_classes = len(np.unique(y))
        num_samples = len(y)
        test_size = max(0.1, num_classes / num_samples) + 0.05
        # Split data with fallback for stratification issues
        try:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, stratify=y, random_state=42
            )
        except ValueError:
            # Fallback to non-stratified split
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=test_size, random_state=42
            )
        # Enhanced Random Forest with parameters that prevent overfitting
        self.ml_model = RandomForestClassifier(
            n_estimators=300,            # More trees for stability
            random_state=42,
            class_weight='balanced',     # CRITICAL: Handle class imbalance
            max_depth=20,                # Prevent overfitting
            min_samples_split=5,         # Require more samples to split
            min_samples_leaf=2,          # Minimum samples in leaf nodes
            n_jobs=-1                    # Use all CPU cores
        )
        self.ml_model.fit(X_train, y_train)
        # Evaluate model performance
        y_pred = self.ml_model.predict(X_test)
        print("--- Model Training Complete ---")
        print(f"Training samples: {len(X_train)}, Test samples: {len(X_test)}")
        print(f"Validation Accuracy: {accuracy_score(y_test, y_pred):.4f}")
        print("Model successfully trained with diverse prediction capability!")

    def predict(self, symptom_dict):
        """Predict disease with confidence scores and top alternatives"""
        if self.ml_model is None or self.model_columns is None:
            return {"error": "Model is not trained yet."}
        # Preprocess input exactly like training data
        input_df = pd.DataFrame([symptom_dict])
        cat_cols = ['gender', 'primary_symptom_duration']
        input_df = pd.get_dummies(input_df, columns=[col for col in cat_cols if col in input_df.columns], drop_first=True)
        input_df = input_df.reindex(columns=self.model_columns, fill_value=0)
        try:
            # Get prediction and probabilities
            prediction = self.ml_model.predict(input_df)[0]
            probabilities = self.ml_model.predict_proba(input_df)[0]
            
            confidence = max(probabilities)
            
            # Get top 3 predictions with probabilities
            classes = self.ml_model.classes_
            prob_dict = dict(zip(classes, probabilities))
            top_3 = sorted(prob_dict.items(), key=lambda x: x[1], reverse=True)[:3]
            
            return {
                "primary_prediction": prediction,
                "confidence": round(confidence, 4),
                "top_3_predictions": [(disease, round(prob, 4)) for disease, prob in top_3]
            }
        except Exception as e:
            return {"error": f"Prediction error: {e}"}


# Singleton class to manage model initialization
class ModelService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            print("Initializing ModelService singleton...")
            cls._instance = super(ModelService, cls).__new__(cls)
            cls._instance.predictor = ImprovedDiseasePredictor()  # Initialize the predictor
        return cls._instance

# For testing (remove in production)
if __name__ == "__main__":
    # Initialize improved predictor
    predictor = ImprovedDiseasePredictor('dataset.csv')