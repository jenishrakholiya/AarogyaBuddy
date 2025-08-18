# users/views.py (Updated to handle profile creation more robustly and return full data)
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import CustomUser, UserProfile, OTP
from .serializers import UserRegistrationSerializer, OTPVerificationSerializer, UserProfileSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from datetime import date
from dashboard.models import WeightLog


class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {"message": f"User '{user.username}' registered successfully. Please check your email for the OTP."},
            status=status.HTTP_201_CREATED
        )
    
    def perform_update(self, serializer):
        profile = serializer.save()  

        w = profile.weight_kg
        if w and w > 0:                       
            WeightLog.objects.update_or_create(
                user=profile.user,
                timestamp=date.today(),       
                defaults={'weight_kg': w}
            )


class OTPVerificationView(generics.GenericAPIView):
    serializer_class = OTPVerificationSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        otp_code = serializer.validated_data['otp']
        try:
            user = CustomUser.objects.get(email=email, is_active=False)
            otp_instance = OTP.objects.get(user=user, otp_code=otp_code)

            if otp_instance.expires_at < timezone.now():
                return Response({"error": "OTP has expired."}, status=status.HTTP_400_BAD_REQUEST)

            user.is_active = True
            user.save()
            otp_instance.delete()

            # Automatically create a UserProfile if it doesn't exist
            profile, created = UserProfile.objects.get_or_create(user=user)
            if created:
                print(f"[INFO] Created new UserProfile for {user.email}")
            else:
                print(f"[INFO] Existing UserProfile found for {user.email}")

            refresh = RefreshToken.for_user(user)
            return Response({
                "message": "Account activated successfully.",
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found or is already active."}, status=status.HTTP_404_NOT_FOUND)
        except OTP.DoesNotExist:
            return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Safely retrieve the profile; create if somehow missing (edge case)
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        if created:
            print(f"[INFO] Created missing UserProfile for {self.request.user.email}")
        return profile
