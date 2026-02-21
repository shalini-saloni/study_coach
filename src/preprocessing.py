import pandas as pd
import os
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

def load_and_merge(mat_path, por_path):
    mat = pd.read_csv(mat_path, sep=";")
    por = pd.read_csv(por_path, sep=";")

    mat["subject"] = "math"
    por["subject"] = "portuguese"

    df = pd.concat([mat, por], ignore_index=True)

    return df

def create_risk_label(df):
    def risk_level(score):
        if score < 10:
            return "At-risk"
        elif score < 15:
            return "Average"
        else:
            return "High-performing"

    df["risk_level"] = df["G3"].apply(risk_level)
    return df

def clean_and_encode(df, target="G3", task="regression"):
    df = df.dropna()
    df = df.drop_duplicates()

    if task == "classification":
        df = df.drop(columns=["G1", "G2", "G3"])

    elif task == "regression":
        if "G1" in df.columns:
            df = df.drop(columns=["G1", "G2"])

    y = df[target]
    X = df.drop(columns=[target])

    X = pd.get_dummies(X, drop_first=True)

    return X, y, df

def scale_features(X_train, X_test):
    scaler = StandardScaler()

    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    return X_train_scaled, X_test_scaled, scaler

def preprocess_pipeline(mat_path, por_path, target="G3", task="regression", test_size=0.2):
    df = load_and_merge(mat_path, por_path)

    if task == "classification":
        df = create_risk_label(df)
        target = "risk_level"

    X, y, cleaned_df = clean_and_encode(df, target=target, task=task)

    if task == "classification":
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=test_size,
            random_state=42,
            stratify=y
        )
    else:
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=test_size,
            random_state=42
        )

    X_train_scaled, X_test_scaled, scaler = scale_features(X_train, X_test)

    os.makedirs("data/processed", exist_ok=True)
    cleaned_df.to_csv("data/processed/cleaned_dataset.csv", index=False)

    print("Dataset shape after preprocessing:", cleaned_df.shape)
    print("Target distribution:\n", y.value_counts())

    feature_names = X.columns

    return X_train_scaled, X_test_scaled, y_train, y_test, scaler, feature_names