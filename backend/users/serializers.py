# users/serializers.py

from rest_framework import serializers
from .models import CustomUser, UserProfile
from django.core.mail import send_mail
from .models import OTP
import random
import logging

# Get an instance of a logger
logger = logging.getLogger(__name__)


class UserRegistrationSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(style={'input_type': 'password'}, write_only=True)

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'password2']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        if CustomUser.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "An account with this email already exists."})
        return attrs

    def create(self, validated_data):
        print("DEBUG: Starting user creation...")
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        user.is_active = False
        user.save()
        print(f"DEBUG: User {user.email} created but is inactive.")

        otp_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        OTP.objects.create(user=user, otp_code=otp_code)
        print(f"DEBUG: OTP {otp_code} generated for {user.email}.")

        try:
            print("DEBUG: Attempting to send OTP email...")
            send_mail(
                'Your OTP for Aarogya Buddy',
                f'Welcome to Aarogya Buddy! Your verification code is: {otp_code}',
                None,  # Django will use DEFAULT_FROM_EMAIL from settings.py
                [user.email],
                fail_silently=False,
            )
            print("DEBUG: Email sent successfully.")
        except Exception as e:
            print(f"!!!-CRITICAL EMAIL ERROR-!!!: {e}")
            # This is a critical failure. We should not create the user if email fails.
            # So we delete the user we just created.
            user.delete() 
            # Re-raise the exception to make sure the serializer fails.
            raise serializers.ValidationError({"email": f"Failed to send verification email. Error: {e}"})

        return user

class OTPVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)

    def validate_otp(self, value):
        if value:
            return value.strip()
        return value
    
class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for the UserProfile model. Handles both reading and updating.
    """
    # Make the user's email and username read-only
    email = serializers.EmailField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = UserProfile
        # Add the new read-only fields to the list
        fields = ['username', 'email', 'age', 'gender', 'weight_kg', 'height_cm']
