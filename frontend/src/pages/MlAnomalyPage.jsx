import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, Cpu, Play, RefreshCw, CheckCircle2, 
  AlertTriangle, Sliders, Table, BarChart3, Database, Layers, ArrowUpRight,
  FileCheck, Shield, Globe, Terminal, Sparkles, XCircle
} from 'lucide-react';
import { api } from '../context/AuthContext';
import { ExplainableAiCard } from '../components/ExplainableAiCard';

export const MlAnomalyPage = () => {
  const [modelStatus, setModelStatus] = useState(null);
  const [benchmark, setBenchmark] = useState(null);
  const [loadingBenchmark, setLoadingBenchmark] = useState(false);
  const [evalResult, setEvalResult] = useState(null);
  const [loadingEval, setLoadingEval] = useState(false);

  // Real 7-D LANL Behavioral Feature Vector Form
  const [queryFreq, setQueryFreq] = useState(6);
  const [uniqueDests, setUniqueDests] = useState(2);
  const [entropy, setEntropy] = useState(1.2);
  const [ratePerMin, setRatePerMin] = useState(5.0);
  const [fanoutRatio, setFanoutRatio] = useState(0.33);
  const [newDestRatio, setNewDestRatio] = useState(0.0);
  const [redTargetRatio, setRedTargetRatio] = useState(0.0);

  const fetchModelStatus = async () => {
    try {
      const resp = await api.get('/ml/status');
      setModelStatus(resp.data);
    } catch (err) {
      console.error("ML status error:", err);
    }
  };

  const handleRunBenchmark = async () => {
    try {
      setLoadingBenchmark(true);
      const resp = await api.get('/ml/benchmark-lanl');
      setBenchmark(resp.data);
    } catch (err) {
      console.error("Benchmark error:", err);
    } finally {
      setLoadingBenchmark(false);
    }
  };

  const handleEvaluateCustomVector = async (e) => {
    e?.preventDefault();
    try {
      setLoadingEval(true);
      const resp = await api.post('/ml/predict', {
        query_frequency: parseFloat(queryFreq),
        unique_destinations: parseFloat(uniqueDests),
        destination_entropy: parseFloat(entropy),
        query_rate_per_min: parseFloat(ratePerMin),
        destination_fanout_ratio: parseFloat(fanoutRatio),
        new_destination_ratio: parseFloat(newDestRatio),
        redteam_target_ratio: parseFloat(redTargetRatio)
      });
      setEvalResult(resp.data.prediction_result);
    } catch (err) {
      console.error("Prediction error:", err);
    } finally {
      setLoadingEval(false);
    }
  };

  useEffect(() => {
    fetchModelStatus();
    handleRunBenchmark();
    handleEvaluateCustomVector();
  }, []);

  const isDatasetLoaded = modelStatus?.is_trained && modelStatus?.dataset_mode !== 'UNAVAILABLE';

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {isDatasetLoaded ? (
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                ORIGINAL LANL CYBERSECURITY DATASET ACTIVE
              </span>
            ) : (
              <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" />
                LANL DATASET NOT LOADED – ML DEMO MODE DISABLED
              </span>
            )}
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5 mt-1">
            <BrainCircuit className="w-6 h-6 text-teal-500" />
            <span>Isolation Forest Anomaly Engine (LANL Telemetry)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isDatasetLoaded ? (
              <>Trained and evaluated directly on original Los Alamos National Laboratory telemetry files (<code className="font-mono text-cyan-500">dns.txt.gz</code> &amp; <code className="font-mono text-cyan-500">redteam.txt.gz</code>). Zero synthetic data.</>
            ) : (
              <>Original LANL dataset files (<code className="font-mono text-cyan-500">dns.txt.gz</code>, <code className="font-mono text-cyan-500">redteam.txt.gz</code>) missing from workspace. Running in policy fallback mode.</>
            )}
          </p>
        </div>

        {isDatasetLoaded && (
          <button
            type="button"
            disabled={loadingBenchmark}
            onClick={handleRunBenchmark}
            className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loadingBenchmark ? 'animate-spin' : ''}`} />
            <span>Rerun Empirical Benchmark</span>
          </button>
        )}
      </div>

      {/* Real LANL Dataset Inventory Badges */}
      {modelStatus && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                Verified Original LANL Cybersecurity Datasets
              </h3>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              isDatasetLoaded 
                ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' 
                : 'text-amber-500 bg-amber-500/10 border-amber-500/20'
            }`}>
              {isDatasetLoaded ? '100% Genuine Telemetry' : 'Files Missing in Workspace'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {Object.entries(modelStatus.verified_original_files || {}).map(([fname, info]) => (
              <div 
                key={fname} 
                className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
                  info.available 
                    ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800' 
                    : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/50 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{fname}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold">
                      {info.size_mb} MB
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{info.description}</p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/60 flex items-center gap-1.5 text-[10px] font-mono font-semibold">
                  {info.available ? (
                    <span className="text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Loaded &amp; Ready</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      <span>Not Found</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {modelStatus.training_dataset_metadata && modelStatus.training_dataset_metadata.entity_windows_extracted && (
            <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/40 flex flex-wrap items-center justify-between text-xs font-mono text-teal-900 dark:text-teal-300 gap-2">
              <div>
                <strong>Active Training Sample:</strong> {modelStatus.training_dataset_metadata.entity_windows_extracted?.toLocaleString()} entity-time windows streamed from {modelStatus.training_dataset_metadata.records_streamed?.toLocaleString()} real DNS records in {modelStatus.training_dataset_metadata.extraction_time_seconds}s.
              </div>
              <div className="text-teal-700 dark:text-teal-400 font-bold">
                Red Team Compromise Ratio: {(modelStatus.training_dataset_metadata.anomaly_ratio * 100)?.toFixed(2)}%
              </div>
            </div>
          )}
        </div>
      )}

      {/* Benchmark Empirical Comparison Table */}
      {benchmark && benchmark.status === 'SUCCESS' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                Empirical Evaluation on Original LANL Dataset
              </h3>
              <p className="text-xs text-slate-400">
                Partitioned test set of {benchmark.test_dataset_size?.toLocaleString()} real windows evaluated against 749 official Red Team compromise events.
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-500 font-bold">
              ✓ Ground-Truth Validated
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-3">Model Architecture</th>
                  <th className="p-3">Accuracy</th>
                  <th className="p-3">Precision</th>
                  <th className="p-3">Recall</th>
                  <th className="p-3">F1-Score</th>
                  <th className="p-3">ROC-AUC</th>
                  <th className="p-3">False Positive Rate</th>
                  <th className="p-3">Inference Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr className="bg-teal-50/50 dark:bg-teal-950/20 font-bold">
                  <td className="p-3 text-teal-700 dark:text-teal-300 font-sans flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-500" />
                    <span>Isolation Forest (Our Real Engine)</span>
                  </td>
                  <td className="p-3 text-emerald-500">{(benchmark.metrics.accuracy * 100).toFixed(1)}%</td>
                  <td className="p-3 text-emerald-500">{(benchmark.metrics.precision * 100).toFixed(1)}%</td>
                  <td className="p-3 text-emerald-500">{(benchmark.metrics.recall * 100).toFixed(1)}%</td>
                  <td className="p-3 text-emerald-500">{(benchmark.metrics.f1_score * 100).toFixed(1)}%</td>
                  <td className="p-3 text-cyan-500">{(benchmark.metrics.roc_auc * 100).toFixed(1)}%</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{(benchmark.metrics.false_positive_rate * 100).toFixed(1)}%</td>
                  <td className="p-3 text-slate-500">{benchmark.metrics.inference_latency_per_sample_ms}ms</td>
                </tr>

                <tr className="text-slate-500">
                  <td className="p-3 font-sans">Baseline Static Rules (Threshold)</td>
                  <td className="p-3">{(benchmark.baseline_comparison.accuracy * 100).toFixed(1)}%</td>
                  <td className="p-3">{(benchmark.baseline_comparison.precision * 100).toFixed(1)}%</td>
                  <td className="p-3 text-amber-500">{(benchmark.baseline_comparison.recall * 100).toFixed(1)}%</td>
                  <td className="p-3 text-amber-500">{(benchmark.baseline_comparison.f1_score * 100).toFixed(1)}%</td>
                  <td className="p-3">{(benchmark.baseline_comparison.roc_auc * 100).toFixed(1)}%</td>
                  <td className="p-3">{(benchmark.baseline_comparison.false_positive_rate * 100).toFixed(1)}%</td>
                  <td className="p-3">{benchmark.baseline_comparison.inference_latency_per_sample_ms}ms</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            💡 <strong>Research Conclusion:</strong> {benchmark.benchmark_report?.research_conclusion}
          </div>
        </div>
      )}

      {/* Feature Vector Simulator & Real-Time Explainability Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Interactive Real LANL Feature Vector Sliders (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                Real LANL Behavioral Vector Sandbox
              </h3>
              <p className="text-xs text-slate-400">
                Modify DNS &amp; network resolution features to inspect Isolation Forest outlier detection in real time.
              </p>
            </div>
            <span className="text-xs font-mono text-teal-500 font-bold">7-D Vector</span>
          </div>

          <form onSubmit={handleEvaluateCustomVector} className="space-y-4 text-xs font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div>
                <label className="text-slate-400 block mb-1">Query Frequency (N): {queryFreq}</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={queryFreq}
                  onChange={(e) => setQueryFreq(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Unique Destinations (U): {uniqueDests}</label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={uniqueDests}
                  onChange={(e) => setUniqueDests(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Destination Shannon Entropy: {entropy}</label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={entropy}
                  onChange={(e) => setEntropy(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Query Rate / min: {ratePerMin} req/min</label>
                <input
                  type="range"
                  min="0.5"
                  max="120"
                  step="0.5"
                  value={ratePerMin}
                  onChange={(e) => setRatePerMin(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Destination Fanout Ratio (U/N): {fanoutRatio}</label>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={fanoutRatio}
                  onChange={(e) => setFanoutRatio(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">New Destination Ratio: {newDestRatio}</label>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={newDestRatio}
                  onChange={(e) => setNewDestRatio(e.target.value)}
                  className="w-full"
                />
              </div>

            </div>

            <div className="pt-2">
              <label className="text-slate-400 block mb-1">Red Team Target Interaction Ratio: {redTargetRatio}</label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={redTargetRatio}
                onChange={(e) => setRedTargetRatio(e.target.value)}
                className="w-full"
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Ratio of resolutions interacting with 301 known compromised LANL Red Team entities.
              </span>
            </div>

            <button
              type="submit"
              disabled={loadingEval}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {loadingEval ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>Compute Isolation Forest Prediction</span>
            </button>
          </form>
        </div>

        {/* Right: Real-time Explainable AI Result Card (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {evalResult ? (
            <ExplainableAiCard
              anomalyScore={evalResult.anomaly_score}
              evidence={evalResult.evidence || []}
              contributingSignals={evalResult.contributing_signals}
              mitigation={evalResult.mitigation_action}
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center text-xs text-slate-400">
              Submit feature vector to compute tree isolation score.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
