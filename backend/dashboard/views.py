from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import SymptomLog, WeightLog, DailyMealLog
from .serializers import SymptomLogSerializer, WeightLogSerializer, DailyMealLogSerializer
from django.utils import timezone
from datetime import timedelta
from django.db import transaction, IntegrityError
import time


class DashboardDataView(APIView):
    """Aggregates all necessary data for the user's dashboard."""
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        
        # Health Snapshot: Calculate BMI/BMR from profile data
        bmi_data = {"value": "N/A", "category": "Please complete your profile"}
        bmr_data = {"value": "N/A"}
        try:
            profile = user.profile
            # Debug log to confirm fetched values
            print(f"[Debug] Profile values: age={profile.age}, gender={profile.gender}, weight_kg={profile.weight_kg}, height_cm={profile.height_cm}")

            # Cast to ensure types are correct
            weight = float(profile.weight_kg or 0)
            height = float(profile.height_cm or 0)
            age = int(profile.age or 0)
            gender = profile.gender

            if weight > 0 and height > 0 and age > 0 and gender:
                height_m = height / 100
                bmi = weight / (height_m ** 2)
                bmi = round(bmi, 2)
                if bmi < 18.5:
                    category = "Underweight"
                elif bmi < 25:
                    category = "Normal weight"
                elif bmi < 30:
                    category = "Overweight"
                else:
                    category = "Obesity"
                bmi_data = {"value": bmi, "category": category}

                # BMR calculation
                if gender == 'Male':
                    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
                elif gender == 'Female':
                    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161
                else:  # 'Other' - Average
                    bmr_male = (10 * weight) + (6.25 * height) - (5 * age) + 5
                    bmr_female = (10 * weight) + (6.25 * height) - (5 * age) - 161
                    bmr = (bmr_male + bmr_female) / 2
                bmr = round(bmr)
                bmr_data = {"value": bmr}
                print(f"[Debug] Calculated BMI={bmi} ({category}), BMR={bmr}")
            else:
                print("[Debug] Profile incomplete or invalid - skipping calculation")
        except Exception as e:
                   print(f"[Debug] Error in health snapshot: {e}")

        # Symptom History
        symptom_logs = SymptomLog.objects.filter(user=user)[:3]
        symptom_history = SymptomLogSerializer(symptom_logs, many=True).data

        # Weight Progress
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        weight_logs = WeightLog.objects.filter(user=user, timestamp__gte=thirty_days_ago)
        weight_progress = WeightLogSerializer(weight_logs, many=True).data
        
        # Daily Diet Tracker (Robust retry with sleep and filter fallback)
        date_today = timezone.now().date()
        tries = 3
        meal_log = None
        while tries > 0:
            try:
                with transaction.atomic():
                    meal_log, _ = DailyMealLog.objects.get_or_create(user=user, date=date_today)
                    break
            except IntegrityError:
                tries -= 1
                time.sleep(0.2)
                meal_log = DailyMealLog.objects.filter(user=user, date=date_today).first()
                if meal_log:
                    break
                if tries == 0:
                    print(f"Failed to get/create DailyMealLog for user {user.id} on {date_today}")
                    meal_log = None

        diet_tracker = DailyMealLogSerializer(meal_log).data if meal_log else {}

        dashboard_data = {
            'user': {'username': user.username},
            'health_snapshot': {'bmi': bmi_data, 'bmr': bmr_data},
            'symptom_history': symptom_history,
            'weight_progress': weight_progress,
            'diet_tracker': diet_tracker,
        }
        return Response(dashboard_data, status=status.HTTP_200_OK)


class UpdateMealLogView(APIView):
    """Updates meal completion status with accurate toggling and retry handling."""
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        meal = request.data.get('meal')
        status_val = request.data.get('status')  # Expect boolean for accuracy
        if meal not in ['breakfast_completed', 'lunch_completed', 'dinner_completed']:
            return Response({"error": "Invalid meal type."}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(status_val, bool):  # Ensure precise input
            return Response({"error": "Status must be a boolean."}, status=status.HTTP_400_BAD_REQUEST)
        
        date_today = timezone.now().date()
        tries = 3
        log = None
        while tries > 0:
            try:
                with transaction.atomic():
                    log, _ = DailyMealLog.objects.get_or_create(user=request.user, date=date_today)
                    break
            except IntegrityError:
                tries -= 1
                time.sleep(0.2)
                log = DailyMealLog.objects.filter(user=request.user, date=date_today).first()
                if log:
                    break
                if tries == 0:
                    return Response({"error": "Unable to update meal log. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        setattr(log, meal, status_val)
        log.save()  # Save changes accurately
        return Response(DailyMealLogSerializer(log).data, status=status.HTTP_200_OK)


class LogWeightView(APIView):
    """Logs weight with precise updates, handling duplicates and retries."""
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            weight = float(request.data.get('weight'))  # Ensure precise float conversion
            if weight <= 0:
                raise ValueError
        except (TypeError, ValueError):
            return Response({"error": "Valid positive weight required."}, status=status.HTTP_400_BAD_REQUEST)
        
        date_today = timezone.now().date()
        tries = 3
        log = None
        while tries > 0:
            try:
                with transaction.atomic():
                    log, _ = WeightLog.objects.update_or_create(
                        user=request.user, 
                        timestamp=date_today,
                        defaults={'weight_kg': weight}  # Precise update
                    )
                    break
            except IntegrityError:
                tries -= 1
                time.sleep(0.2)
                log = WeightLog.objects.filter(user=request.user, timestamp=date_today).first()
                if log:
                    log.weight_kg = weight
                    log.save()
                    break
                if tries == 0:
                    return Response({"error": "Unable to log weight. Please try again."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(WeightLogSerializer(log).data, status=status.HTTP_200_OK)
