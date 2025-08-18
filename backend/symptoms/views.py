# symptoms/views.py (Updated to use the new ImprovedDiseasePredictor)
# - Assumes the predictor is initialized via ModelService in apps.py.
# - Updated predict_disease to use predictor.predict() which returns top predictions with confidence.
# - Enhanced response with top 3 predictions and confidence.
# - Kept treatment lookup using full_dataset_df (now in predictor.full_dataset_df).

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .ml_model import ModelService  # Import to initialize predictor

predictor = ModelService().predictor  # Access the initialized predictor

class SymptomCheckerView(APIView):
    """
    API view that uses the improved disease prediction model to predict diseases
    based on user-submitted symptoms. Returns top predictions with confidence.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        symptom_data = request.data

        # --- 1. Data Validation and Preparation ---
        if predictor.full_dataset_df is None:
            return Response(
                {"error": "The prediction model is not ready. Please try again in a moment."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        mandatory_fields = ['age', 'gender', 'primary_symptom_duration']
        optional_symptom_fields = [
            'fever', 'cough', 'headache', 'sore_throat', 'fatigue', 'body_ache',
            'runny_nose', 'sneezing', 'shortness_of_breath', 'chills', 'nausea',
            'vomiting', 'diarrhea', 'abdominal_pain', 'joint_pain', 'rash',
            'frequent_urination', 'burning_sensation_urination', 'back_pain',
            'excessive_thirst', 'blurred_vision', 'anxiety', 'insomnia', 'depression'
        ]

        if not all(field in symptom_data for field in mandatory_fields):
            return Response(
                {"error": f"Missing one or more mandatory fields: {mandatory_fields}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        model_input_data = {}
        for field in mandatory_fields:
            model_input_data[field] = symptom_data[field]
        for field in optional_symptom_fields:
            model_input_data[field] = symptom_data.get(field, 0)

        # --- 2. Get Prediction from the Improved Model ---
        try:
            prediction_result = predictor.predict(model_input_data)
            if "error" in prediction_result:
                return Response({"error": prediction_result["error"]}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            predicted_disease = prediction_result["primary_prediction"]
        except Exception as e:
            return Response({"error": f"An unexpected error occurred during prediction: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # --- 3. Retrieve Treatment Information ---
        match = predictor.full_dataset_df[predictor.full_dataset_df['prognosis'] == predicted_disease]

        if match.empty:
            return Response(
                {"error": f"Treatment information for '{predicted_disease}' could not be found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        treatment_info = match.iloc[0].fillna('N/A')

        # --- 4. Prepare and Send the Final Response ---
        result = {
            'predicted_disease': predicted_disease,
            'confidence': prediction_result["confidence"],
            'top_3_predictions': prediction_result["top_3_predictions"],
            'allopathic_treatment': {
                'medicine_name': treatment_info.get('allopathic_medicine', 'N/A'),
                'frequency': treatment_info.get('allopathic_frequency', 'N/A'),
                'meal_relation': treatment_info.get('allopathic_meal_relation', 'N/A'),
                'routine': treatment_info.get('allopathic_routine', 'N/A'),
                'side_effects': treatment_info.get('allopathic_side_effects', 'N/A'),
                'contraindications': treatment_info.get('allopathic_contraindications', 'N/A'),
            },
            'ayurvedic_treatment': {
                'medicine_name': treatment_info.get('ayurvedic_medicine', 'N/A'),
                'frequency': treatment_info.get('ayurvedic_frequency', 'N/A'),
                'meal_relation': treatment_info.get('ayurvedic_meal_relation', 'N/A'),
                'routine': treatment_info.get('ayurvedic_routine', 'N/A'),
                'side_effects': treatment_info.get('ayurvedic_side_effects', 'N/A'),
                'contraindications': treatment_info.get('ayurvedic_contraindications', 'N/A'),
            }
        }

        return Response(result, status=status.HTTP_200_OK)
