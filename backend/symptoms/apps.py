# symptoms/apps.py (Fixed: Updated import to trigger ModelService singleton)
from django.apps import AppConfig
import os


class SymptomsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'symptoms'

    def ready(self):
        """
        This method is called when Django starts. We will initialize our
        model service here.
        """
        # The 'RUN_MAIN' check is crucial to prevent the training code
        # from running twice in the development server's auto-reloader.
        if os.environ.get('RUN_MAIN', None) != 'true':
            # This is the main process. Let's load the model.
            from .ml_model import ModelService  # Import the singleton class
            # By importing, we trigger the __new__ method of our singleton,
            # which loads and trains the model.
            ModelService()  # Explicitly instantiate to ensure initialization
            print("SymptomsConfig is ready. Model service initialized.")
