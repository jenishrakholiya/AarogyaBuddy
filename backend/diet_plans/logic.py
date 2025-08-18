def calculate_bmi(weight_kg, height_m):
    if weight_kg <= 0 or height_m <= 0:
        raise ValueError("Invalid weight or height")
    
    bmi = weight_kg / (height_m ** 2)
    bmi = round(bmi, 2) 
    
    if bmi < 18.5:
        category = "Underweight"
    elif 18.5 <= bmi < 24.9:
        category = "Normal weight"
    elif 25 <= bmi < 29.9:
        category = "Overweight"
    else:
        category = "Obese"
    
    return bmi, category


def calculate_bmr(weight_kg, height_cm, age, gender):
    if weight_kg <= 0 or height_cm <= 0 or age <= 0:
        raise ValueError("Invalid profile data")
    
    if gender.lower() == 'male':
        bmr = 88.362 + (13.397 * weight_kg) + (4.799 * height_cm) - (5.677 * age)
    elif gender.lower() == 'female':
        bmr = 447.593 + (9.247 * weight_kg) + (3.098 * height_cm) - (4.330 * age)
    else:
        raise ValueError("Gender must be 'Male' or 'Female' for BMR calculation")  # Handle 'Other' gracefully in views
    
    return round(bmr)

def generate_recommendations(bmi_category: str, bmr: float, activity_level: str) -> tuple[str, str]:
    """Generates personalized vegetarian diet and workout plans."""
    activity_multipliers = {
        'Sedentary': 1.2, 'Lightly Active': 1.375, 'Moderately Active': 1.55,
        'Very Active': 1.725, 'Super Active': 1.9
    }
    tdee = bmr * activity_multipliers[activity_level]

    diet_plan = ""
    workout_plan = ""

    if bmi_category == "Underweight":
        calorie_target = f"{tdee + 300:.0f} to {tdee + 500:.0f} calories/day"
        diet_plan = f"""
        **Goal:** Healthy Weight Gain
        **Target:** {calorie_target}. Focus on nutrient-dense foods.
        - **Breakfast:** High-calorie smoothie (banana, oats, almond milk, peanut butter) or stuffed paratha with curd.
        - **Lunch:** Rice/quinoa with dal, paneer sabzi, and a side of avocado salad.
        - **Dinner:** Vegetable pulao with raita, lentil soup, and tofu/tempeh.
        - **Snacks:** Greek yogurt, trail mix, cheese sandwiches.
        - **Tips:** Add healthy fats (ghee, nuts). Eat 5-6 small meals a day.
        """
        workout_plan = """
        **Focus:** Build Muscle
        - **Frequency:** 3-4 days/week.
        - **Strength:** Light weights or resistance bands (squats, push-ups, rows).
        - **Cardio:** Minimal (walking or yoga).
        - **Rest:** Prioritize sleep for muscle recovery and growth.
        """
    elif bmi_category == "Normal weight":
        calorie_target = f"{tdee:.0f} calories/day"
        diet_plan = f"""
        **Goal:** Maintenance & Optimal Health
        **Target:** {calorie_target}. Maintain energy with balanced meals.
        - **Breakfast:** Upma with vegetables, fruit salad with yogurt, or whole-grain toast with avocado.
        - **Lunch:** Balanced plate: Brown rice, mixed dal, seasonal sabzi, salad, curd.
        - **Dinner:** Light khichdi with vegetables, soup, or grilled paneer with greens.
        - **Snacks:** Fruits, almonds, sprouts salad.
        - **Tips:** Include a variety of foods for all micronutrients. Stay hydrated.
        """
        workout_plan = """
        **Focus:** Overall Fitness
        - **Frequency:** 4-6 days/week.
        - **Strength:** 2-3 days of full-body routines (yoga, bodyweight exercises).
        - **Cardio:** 2-4 days of moderate intensity (brisk walking, cycling, jogging).
        - **Flexibility:** Daily stretching is recommended.
        """
    elif bmi_category == "Overweight":
        calorie_target = f"{tdee - 400:.0f} to {tdee - 200:.0f} calories/day"
        diet_plan = f"""
        **Goal:** Steady Fat Loss
        **Target:** {calorie_target}. Create a sustainable deficit with high-fiber foods.
        - **Breakfast:** Vegetable poha, oats, or a green smoothie.
        - **Lunch:** Multigrain roti, low-oil sabzi, moong dal, large salad.
        - **Dinner:** Soup-based meal, stir-fried veggies with tofu, or a small portion of dal.
        - **Snacks:** Cucumber with hummus, buttermilk, a small pear.
        - **Tips:** Emphasize portion control and avoid sugary drinks.
        """
        workout_plan = """
        **Focus:** Burn Fat & Build Muscle
        - **Frequency:** 5-6 days/week.
        - **Strength:** 3 days of resistance training to boost metabolism (squats, planks).
        - **Cardio:** 3-4 days of moderate to high intensity (cycling, running, HIIT).
        """
    else:  # Obesity
        calorie_target = f"{tdee - 600:.0f} to {tdee - 400:.0f} calories/day"
        diet_plan = f"""
        **Goal:** Progressive Weight Loss (Medical supervision recommended)
        **Target:** {calorie_target}. Focus on high-volume, low-calorie foods.
        - **Breakfast:** Oats with berries or chia seed pudding.
        - **Lunch:** Large vegetable soup or a salad with lentils (minimal grains).
        - **Dinner:** Grilled vegetables with a small serving of dal or clear soup.
        - **Snacks:** Carrot sticks, low-fat yogurt.
        - **Tips:** Prioritize protein and fiber to stay full. Track your intake.
        """
        workout_plan = """
        **Focus:** Build Endurance & Strength Safely
        - **Frequency:** Start with 3-5 days/week of low-impact exercise.
        - **Strength:** 2-3 days of seated exercises, wall pushes, or resistance bands.
        - **Cardio:** 3 days of low-intensity cardio like walking or swimming.
        """
    return diet_plan, workout_plan
