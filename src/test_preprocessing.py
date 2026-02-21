from preprocessing import preprocess_pipeline

X_train, X_test, y_train, y_test, scaler, feature_names = preprocess_pipeline(
    "data/student-mat.csv",
    "data/student-por.csv",
    task="classification"
)

print("X_train shape:", X_train.shape)
print("X_test shape:", X_test.shape)