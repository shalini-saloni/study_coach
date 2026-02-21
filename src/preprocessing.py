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