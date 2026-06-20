"""Model registry — loads, manages, and persists ML models."""

import os
import pickle
from sklearn.ensemble import IsolationForest, RandomForestClassifier
import numpy as np
from config import MODEL_DIR
from logging_config import logger


class ModelRegistry:
    def __init__(self):
        self.anomaly_detector: IsolationForest | None = None
        self.attendance_predictor: RandomForestClassifier | None = None
        self._model_dir = os.path.abspath(MODEL_DIR)

    def load_all(self):
        os.makedirs(self._model_dir, exist_ok=True)

        anomaly_path = os.path.join(self._model_dir, "anomaly_detector.pkl")
        predictor_path = os.path.join(self._model_dir, "attendance_predictor.pkl")

        if os.path.exists(anomaly_path):
            with open(anomaly_path, "rb") as f:
                self.anomaly_detector = pickle.load(f)
            logger.info("model_loaded", model="anomaly_detector", source="disk")
        else:
            self.anomaly_detector = IsolationForest(
                contamination=0.1, random_state=42, n_estimators=100
            )
            self.anomaly_detector.fit(self._generate_synthetic_patterns())
            self._save_model(self.anomaly_detector, anomaly_path)
            logger.info("model_trained", model="anomaly_detector", source="synthetic")

        if os.path.exists(predictor_path):
            with open(predictor_path, "rb") as f:
                self.attendance_predictor = pickle.load(f)
            logger.info("model_loaded", model="attendance_predictor", source="disk")
        else:
            self.attendance_predictor = RandomForestClassifier(
                n_estimators=50, random_state=42, max_depth=5
            )
            X, y = self._generate_training_data()
            self.attendance_predictor.fit(X, y)
            self._save_model(self.attendance_predictor, predictor_path)
            logger.info("model_trained", model="attendance_predictor", source="synthetic")

    @staticmethod
    def _save_model(model, path: str):
        with open(path, "wb") as f:
            pickle.dump(model, f)

    def cleanup(self):
        self.anomaly_detector = None
        self.attendance_predictor = None
        logger.info("models_cleaned_up")

    @staticmethod
    def _generate_synthetic_patterns() -> np.ndarray:
        np.random.seed(42)
        n_samples = 500
        return np.column_stack([
            np.random.normal(8.5, 0.5, n_samples),
            np.random.normal(17.5, 0.5, n_samples),
            np.random.normal(8.0, 1.0, n_samples),
            np.random.normal(0.1, 0.05, n_samples),
        ])

    @staticmethod
    def _generate_training_data() -> tuple[np.ndarray, np.ndarray]:
        np.random.seed(42)
        n_samples = 800
        day_of_week = np.random.randint(0, 7, n_samples)
        historical_late_rate = np.random.uniform(0, 0.5, n_samples)
        historical_absent_rate = np.random.uniform(0, 0.2, n_samples)
        distance_to_geofence = np.random.uniform(0, 500, n_samples)
        weather_score = np.random.uniform(0, 1, n_samples)

        X = np.column_stack([
            day_of_week, historical_late_rate,
            historical_absent_rate, distance_to_geofence, weather_score,
        ])
        y = np.where(
            historical_absent_rate > 0.15, 2,
            np.where(historical_late_rate > 0.3, 1, 0),
        )
        return X, y
