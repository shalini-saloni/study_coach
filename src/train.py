from preprocessing import preprocess_pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib
import os

def train_model():
    # 1: Preprocess Data 
    X_train, X_test, y_train, y_test, scaler, feature_names = preprocess_pipeline(
        "data/student-mat.csv",
        "data/student-por.csv",
        task="classification"
    ) 
    print("Logistic Regression")
    # 2: Initialize Model 
    lr_model = LogisticRegression(max_iter=1000,class_weight="balanced") 

    # 3: Train Model 
    lr_model.fit(X_train, y_train)  

    # 4: Make Predictions 
    y_pred_lr = lr_model.predict(X_test)

    # 5: Evaluate Model 
    lr_accuracy = accuracy_score(y_test, y_pred_lr)

    lr_report = classification_report(y_test, y_pred_lr, output_dict=True)

    print("MODEL EVALUATION") 
    print("Accuracy:", round(lr_accuracy * 100, 2), "%")
    print("\nConfusion Matrix:\n", confusion_matrix(y_test, y_pred_lr))
    print("\nClassification Report:\n", classification_report(y_test, y_pred_lr))

    print("\nRandom Forest")

    rf_model = RandomForestClassifier(
        n_estimators=300,
        class_weight="balanced",
        random_state=42
    )

    rf_model.fit(X_train, y_train)

    y_pred_rf = rf_model.predict(X_test)
    rf_accuracy = accuracy_score(y_test, y_pred_rf)
    rf_report = classification_report(y_test, y_pred_rf, output_dict=True)


    print("MODEL EVALUATION") 
    print("Accuracy:", round(rf_accuracy * 100, 2), "%")
    print("\nConfusion Matrix:\n", confusion_matrix(y_test, y_pred_rf))
    print("\nClassification Report:\n", classification_report(y_test, y_pred_rf))

    # compare model based on At-risk Recall 
    lr_recall = lr_report["At-risk"]["recall"]
    rf_recall = rf_report["At-risk"]["recall"]
    
    print("\nModel Comparison")
    print("Logistic Regression At-risk Recall:", round(lr_recall, 2))
    print("Random Forest At-risk Recall:", round(rf_recall, 2))

    # select the best model
    if lr_recall >= rf_recall:
        best_model = lr_model
        best_model_name = "Balanced Logistic Regression"
    else:
        best_model = rf_model
        best_model_name = "Balanced Random Forest"

    print(f"\nSelected Best Model: {best_model_name}")


    # 6: Save best Model and Scaler

    os.makedirs("models", exist_ok=True)
    joblib.dump(best_model, "models/final_model.pkl")
    joblib.dump(scaler, "models/scaler.pkl")

    print("\nModel saved successfully in models/final_model.pkl")
    print("Scaler saved successfully in models/scaler.pkl")

    return best_model
    
if __name__ == "__main__":
    train_model() 

