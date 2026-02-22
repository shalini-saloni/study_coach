def generate_recommendations(student_row, predicted_risk):

    recommendations = []

    if predicted_risk == "At-risk":
        recommendations.append("You are currently at risk. Follow a strict weekly study plan.")
        recommendations.append("Revise daily and solve previous year question papers.")
        recommendations.append("Seek help from teachers or classmates for difficult topics.")

    elif predicted_risk == "Average":
        recommendations.append("You are performing at an average level.")
        recommendations.append("Identify weak subjects and focus more on them.")
        recommendations.append("Increase mock test practice to improve your score.")

    elif predicted_risk == "High-performing":
        recommendations.append("You are performing well. Maintain consistency.")
        recommendations.append("Attempt advanced-level problems to further improve.")
        recommendations.append("Help peers in studies to strengthen your concepts.")


    if "studytime" in student_row:
        if student_row["studytime"] <= 1:
            recommendations.append("Increase your daily study time to at least 2-3 hours.")
        elif student_row["studytime"] == 2:
            recommendations.append("Try to increase study time slightly before exams.")


    if "absences" in student_row:
        if student_row["absences"] > 10:
            recommendations.append("Your absences are high. Improve attendance immediately.")
        elif student_row["absences"] > 5:
            recommendations.append("Avoid missing important classes.")

    if "failures" in student_row:
        if student_row["failures"] > 0:
            recommendations.append("You have previous failures. Revise weak subjects carefully.")

 
    if "internet_yes" in student_row:
        if student_row["internet_yes"] == 0:
            recommendations.append("Use library resources or offline materials for practice.")

  
    if len(recommendations) == 0:
        recommendations.append("Maintain regular study habits and track your academic progress.")

    return recommendations


