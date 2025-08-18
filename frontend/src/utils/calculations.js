export const calculateBmi = (weightKg, heightCm) => {
    if (!weightKg || !heightCm || heightCm <= 0 || weightKg <= 0) {
        return { value: 'N/A', category: 'Enter details' };
    }
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    let category = "Invalid";
    if (bmi < 18.5) category = "Underweight";
    else if (bmi < 25) category = "Normal weight";
    else if (bmi < 30) category = "Overweight";
    else category = "Obesity";
    return { value: bmi.toFixed(1), category };
};

export const calculateBmr = (weightKg, heightCm, age, gender) => {
    if (!weightKg || !heightCm || !age || !gender || age <= 0) {
        return 'N/A';
    }
    if (gender === 'Male') {
        return Math.round((10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5);
    } else { // Female or Other
        return Math.round((10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161);
    }
};