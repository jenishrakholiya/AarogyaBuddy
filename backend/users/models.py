# users/models.py (Updated for validation and 'Other' gender handling in BMR)
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal  # For precise decimal handling

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

class UserProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profile')
    age = models.PositiveIntegerField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=[('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')], null=True, blank=True)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    height_cm = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email}'s Profile"

    def save(self, *args, **kwargs):
        # Validation: Prevent saving invalid/zero values
        if self.age is not None and self.age <= 0:
            self.age = None
        if self.weight_kg is not None and self.weight_kg <= 0:
            self.weight_kg = None
        if self.height_cm is not None and self.height_cm <= 0:
            self.height_cm = None
        super().save(*args, **kwargs)

    def calculate_bmi(self):
        if not all([self.weight_kg, self.height_cm]) or float(self.weight_kg) <= 0 or float(self.height_cm) <= 0:
            return None, None
        height_m = float(self.height_cm) / 100
        bmi = float(self.weight_kg) / (height_m ** 2)
        if bmi < 18.5:
            category = "Underweight"
        elif bmi < 25:
            category = "Normal weight"
        elif bmi < 30:
            category = "Overweight"
        else:
            category = "Obesity"
        return round(bmi, 1), category

    def calculate_bmr(self):
        if not all([self.weight_kg, self.height_cm, self.age, self.gender]) or float(self.weight_kg) <= 0 or float(self.height_cm) <= 0 or self.age <= 0:
            return None
        weight = float(self.weight_kg)
        height = float(self.height_cm)
        age = int(self.age)
        if self.gender == 'Male':
            bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
        elif self.gender == 'Female':
            bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161
        else:  # 'Other' - Use average (or prompt user; here, average of male/female)
            bmr_male = (10 * weight) + (6.25 * height) - (5 * age) + 5
            bmr_female = (10 * weight) + (6.25 * height) - (5 * age) - 161
            bmr = round((bmr_male + bmr_female) / 2)
        return round(bmr)

    def get_health_metrics(self):
        bmi, bmi_category = self.calculate_bmi()
        bmr = self.calculate_bmr()
        
        missing_fields = []
        if not self.weight_kg: missing_fields.append("weight")
        if not self.height_cm: missing_fields.append("height")
        if not self.age: missing_fields.append("age")
        if not self.gender: missing_fields.append("gender")
        
        if missing_fields:
            message = f"Please complete your profile: {', '.join(missing_fields)}"
            return {
                'bmi': {'value': 'N/A', 'category': 'Profile incomplete', 'status': 'incomplete', 'message': message},
                'bmr': {'value': 'N/A', 'status': 'incomplete', 'message': message}
            }
        
        if bmi is None or bmr is None:
            return {
                'bmi': {'value': 'N/A', 'category': 'Invalid values', 'status': 'error', 'message': 'Please enter valid positive values for weight, height, and age'},
                'bmr': {'value': 'N/A', 'status': 'error', 'message': 'Please enter valid positive values for weight, height, and age'}
            }
        
        return {
            'bmi': {'value': bmi, 'category': bmi_category, 'status': 'calculated'},
            'bmr': {'value': bmr, 'status': 'calculated'}
        }


class OTP(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=10)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"OTP for {self.user.email}"
