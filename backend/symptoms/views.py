# symptoms/views.py - FINAL CORRECTED VERSION

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .ml_model import ModelService

# Create an instance of the service, but DO NOT initialize the model yet.
# This line is safe to run at startup.
model_service = ModelService()

class SymptomCheckerView(APIView):
    """
    API view that uses the improved disease prediction model.
    The model is loaded lazily on the first request.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # --- 1. Get the predictor SAFELY at the beginning of the request ---
        try:
            # The model is loaded/trained only when this line is first called.
            # This line defines the 'predictor' variable for the rest of the method.
            predictor = model_service.get_predictor()
        except Exception as e:
            # If model training fails, send a user-friendly error.
            return Response(
                {"error": f"Model is currently unavailable. Please contact support. Details: {str(e)}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        # --- 2. Data Validation and Preparation ---
        # Now it's safe to use the predictor object
        if predictor.full_dataset_df is None:
            return Response(
                {"error": "The prediction model is not ready (dataset not loaded). Please try again."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        symptom_data = request.data
        
        mandatory_fields = ['age', 'gender', 'primary_symptom_duration']
        if not all(field in symptom_data for field in mandatory_fields):
            return Response(
                {"error": f"Missing one or more mandatory fields: {mandatory_fields}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Use the feature columns from the predictor to build the input
        model_input_data = {field: symptom_data.get(field, 0) for field in predictor.feature_columns}
        # Overwrite the mandatory fields to ensure they are correct
        for field in mandatory_fields:
            model_input_data[field] = symptom_data[field]


        # --- 3. Get Prediction from the Model ---
        try:
            prediction_result = predictor.predict(model_input_data)
            if "error" in prediction_result:
                return Response({"error": prediction_result["error"]}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            predicted_disease = prediction_result["primary_prediction"]
        except Exception as e:
            return Response({"error": f"An unexpected error occurred during prediction: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # --- 4. Retrieve Treatment Information ---
        match = predictor.full_dataset_df[predictor.full_dataset_df['prognosis'] == predicted_disease]

        if match.empty:
            treatment_info = {} # No treatment found, prepare empty dict
        else:
            treatment_info = match.iloc[0].fillna('N/A').to_dict()

        # --- 5. Prepare and Send the Final Response ---
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