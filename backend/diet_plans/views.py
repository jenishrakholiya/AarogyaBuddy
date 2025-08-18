from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .logic import calculate_bmi, calculate_bmr, generate_recommendations

class DietPlanView(APIView):
    """
    API view to generate a personalized diet and workout plan.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        data = request.data
        required_fields = ['age', 'gender', 'weight', 'height', 'activity_level']
        
        if not all(field in data for field in required_fields):
            return Response({"error": "Missing required fields."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            age = int(data['age'])
            weight_kg = float(data['weight'])
            height_cm = float(data['height'])
            gender = data['gender']
            activity_level = data['activity_level']
            height_m = height_cm / 100

            # Perform calculations using the logic from your script
            bmi, bmi_category = calculate_bmi(weight_kg, height_m)
            bmr = calculate_bmr(weight_kg, height_cm, age, gender)
            diet_plan, workout_plan = generate_recommendations(bmi_category, bmr, activity_level)

            # Prepare the response
            response_data = {
                'bmi': bmi,
                'bmi_category': bmi_category,
                'bmr': bmr,
                'diet_plan': diet_plan,
                'workout_plan': workout_plan
            }
            return Response(response_data, status=status.HTTP_200_OK)

        except (ValueError, TypeError):
            return Response({"error": "Invalid data types for numeric fields."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)