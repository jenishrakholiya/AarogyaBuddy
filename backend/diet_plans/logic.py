def calculate_bmi(weight_kg, height_m):
    """Calculate BMI and return value with category."""
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
    """Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor equation."""
    if weight_kg <= 0 or height_cm <= 0 or age <= 0:
        raise ValueError("Invalid profile data")

    if gender.lower() == 'male':
        bmr = 88.362 + (13.397 * weight_kg) + (4.799 * height_cm) - (5.677 * age)
    elif gender.lower() == 'female':
        bmr = 447.593 + (9.247 * weight_kg) + (3.098 * height_cm) - (4.330 * age)
    else:
        raise ValueError("Gender must be 'Male' or 'Female' for BMR calculation")

    return round(bmr)


def generate_recommendations(bmi_category: str, bmr: float, activity_level: str) -> tuple[str, str]:
    """Generates personalized vegetarian diet and workout plans in Markdown format."""
    activity_multipliers = {
        'Sedentary': 1.2, 'Lightly Active': 1.375, 'Moderately Active': 1.55,
        'Very Active': 1.725, 'Super Active': 1.9
    }

    if activity_level not in activity_multipliers:
        raise ValueError("Invalid activity level")

    tdee = bmr * activity_multipliers[activity_level]

    # === UNDERWEIGHT ===
    if bmi_category == "Underweight":
        calorie_target = f"{tdee + 300:.0f}–{tdee + 500:.0f} calories/day"
        diet_plan = f"""
## 🍽 Diet Plan  
*Goal:* Healthy Weight Gain  
*Target:* {calorie_target}  

- *Breakfast:* High-calorie smoothie (banana, oats, almond milk, peanut butter)  
- *Lunch:* Rice/quinoa with dal, paneer sabzi, avocado salad  
- *Dinner:* Veg pulao with raita, lentil soup, tofu/tempeh  
- *Snacks:* Greek yogurt, trail mix, cheese sandwich  
- *Tips:* Add healthy fats (ghee, nuts). Eat 5–6 small meals daily  
"""
        workout_plan = """
## 🏋 Workout Plan  
*Focus:* Build Muscle  

- *Frequency:* 3–4 days/week  
- *Strength:* Light weights/resistance bands (squats, push-ups, rows)  
- *Cardio:* Minimal (walking, yoga)  
- *Rest:* Prioritize sleep for muscle recovery  
"""

    # === NORMAL WEIGHT ===
    elif bmi_category == "Normal weight":
        calorie_target = f"{tdee:.0f} calories/day"
        diet_plan = f"""
## 🍽 Diet Plan  
*Goal:* Weight Maintenance & Optimal Health  
*Target:* {calorie_target}  

- *Breakfast:* Upma with vegetables, fruit salad with yogurt, or avocado toast  
- *Lunch:* Brown rice, mixed dal, seasonal sabzi, salad, curd  
- *Dinner:* Light khichdi with vegetables, soup, or grilled paneer  
- *Snacks:* Fruits, almonds, sprouts salad  
- *Tips:* Eat a colorful variety of foods, stay hydrated  
"""
        workout_plan = """
## 🏋 Workout Plan  
*Focus:* Overall Fitness  

- *Frequency:* 4–6 days/week  
- *Strength:* 2–3 days full-body training (yoga, bodyweight exercises)  
- *Cardio:* 2–4 days brisk walking, cycling, or jogging  
- *Flexibility:* Daily stretching or yoga  
"""

    # === OVERWEIGHT ===
    elif bmi_category == "Overweight":
        calorie_target = f"{tdee - 400:.0f}–{tdee - 200:.0f} calories/day"
        diet_plan = f"""
## 🍽 Diet Plan  
*Goal:* Steady Fat Loss  
*Target:* {calorie_target}  

- *Breakfast:* Vegetable poha, oats, or green smoothie  
- *Lunch:* Multigrain roti, low-oil sabzi, moong dal, large salad  
- *Dinner:* Soup-based meal, stir-fried veggies, small portion of dal  
- *Snacks:* Cucumber with hummus, buttermilk, seasonal fruit  
- *Tips:* Focus on portion control, avoid sugary drinks  
"""
        workout_plan = """
## 🏋 Workout Plan  
*Focus:* Burn Fat + Build Muscle  

- *Frequency:* 5–6 days/week  
- *Strength:* 3 days resistance training (squats, planks, push-ups)  
- *Cardio:* 3–4 days moderate to high intensity (cycling, jogging, HIIT)  
"""

    # === OBESE ===
    else:  # Obese
        calorie_target = f"{tdee - 600:.0f}–{tdee - 400:.0f} calories/day"
        diet_plan = f"""
## 🍽 Diet Plan  
*Goal:* Progressive Weight Loss (medical guidance encouraged)  
*Target:* {calorie_target}  

- *Breakfast:* Oats with berries or chia seed pudding  
- *Lunch:* Large vegetable soup or salad with lentils (minimal grains)  
- *Dinner:* Grilled veggies with small dal portion or clear soup  
- *Snacks:* Carrot sticks, low-fat yogurt, cucumber slices  
- *Tips:* Prioritize protein & fiber for satiety. Track intake consistently  
"""
        workout_plan = """
## 🏋 Workout Plan  
*Focus:* Endurance & Safe Strength  

- *Frequency:* 3–5 days/week (start slow)  
- *Strength:* 2–3 days wall push-ups, seated bands, light weights  
- *Cardio:* 3 days of low impact (walking, swimming, cycling)  
"""

    return diet_plan.strip(), workout_plan.strip()