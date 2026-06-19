"""Model registry — loads and manages ML models in memory."""

from sklearn.ensemble import IsolationForest, RandomForestClassifier
import numpy as np


class ModelRegistry:
    def __init__(self):
        self.anomaly_detector: IsolationForest | None = None
        self.attendance_predictor: RandomForestClassifier | None = None

    def load_all(self):
        self.anomaly_detector = IsolationForest(
            contamination=0.1,
            random_state=42,
            n_estimators=100,
        )
        # Train on synthetic patterns
        synthetic_patterns = self._generate_synthetic_patterns()
        self.anomaly_detector.fit(synthetic_patterns)

        self.attendance_predictor = RandomForestClassifier(
            n_estimators=50,
            random_state=42,
            max_depth=5,
        )
        training_data, training_labels = self._generate_training_data()
        self.attendance_predictor.fit(training_data, training_labels)

    def cleanup(self):
        self.anomaly_detector = None
        self.attendance_predictor = None

    @staticmethod
    def _generate_synthetic_patterns() -> np.ndarray:
        """Generate synthetic employee behavior patterns for anomaly detection."""
        np.random.seed(42)
        n_samples = 500
        data = np.column_stack([
            np.random.normal(8.5, 0.5, n_samples),  # check-in hour
            np.random.normal(17.5, 0.5, n_samples),  # check-out hour
            np.random.normal(8.0, 1.0, n_samples),  # worked hours
            np.random.normal(0.1, 0.05, n_samples),  # late frequency
        ])
        return data

    @staticmethod
    def _generate_training_data() -> tuple[np.ndarray, np.ndarray]:
        """Generate synthetic training data for attendance prediction."""
        np.random.seed(42)
        n_samples = 800
        day_of_week = np.random.randint(0, 7, n_samples)
        historical_late_rate = np.random.uniform(0, 0.5, n_samples)
        historical_absent_rate = np.random.uniform(0, 0.2, n_samples)
        distance_to_geofence = np.random.uniform(0, 500, n_samples)
        weather_score = np.random.uniform(0, 1, n_samples)

        X = np.column_stack([
            day_of_week,
            historical_late_rate,
            historical_absent_rate,
            distance_to_geofence,
            weather_score,
        ])

        # Label: 0=present, 1=late, 2=absent
        y = np.where(
            historical_absent_rate > 0.15, 2,
            np.where(historical_late_rate > 0.3, 1, 0),
        )
        return X, y
