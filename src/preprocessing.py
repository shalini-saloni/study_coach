import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

def load_data(path):
    df = pd.read_csv(path, sep=";")
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
    df = df.drop_duplicates()

    if target == "G3":
        if "G1" in df.columns:
            df = df.drop(columns=["G1", "G2"])

    y = df[target]
    X = df.drop(columns=[target])

    X = pd.get_dummies(X, drop_first=True)

    return X, y

def scale_features(X_train, X_test):
    scaler = StandardScaler()

    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    return X_train_scaled, X_test_scaled, scaler