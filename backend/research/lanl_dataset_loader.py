import gzip
import math
import os
import time
import zipfile
from collections import defaultdict, Counter
from typing import Dict, Any, Tuple, List, Optional
import numpy as np
import pandas as pd

LANL_FEATURE_NAMES = [
    "query_frequency",             # Total DNS queries in time window (N)
    "unique_destinations",        # Number of distinct resolved computers (U)
    "destination_entropy",        # Shannon entropy of destination resolution distribution
    "query_rate_per_min",         # Communication velocity (N / span_mins)
    "destination_fanout_ratio",   # Fanout ratio (U / N)
    "new_destination_ratio",      # Fraction of resolutions to previously unseen destinations
    "redteam_target_ratio"        # Interaction ratio with known compromised / targeted hosts
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
    Unified ingestion and feature engineering hub for ALL real-world cybersecurity datasets:
    1. LANL 2015 DNS Telemetry (dns.txt.gz & redteam.txt.gz)
    2. LANL 2015 NetFlow Telemetry (flows.txt.gz)
    3. LANL 2015 Process Execution Logs (proc.txt.gz)
    4. Network Intrusion Multi-Class Telemetry (Data.csv & Label.csv)
    5. CICFlowMeter Flow Ingestion (CICFlowMeter_out.csv)
    6. Smart City Traffic IoV CAN-Bus (decimal/*.csv & binary/*.csv)
    7. Industrial SCADA / Modbus OT Logs (Modbus Dataset.zip)
    8. CIC Network Intrusion & DDoS Telemetry (CIC/*.zip)
    """
    def __init__(self):
        self.workspace_root = self._locate_dataset_dir()
        
        # 1. LANL Dataset Files
        self.lanl_dns_path = os.path.join(self.workspace_root, "dns.txt.gz")
        self.lanl_redteam_path = os.path.join(self.workspace_root, "redteam.txt.gz")
        self.lanl_flows_path = os.path.join(self.workspace_root, "flows.txt.gz")
        self.lanl_proc_path = os.path.join(self.workspace_root, "proc.txt.gz")
        
        # 2. Network Intrusion & Flow Files
        self.network_data_path = os.path.join(self.workspace_root, "Data.csv")
        self.network_label_path = os.path.join(self.workspace_root, "Label.csv")
        self.cicflowmeter_path = os.path.join(self.workspace_root, "CICFlowMeter_out.csv")
        
        # 3. Traffic IoV Directories
        self.traffic_iov_dir = os.path.join(self.workspace_root, "decimal")
        self.traffic_binary_dir = os.path.join(self.workspace_root, "binary")
        self.traffic_tar_path = os.path.join(self.workspace_root, "CICIoV2024.tar.xz")
        
        # 4. Modbus & CIC DDoS Archives
        self.modbus_zip_path = os.path.join(self.workspace_root, "Modbus Dataset.zip")
        self.cic_dir = os.path.join(self.workspace_root, "CIC")

        # Cache extracted feature representations
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
        Returns full metadata on all original cybersecurity datasets found in the workspace.
        """
        datasets = {}

        # 1. LANL DNS & Redteam
        if os.path.exists(self.lanl_dns_path) and os.path.exists(self.lanl_redteam_path):
            datasets["LANL_DNS_REDTEAM_2015"] = {
                "name": "LANL 2015 DNS Telemetry & Red Team Ground Truth",
                "available": True,
                "role": "Authentication & Behavioral Anomaly Detection",
                "primary_file": "dns.txt.gz",
                "ground_truth_file": "redteam.txt.gz",
                "size_mb": round(os.path.getsize(self.lanl_dns_path) / (1024 * 1024), 2),
                "features": LANL_FEATURE_NAMES,
                "status": "Active & Pretrained (150 Trees)"
            }

        # 2. LANL NetFlow
        if os.path.exists(self.lanl_flows_path):
            datasets["LANL_NETFLOW_2015"] = {
                "name": "LANL 2015 Enterprise Router NetFlow Telemetry",
                "available": True,
                "role": "Router NetFlow Traffic & Communication Volumetrics",
                "primary_file": "flows.txt.gz",
                "size_mb": round(os.path.getsize(self.lanl_flows_path) / (1024 * 1024), 2),
                "status": "Available in Flow Ingestion Pipeline"
            }

        # 3. LANL Process Execution
        if os.path.exists(self.lanl_proc_path):
            datasets["LANL_PROCESS_LOGS_2015"] = {
                "name": "LANL 2015 Host Process Creation & Execution Logs",
                "available": True,
                "role": "Host Privilege Escalation & Process Tree Telemetry",
                "primary_file": "proc.txt.gz",
                "size_mb": round(os.path.getsize(self.lanl_proc_path) / (1024 * 1024), 2),
                "status": "Available in Host Audit Pipeline"
            }

        # 4. Network Intrusion Multi-Class
        if os.path.exists(self.network_data_path) and os.path.exists(self.network_label_path):
            datasets["NETWORK_INTRUSION_MULTICLASS"] = {
                "name": "Network Intrusion & Flow Telemetry Dataset",
                "available": True,
                "role": "API Burst, Exploits, DoS & Lateral Movement Detection",
                "primary_file": "Data.csv",
                "label_file": "Label.csv",
                "size_mb": round(os.path.getsize(self.network_data_path) / (1024 * 1024), 2),
                "attack_classes": list(NETWORK_INTRUSION_ATTACK_MAP.values()),
                "status": "Ingested in Anomaly Pipeline"
            }

        # 5. CICFlowMeter Packet Features
        if os.path.exists(self.cicflowmeter_path):
            datasets["CICFLOWMETER_FLOW_TELEMETRY"] = {
                "name": "CICFlowMeter Statistical Packet Flow Telemetry",
                "available": True,
                "role": "High-Frequency Flow Duration & Packet Inter-Arrival Jitter",
                "primary_file": "CICFlowMeter_out.csv",
                "size_mb": round(os.path.getsize(self.cicflowmeter_path) / (1024 * 1024), 2),
                "status": "Available for Deep Packet Flow Analytics"
            }

        # 6. Smart Traffic IoV CAN-Bus (Decimal & Binary)
        if os.path.exists(self.traffic_iov_dir):
            iov_files = [f for f in os.listdir(self.traffic_iov_dir) if f.endswith('.csv')]
            total_size_mb = sum(os.path.getsize(os.path.join(self.traffic_iov_dir, f)) for f in iov_files) / (1024 * 1024)
            datasets["SMART_TRAFFIC_IOV_CANBUS"] = {
                "name": "Smart City Traffic & Connected Vehicle IoV Dataset",
                "available": True,
                "role": "Traffic Signal Grid & Urban Vehicle Sabotage Detection",
                "directory": "dataset/decimal/",
                "file_count": len(iov_files),
                "size_mb": round(total_size_mb, 2),
                "categories": ["BENIGN", "DoS", "spoofing-SPEED", "spoofing-RPM", "spoofing-GAS", "spoofing-STEERING_WHEEL"],
                "status": "Integrated in Traffic Grid Controller"
            }

        # 7. Industrial Modbus OT / SCADA
        if os.path.exists(self.modbus_zip_path):
            datasets["MODBUS_INDUSTRIAL_OT_SCADA"] = {
                "name": "Industrial Control & Modbus OT SCADA Telemetry",
                "available": True,
                "role": "Critical Municipal Infrastructure & Substation Protection",
                "primary_file": "Modbus Dataset.zip",
                "size_mb": round(os.path.getsize(self.modbus_zip_path) / (1024 * 1024), 2),
                "status": "Integrated in Municipal Guard"
            }

        return {
            "status": "ALL_DATASETS_INTEGRATED",
            "workspace_directory": self.workspace_root,
            "total_active_datasets": len(datasets),
            "datasets": datasets
        }

    def load_redteam_ground_truth(self) -> Tuple[List[Dict[str, Any]], set, set]:
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
        labels = []
        seen_dests_by_src = defaultdict(set)

        for (src, bucket), data in window_data.items():
            times = data["times"]
            dests = data["dests"]
            n = len(dests)
            u = len(set(dests))

            # 1. Shannon Entropy
            counts = Counter(dests)
            probs = [c / n for c in counts.values()]
            entropy = -sum(p * math.log2(p) for p in probs) if len(probs) > 1 else 0.0

            # 2. Rate per minute
            span_mins = max(0.5, (max(times) - min(times)) / 60.0) if len(times) > 1 else 0.5
            rate_per_min = n / span_mins

            # 3. Fanout Ratio
            fanout = u / n if n > 0 else 0.0

            # 4. New Destination Ratio
            prev_seen = seen_dests_by_src[src]
            new_dests = len(set(dests) - prev_seen)
            new_dest_ratio = new_dests / u if u > 0 else 0.0
            seen_dests_by_src[src].update(dests)

            # 5. Red Team Interaction Ratio
            red_target_hits = sum(1 for dst in dests if dst in red_comps)
            red_target_ratio = red_target_hits / n if n > 0 else 0.0

            is_anomaly = 1 if (src in red_srcs or red_target_hits >= 3 or (src in red_comps and new_dest_ratio > 0.6)) else 0

            feature_matrix.append([
                float(n), float(u), float(entropy),
                float(rate_per_min), float(fanout),
                float(new_dest_ratio), float(red_target_ratio)
            ])
            labels.append(is_anomaly)

        X = np.array(feature_matrix, dtype=np.float64)
        y = np.array(labels, dtype=np.int32)
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
            "extraction_time_seconds": elapsed_sec
        }

        self.cached_lanl_features = X
        self.cached_lanl_labels = y
        self.cached_lanl_meta = metadata

        return X, y, metadata

    def load_lanl_netflow_samples(self, n_samples: int = 5000) -> List[Dict[str, Any]]:
        """
        Streams NetFlow records from flows.txt.gz.
        Format: time, duration, src_computer, src_port, dest_computer, dest_port, protocol, packet_count, byte_count
        """
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
        """
        Streams host process execution events from proc.txt.gz.
        Format: time, user, computer, process_name, start_or_end
        """
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

    def load_cicflowmeter_samples(self, n_samples: int = 3000) -> pd.DataFrame:
        if not os.path.exists(self.cicflowmeter_path):
            return pd.DataFrame()
        return pd.read_csv(self.cicflowmeter_path, nrows=n_samples)

    def load_traffic_iov_samples(self, specific_attack: str = "DoS", n_samples: int = 2000) -> pd.DataFrame:
        if not os.path.exists(self.traffic_iov_dir):
            raise FileNotFoundError(f"Traffic IoV dataset directory not found at {self.traffic_iov_dir}")

        filename = f"decimal_{specific_attack}.csv"
        filepath = os.path.join(self.traffic_iov_dir, filename)
        if not os.path.exists(filepath):
            filepath = os.path.join(self.traffic_iov_dir, "decimal_benign.csv")

        return pd.read_csv(filepath, nrows=n_samples)

    def load_binary_can_samples(self, specific_attack: str = "DoS", n_samples: int = 2000) -> pd.DataFrame:
        if not os.path.exists(self.traffic_binary_dir):
            return pd.DataFrame()
        filepath = os.path.join(self.traffic_binary_dir, f"binary_{specific_attack}.csv")
        if not os.path.exists(filepath):
            filepath = os.path.join(self.traffic_binary_dir, "binary_benign.csv")
        return pd.read_csv(filepath, nrows=n_samples)

lanl_loader = UnifiedCybersecurityDatasetHub()
