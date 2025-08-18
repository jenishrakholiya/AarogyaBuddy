from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import UserProfile

User = get_user_model()

class UserProfileModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.profile = UserProfile.objects.create(
            user=self.user,
            age=30,
            gender='Male',
            weight_kg=70.0,
            height_cm=175.0
        )

    def test_calculate_bmi_normal_weight(self):
        """Test BMI calculation for normal weight."""
        bmi, category = self.profile.calculate_bmi()
        expected_bmi = 22.9  # 70 / (1.75^2)
        self.assertEqual(bmi, expected_bmi)
        self.assertEqual(category, "Normal weight")

    def test_calculate_bmi_underweight(self):
        """Test BMI calculation for underweight."""
        self.profile.weight_kg = 50.0
        self.profile.height_cm = 175.0
        bmi, category = self.profile.calculate_bmi()
        self.assertEqual(category, "Underweight")

    def test_calculate_bmi_overweight(self):
        """Test BMI calculation for overweight."""
        self.profile.weight_kg = 80.0
        self.profile.height_cm = 175.0
        bmi, category = self.profile.calculate_bmi()
        self.assertEqual(category, "Overweight")

    def test_calculate_bmi_obesity(self):
        """Test BMI calculation for obesity."""
        self.profile.weight_kg = 100.0
        self.profile.height_cm = 175.0
        bmi, category = self.profile.calculate_bmi()
        self.assertEqual(category, "Obesity")

    def test_calculate_bmi_invalid_values(self):
        """Test BMI calculation with invalid values."""
        self.profile.weight_kg = 0
        bmi, category = self.profile.calculate_bmi()
        self.assertIsNone(bmi)
        self.assertIsNone(category)

    def test_calculate_bmr_male(self):
        """Test BMR calculation for male."""
        bmr = self.profile.calculate_bmr()
        expected_bmr = (10 * 70) + (6.25 * 175) - (5 * 30) + 5
        self.assertEqual(bmr, expected_bmr)

    def test_calculate_bmr_female(self):
        """Test BMR calculation for female."""
        self.profile.gender = 'Female'
        bmr = self.profile.calculate_bmr()
        expected_bmr = (10 * 70) + (6.25 * 175) - (5 * 30) - 161
        self.assertEqual(bmr, expected_bmr)

    def test_calculate_bmr_invalid_values(self):
        """Test BMR calculation with invalid values."""
        self.profile.age = 0
        bmr = self.profile.calculate_bmr()
        self.assertIsNone(bmr)

    def test_get_health_metrics_complete_profile(self):
        """Test health metrics with complete profile."""
        metrics = self.profile.get_health_metrics()
        self.assertEqual(metrics['bmi']['status'], 'calculated')
        self.assertEqual(metrics['bmr']['status'], 'calculated')
        self.assertIsNotNone(metrics['bmi']['value'])
        self.assertIsNotNone(metrics['bmr']['value'])

    def test_get_health_metrics_incomplete_profile(self):
        """Test health metrics with incomplete profile."""
        self.profile.weight_kg = None
        metrics = self.profile.get_health_metrics()
        self.assertEqual(metrics['bmi']['status'], 'incomplete')
        self.assertEqual(metrics['bmr']['status'], 'incomplete')
        self.assertIn('weight', metrics['bmi']['message'])

    def test_get_health_metrics_invalid_values(self):
        """Test health metrics with invalid values."""
        self.profile.weight_kg = -1
        metrics = self.profile.get_health_metrics()
        self.assertEqual(metrics['bmi']['status'], 'error')
        self.assertEqual(metrics['bmr']['status'], 'error')
