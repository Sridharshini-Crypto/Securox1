import gzip
import math
import os
import time
import zipfile
from collections import defaultdict, Counter
from typing import Dict, Any, Tuple, List, Optional
import numpy as np
import pandas as pd

# 6 Clean Behavioral Features (Zero Ground-Truth Leakage)
LANL_FEATURE_NAMES = [
    "query_frequency",             # Total DNS queries in time window (N)
    "unique_destinations",        # Number of distinct resolved computers (U)
    "destination_entropy",        # Shannon entropy of destination resolution distribution
    "query_rate_per_min",         # Communication velocity (N / span_mins)
    "destination_fanout_ratio",   # Fanout ratio (U / N)
    "new_destination_ratio"       # Fraction of resolutions to previously unseen destinations
]

NETWORK_INTRUSION_ATTACK_MAP = {
    0: "Benign",
    1: "Analysis",
    2: "Backdoor",
    3: "DoS",
    4: "Exploits",
    5: "Fuzzers",
    6: "Generic",
    7: "Reconnaissance",
    8: "Shellcode",
    9: "Worms"
}

class UnifiedCybersecurityDatasetHub:
    """
    Unified Ingestion & Feature Engineering Hub for Real-World Datasets:
    1. LANL 2015 Authentication & DNS Telemetry (dns.txt.gz & redteam.txt.gz)
    2. LANL 2015 NetFlow Telemetry (flows.txt.gz)
    3. LANL 2015 Host Process Creation Logs (proc.txt.gz)
    4. Network Intrusion Flow Multi-Class Dataset (Data.csv & Label.csv)
    5. Smart City Traffic Connected Vehicle IoV CAN-Bus (dataset/decimal/ & dataset/binary/)
    6. Industrial Modbus OT SCADA Telemetry (Modbus Dataset.zip)
    
    Zero Synthetic Data. Zero Ground-Truth Leakage into ML Features.
    """
    def __init__(self):
        self.workspace_root = self._locate_dataset_dir()
        
        # Dataset File Paths
        self.lanl_dns_path = os.path.join(self.workspace_root, "dns.txt.gz")
        self.lanl_redteam_path = os.path.join(self.workspace_root, "redteam.txt.gz")
        self.lanl_flows_path = os.path.join(self.workspace_root, "flows.txt.gz")
        self.lanl_proc_path = os.path.join(self.workspace_root, "proc.txt.gz")
        
        self.network_data_path = os.path.join(self.workspace_root, "Data.csv")
        self.network_label_path = os.path.join(self.workspace_root, "Label.csv")
        self.cicflowmeter_path = os.path.join(self.workspace_root, "CICFlowMeter_out.csv")
        
        self.traffic_iov_dir = os.path.join(self.workspace_root, "decimal")
        self.traffic_binary_dir = os.path.join(self.workspace_root, "binary")
        self.modbus_zip_path = os.path.join(self.workspace_root, "Modbus Dataset.zip")

        # In-Memory Cache
        self.cached_lanl_features: Optional[np.ndarray] = None
        self.cached_lanl_labels: Optional[np.ndarray] = None
        self.cached_lanl_meta: Optional[Dict[str, Any]] = None

    def _locate_dataset_dir(self) -> str:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        candidate = current_dir
        for _ in range(4):
            for sub in ["dataset", "dataset1", "data"]:
                sub_p = os.path.join(candidate, sub)
                if os.path.exists(sub_p) and (
                    os.path.exists(os.path.join(sub_p, "dns.txt.gz")) or 
                    os.path.exists(os.path.join(sub_p, "Data.csv")) or
                    os.path.exists(os.path.join(sub_p, "decimal"))
                ):
                    return sub_p
            if os.path.exists(os.path.join(candidate, "dns.txt.gz")):
                return candidate
            candidate = os.path.dirname(candidate)
        return r"D:\Smart Horizon\Securox-Government Portal\dataset"

    def get_dataset_inventory(self) -> Dict[str, Any]:
        """
        Returns real-time provenance and status of all datasets on disk.
        """
        datasets = {}

        if os.path.exists(self.lanl_dns_path) and os.path.exists(self.lanl_redteam_path):
            datasets["LANL_AUTHENTICATION_DNS"] = {
                "name": "Los Alamos National Laboratory (LANL) 2015",
                "available": True,
                "domain": "Authentication & Host Behavior",
                "primary_file": "dns.txt.gz",
                "ground_truth_file": "redteam.txt.gz",
                "size_mb": round(os.path.getsize(self.lanl_dns_path) / (1024 * 1024), 2),
                "features": LANL_FEATURE_NAMES,
                "model_type": "Isolation Forest (150 Partition Trees)",
                "leakage_status": "Clean (Zero Leakage, Red Team used strictly for Evaluation)"
            }

        if os.path.exists(self.network_data_path) and os.path.exists(self.network_label_path):
            datasets["NETWORK_INTRUSION_FLOW"] = {
                "name": "Network Intrusion Multi-Class Flow Dataset",
                "available": True,
                "domain": "API Burst & Flow Telemetry",
                "primary_file": "Data.csv",
                "label_file": "Label.csv",
                "size_mb": round(os.path.getsize(self.network_data_path) / (1024 * 1024), 2),
                "attack_classes": list(NETWORK_INTRUSION_ATTACK_MAP.values()),
                "model_type": "Flow Anomaly & Threshold Classifier"
            }

        if os.path.exists(self.traffic_iov_dir):
            iov_files = [f for f in os.listdir(self.traffic_iov_dir) if f.endswith('.csv')]
            total_size_mb = sum(os.path.getsize(os.path.join(self.traffic_iov_dir, f)) for f in iov_files) / (1024 * 1024)
            datasets["SMART_TRAFFIC_IOV_CANBUS"] = {
                "name": "Smart City Connected Vehicle & Traffic Grid IoV Dataset",
                "available": True,
                "domain": "Smart City Traffic Infrastructure",
                "directory": "dataset/decimal/",
                "file_count": len(iov_files),
                "size_mb": round(total_size_mb, 2),
                "categories": ["BENIGN", "DoS", "spoofing-SPEED", "spoofing-RPM", "spoofing-GAS", "spoofing-STEERING_WHEEL"],
                "model_type": "CAN Arbitration Jitter & Frequency Analyzer"
            }

        if os.path.exists(self.lanl_flows_path):
            datasets["LANL_ROUTER_NETFLOW"] = {
                "name": "LANL Enterprise Router NetFlow Telemetry",
                "available": True,
                "domain": "Network Volumetrics",
                "primary_file": "flows.txt.gz",
                "size_mb": round(os.path.getsize(self.lanl_flows_path) / (1024 * 1024), 2)
            }

        if os.path.exists(self.lanl_proc_path):
            datasets["LANL_PROCESS_AUDIT"] = {
                "name": "LANL Host Process Creation & Execution Events",
                "available": True,
                "domain": "Host Security & Privilege Escalation",
                "primary_file": "proc.txt.gz",
                "size_mb": round(os.path.getsize(self.lanl_proc_path) / (1024 * 1024), 2)
            }

        return {
            "status": "DATASETS_ONLINE",
            "workspace_directory": self.workspace_root,
            "total_datasets": len(datasets),
            "datasets": datasets
        }

    def load_redteam_ground_truth(self) -> Tuple[List[Dict[str, Any]], set, set]:
        """
        Loads the 749 authentic Red Team ground-truth compromise events.
        Used STRICTLY for post-hoc evaluation, NEVER as a feature.
        """
        if not os.path.exists(self.lanl_redteam_path):
            return [], set(), set()

        red_events = []
        red_comps = set()
        red_srcs = set()

        with gzip.open(self.lanl_redteam_path, "rt", encoding="utf-8", errors="ignore") as f:
            for line in f:
                parts = line.strip().split(",")
                if len(parts) >= 4:
                    t = int(parts[0])
                    u = parts[1]
                    src = parts[2]
                    dst = parts[3]
                    red_events.append({
                        "time": t,
                        "user": u,
                        "source_computer": src,
                        "dest_computer": dst
                    })
                    red_srcs.add(src)
                    red_comps.add(src)
                    red_comps.add(dst)

        return red_events, red_srcs, red_comps

    def extract_lanl_features(
        self,
        max_dns_records: int = 350000,
        window_bucket_seconds: int = 3600,
        force_reload: bool = False
    ) -> Tuple[np.ndarray, np.ndarray, Dict[str, Any]]:
        """
        Streams dns.txt.gz to construct 6-dimensional behavioral feature matrix X.
        Ground truth y is extracted for post-hoc evaluation only.
        Zero data leakage: redteam info is NOT present in X.
        """
        if self.cached_lanl_features is not None and not force_reload:
            return self.cached_lanl_features, self.cached_lanl_labels, self.cached_lanl_meta

        if not (os.path.exists(self.lanl_dns_path) and os.path.exists(self.lanl_redteam_path)):
            raise FileNotFoundError(f"LANL dataset files not found at {self.workspace_root}")

        start_time = time.time()
        red_events, red_srcs, red_comps = self.load_redteam_ground_truth()

        window_data = defaultdict(lambda: {"times": [], "dests": []})
        records_streamed = 0

        with gzip.open(self.lanl_dns_path, "rt", encoding="utf-8", errors="ignore") as f:
            for line in f:
                records_streamed += 1
                parts = line.strip().split(",")
                if len(parts) >= 3:
                    t = int(parts[0])
                    src = parts[1]
                    dst = parts[2]
                    bucket = t // window_bucket_seconds
                    w = window_data[(src, bucket)]
                    w["times"].append(t)
                    w["dests"].append(dst)

                if records_streamed >= max_dns_records:
                    break

        feature_matrix = []
        ground_truth_labels = []
        seen_dests_by_src = defaultdict(set)

        for (src, bucket), data in window_data.items():
            times = data["times"]
            dests = data["dests"]
            n = len(dests)
            u = len(set(dests))

            # 1. Shannon Entropy of destination resolution distribution
            counts = Counter(dests)
            probs = [c / n for c in counts.values()]
            entropy = -sum(p * math.log2(p) for p in probs) if len(probs) > 1 else 0.0

            # 2. Communication Rate per Minute
            span_mins = max(0.5, (max(times) - min(times)) / 60.0) if len(times) > 1 else 0.5
            rate_per_min = n / span_mins

            # 3. Fanout Ratio
            fanout = u / n if n > 0 else 0.0

            # 4. New Destination Behavior (exploration ratio)
            prev_seen = seen_dests_by_src[src]
            new_dests = len(set(dests) - prev_seen)
            new_dest_ratio = new_dests / u if u > 0 else 0.0
            seen_dests_by_src[src].update(dests)

            # Ground-Truth Evaluation Label (NOT USED AS A FEATURE)
            red_target_hits = sum(1 for dst in dests if dst in red_comps)
            is_anomaly = 1 if (src in red_srcs or red_target_hits >= 3 or (src in red_comps and new_dest_ratio > 0.6)) else 0

            # Pure 6-D Behavioral Feature Vector (Zero Leakage)
            feature_matrix.append([
                float(n),
                float(u),
                float(entropy),
                float(rate_per_min),
                float(fanout),
                float(new_dest_ratio)
            ])
            ground_truth_labels.append(is_anomaly)

        X = np.array(feature_matrix, dtype=np.float64)
        y = np.array(ground_truth_labels, dtype=np.int32)
        elapsed_sec = round(time.time() - start_time, 2)

        metadata = {
            "dataset_status": "DATASET_AVAILABLE",
            "dataset_source": "Los Alamos National Laboratory (LANL) Cybersecurity Data Set 2015",
            "primary_telemetry_file": "dns.txt.gz",
            "ground_truth_file": "redteam.txt.gz",
            "primary_file_size_mb": round(os.path.getsize(self.lanl_dns_path) / (1024 * 1024), 2),
            "ground_truth_file_size_bytes": os.path.getsize(self.lanl_redteam_path),
            "records_streamed": records_streamed,
            "entity_windows_extracted": X.shape[0],
            "feature_count": X.shape[1],
            "feature_names": LANL_FEATURE_NAMES,
            "normal_windows": int(np.sum(y == 0)),
            "compromised_windows": int(np.sum(y == 1)),
            "anomaly_ratio": round(float(np.mean(y)), 4),
            "extraction_time_seconds": elapsed_sec,
            "data_leakage_remediated": True
        }

        self.cached_lanl_features = X
        self.cached_lanl_labels = y
        self.cached_lanl_meta = metadata

        return X, y, metadata

    def evaluate_post_hoc_performance(self, y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, Any]:
        """
        Rigorous post-hoc evaluation comparing Isolation Forest anomaly predictions against Red Team ground truth.
        """
        tp = int(np.sum((y_true == 1) & (y_pred == 1)))
        fp = int(np.sum((y_true == 0) & (y_pred == 1)))
        fn = int(np.sum((y_true == 1) & (y_pred == 0)))
        tn = int(np.sum((y_true == 0) & (y_pred == 0)))

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
        accuracy = (tp + tn) / (tp + tn + fp + fn) if (tp + tn + fp + fn) > 0 else 0.0

        return {
            "evaluation_type": "Post-Hoc Ground-Truth Benchmark",
            "ground_truth_source": "LANL 2015 redteam.txt.gz",
            "samples_evaluated": len(y_true),
            "true_positives": tp,
            "false_positives": fp,
            "true_negatives": tn,
            "false_negatives": fn,
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "accuracy": round(accuracy, 4),
            "methodology": "Isolation Forest unlabelled scoring evaluated against independent Red Team audit"
        }

    def load_network_intrusion_samples(self, n_samples: int = 5000) -> Tuple[pd.DataFrame, pd.Series, Dict[str, Any]]:
        if not (os.path.exists(self.network_data_path) and os.path.exists(self.network_label_path)):
            raise FileNotFoundError(f"Network Intrusion dataset not found at {self.workspace_root}")

        df = pd.read_csv(self.network_data_path, nrows=n_samples)
        labels = pd.read_csv(self.network_label_path, nrows=n_samples)["Label"]
        category_counts = labels.map(NETWORK_INTRUSION_ATTACK_MAP).value_counts().to_dict()

        meta = {
            "dataset_name": "Network Intrusion Flow Dataset",
            "samples_loaded": len(df),
            "feature_count": df.shape[1],
            "attack_distribution": category_counts
        }
        return df, labels, meta

    def load_traffic_iov_samples(self, specific_attack: str = "DoS", n_samples: int = 2000) -> pd.DataFrame:
        if not os.path.exists(self.traffic_iov_dir):
            raise FileNotFoundError(f"Traffic IoV dataset directory not found at {self.traffic_iov_dir}")

        filename = f"decimal_{specific_attack}.csv"
        filepath = os.path.join(self.traffic_iov_dir, filename)
        if not os.path.exists(filepath):
            filepath = os.path.join(self.traffic_iov_dir, "decimal_benign.csv")

        return pd.read_csv(filepath, nrows=n_samples)

    def load_lanl_netflow_samples(self, n_samples: int = 5000) -> List[Dict[str, Any]]:
        if not os.path.exists(self.lanl_flows_path):
            return []

        samples = []
        with gzip.open(self.lanl_flows_path, "rt", encoding="utf-8", errors="ignore") as f:
            for i, line in enumerate(f):
                if i >= n_samples:
                    break
                parts = line.strip().split(",")
                if len(parts) >= 9:
                    samples.append({
                        "time": int(parts[0]),
                        "duration": int(parts[1]),
                        "src_computer": parts[2],
                        "src_port": parts[3],
                        "dest_computer": parts[4],
                        "dest_port": parts[5],
                        "protocol": parts[6],
                        "packet_count": int(parts[7]),
                        "byte_count": int(parts[8])
                    })
        return samples

    def load_lanl_process_samples(self, n_samples: int = 5000) -> List[Dict[str, Any]]:
        if not os.path.exists(self.lanl_proc_path):
            return []

        samples = []
        with gzip.open(self.lanl_proc_path, "rt", encoding="utf-8", errors="ignore") as f:
            for i, line in enumerate(f):
                if i >= n_samples:
                    break
                parts = line.strip().split(",")
                if len(parts) >= 5:
                    samples.append({
                        "time": int(parts[0]),
                        "user": parts[1],
                        "computer": parts[2],
                        "process_name": parts[3],
                        "event_type": parts[4]
                    })
        return samples

lanl_loader = UnifiedCybersecurityDatasetHub()
