export interface ModelMetrics {
  mmlu?: number;
  gsm8k?: number;
  humanEval?: number;
  gpqa?: number;
  mathScore?: number;
}

export type ModelDeveloper =
  | 'Meta'
  | 'Google'
  | 'Mistral'
  | 'Qwen'
  | 'Microsoft'
  | 'Cohere'
  | 'DeepSeek'
  | 'Other';

export interface ModelData {
  id: string;
  name: string;
  developer: ModelDeveloper;
  params: number; // in Billions, e.g., 8, 70, 671
  type: 'dense' | 'moe';
  activeParams?: number; // For MoE (e.g., DeepSeek R1 is 671B params, but 37B active per token)
  releaseDate: string;
  contextLength: number; // e.g., 128000
  huggingFaceUrl: string;
  description: string;
  metrics: ModelMetrics;
  category: 'General' | 'Coding' | 'Reasoning' | 'Lightweight';
  license: string;
  recommendedQuant?: string;
}

export interface QuantizationOption {
  key: string;
  name: string;
  bpw: number; // bits per weight
  sizeMultiplier: number; // multiplier of raw params size in GB (usually params * bpw / 8 + overhead)
  qualityLoss: 'None' | 'Imperceptible' | 'Very Low' | 'Low' | 'Medium' | 'High';
  description: string;
}

export interface HardwareProfile {
  id: string;
  name: string;
  category: 'gpu' | 'mac' | 'pc_cpu';
  platformType: string; // e.g. 'NVIDIA Desktop', 'Apple Silicon MacBook', 'Custom PC'
  memoryType: string; // e.g. 'GDDR6X', 'Unified Memory', 'LPDDR5X', 'DDR5 Dual-Channel'
  vram: number; // Default base memory in GB
  vramConfigurable?: number[]; // Configurable RAM options
  memoryBandwidth: number; // GB/s (critical for Token-per-second calculation)
  estimatedPriceUSD: number;
  powerConsumptionWatts: number;
  tpsScaling: number; // Scaling factor for execution speed
  description: string;
}

export interface CustomUserHardware {
  platform: 'pc_gpu' | 'mac' | 'pc_cpu' | 'multiple_gpus';
  totalVram: number; // GB
  systemRam: number; // GB
  ramBandwidth: number; // GB/s
  gpuBandwidth: number; // GB/s
  offloadRatio: number; // 0 to 100% offload to CPU if VRAM is tight
}

export interface CalculatorResult {
  modelName: string;
  modelParams: number;
  quantName: string;
  bpw: number;
  requiredVRAM: number; // in GB, including 1.5GB context and OS overhead
  isCompatible: 'yes' | 'partial' | 'no';
  explanation: string;
  estimatedSpeed: number; // tokens/second
  bottleneck: string;
  recommendations: string[];
}
