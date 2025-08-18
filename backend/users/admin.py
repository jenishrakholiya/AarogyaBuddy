# users/admin.py

from django.contrib import admin
from .models import CustomUser, UserProfile, OTP

admin.site.register(CustomUser)
admin.site.register(UserProfile)
admin.site.register(OTP)