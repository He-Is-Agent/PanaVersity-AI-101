import { ModelData, QuantizationOption } from './types';

export const MODELS: ModelData[] = [
  {
    id: 'deepseek-r1',
    name: 'DeepSeek-R1',
    developer: 'DeepSeek',
    params: 671,
    type: 'moe',
    activeParams: 37,
    releaseDate: '2025-01',
    contextLength: 128000,
    huggingFaceUrl: 'https://huggingface.co/deepseek-ai/DeepSeek-R1',
    description: 'First-tier open reasoning model with performance matching GPT-4o and o1. Features specialized multi-step chain-of-thought system.',
    metrics: {
      mmlu: 90.8,
      gsm8k: 96.3,
      humanEval: 92.8,
      gpqa: 59.1,
      mathScore: 93.1
    },
    category: 'Reasoning',
    license: 'MIT',
    recommendedQuant: 'Q4_K_M (requires ~400GB total memory)'
  },
  {
    id: 'deepseek-v3',
    name: 'DeepSeek-V3',
    developer: 'DeepSeek',
    params: 671,
    type: 'moe',
    activeParams: 37,
    releaseDate: '2024-12',
    contextLength: 128000,
    huggingFaceUrl: 'https://huggingface.co/deepseek-ai/DeepSeek-V3',
    description: 'High-performance Mixture of Experts (MoE) LLM leveraging Multi-Head Latent Attention (MLA) and DeepSeekMoE architectures.',
    metrics: {
      mmlu: 88.5,
      gsm8k: 94.9,
      humanEval: 82.6,
      gpqa: 41.5,
      mathScore: 68.4
    },
    category: 'General',
    license: 'MIT',
    recommendedQuant: 'Q4_K_M (requires ~400GB total memory)'
  },
  {
    id: 'llama-3.3-70b',
    name: 'Llama 3.3 70B Instruct',
    developer: 'Meta',
    params: 70,
    type: 'dense',
    releaseDate: '2024-12',
    contextLength: 128000,
    huggingFaceUrl: 'https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct',
    description: 'Highly capable dense model replacing Llama 3.1 70B, trained on upgraded datasets showing superior safety and coding capability.',
    metrics: {
      mmlu: 88.6,
      gsm8k: 93.8,
      humanEval: 84.1,
      gpqa: 41.1,
      mathScore: 59.4
    },
    category: 'General',
    license: 'Llama 3.3 Community',
    recommendedQuant: 'Q4_K_M (requires ~43GB memory)'
  },
  {
    id: 'phi-4-14b',
    name: 'Phi-4 14B',
    developer: 'Microsoft',
    params: 14,
    type: 'dense',
    releaseDate: '2024-12',
    contextLength: 16384,
    huggingFaceUrl: 'https://huggingface.co/microsoft/phi-4',
    description: 'Next-gen compact model with strong scientific and mathematical reasoning, leveraging high-quality synthetic datasets.',
    metrics: {
      mmlu: 79.8,
      gsm8k: 92.4,
      humanEval: 82.3,
      gpqa: 39.5,
      mathScore: 64.9
    },
    category: 'Reasoning',
    license: 'MIT',
    recommendedQuant: 'Q8_0 or Q5_K_M (requires ~10-15GB memory)'
  },
  {
    id: 'qwen-2.5-72b',
    name: 'Qwen 2.5 72B Instruct',
    developer: 'Qwen',
    params: 72,
    type: 'dense',
    releaseDate: '2024-09',
    contextLength: 128000,
    huggingFaceUrl: 'https://huggingface.co/Qwen/Qwen2.5-72B-Instruct',
    description: 'One of the top-performing non-reasoning dense models in existence, boasting incredible coding and multilingual support.',
    metrics: {
      mmlu: 85.3,
      gsm8k: 92.2,
      humanEval: 86.6,
      gpqa: 41.2,
      mathScore: 63.5
    },
    category: 'General',
    license: 'Apache-2.0',
    recommendedQuant: 'Q4_K_M (requires ~44GB memory)'
  },
  {
    id: 'qwen-2.5-coder-32b',
    name: 'Qwen 2.5 Coder 32B Instruct',
    developer: 'Qwen',
    params: 32,
    type: 'dense',
    releaseDate: '2024-11',
    contextLength: 128000,
    huggingFaceUrl: 'https://huggingface.co/Qwen/Qwen2.5-Coder-32B-Instruct',
    description: 'The premier open-source model specialized in coding. Matches or beats larger generalist models on a suite of code benchmarks.',
    metrics: {
      mmlu: 81.3,
      gsm8k: 88.3,
      humanEval: 90.2,
      gpqa: 32.1,
      mathScore: 56.4
    },
    category: 'Coding',
    license: 'Apache-2.0',
    recommendedQuant: 'Q5_K_M (requires ~24GB memory)'
  },
  {
    id: 'gemma-2-27b',
    name: 'Gemma 2 27B IT',
    developer: 'Google',
    params: 27,
    type: 'dense',
    releaseDate: '2024-06',
    contextLength: 8192,
    huggingFaceUrl: 'https://huggingface.co/google/gemma-2-27b-it',
    description: 'Highly efficient model employing sliding-window attention and knowledge distillation. Strikes an incredible performance-per-watt balance.',
    metrics: {
      mmlu: 81.2,
      gsm8k: 84.8,
      humanEval: 72.0,
      gpqa: 36.8,
      mathScore: 43.1
    },
    category: 'General',
    license: 'Gemma Terms of Use',
    recommendedQuant: 'Q8_0 or Q5_K_M'
  },
  {
    id: 'llama-3.1-8b',
    name: 'Llama 3.1 8B Instruct',
    developer: 'Meta',
    params: 8,
    type: 'dense',
    releaseDate: '2024-07',
    contextLength: 128000,
    huggingFaceUrl: 'https://huggingface.co/meta-llama/Llama-3.1-8B-Instruct',
    description: 'The standard multi-utility model for local setups. Exceptional general performance and supports ultra-long contexts.',
    metrics: {
      mmlu: 68.4,
      gsm8k: 81.5,
      humanEval: 62.2,
      gpqa: 25.1,
      mathScore: 30.1
    },
    category: 'General',
    license: 'Llama 3.1 Community',
    recommendedQuant: 'Q8_0 or Q5_K_M (requires 6-10GB memory)'
  },
  {
    id: 'qwen-2.5-14b',
    name: 'Qwen 2.5 14B Instruct',
    developer: 'Qwen',
    params: 14,
    type: 'dense',
    releaseDate: '2024-09',
    contextLength: 128000,
    huggingFaceUrl: 'https://huggingface.co/Qwen/Qwen2.5-14B-Instruct',
    description: 'Excellent sweet-spot model, powerful enough for complex tool-use while operating very fast on single consumer GPUs.',
    metrics: {
      mmlu: 79.6,
      gsm8k: 89.1,
      humanEval: 75.6,
      gpqa: 32.5,
      mathScore: 50.8
    },
    category: 'General',
    license: 'Apache-2.0',
    recommendedQuant: 'Q8_0 (requires ~16GB memory)'
  },
  {
    id: 'gemma-2-9b',
    name: 'Gemma 2 9B IT',
    developer: 'Google',
    params: 9,
    type: 'dense',
    releaseDate: '2024-06',
    contextLength: 8192,
    huggingFaceUrl: 'https://huggingface.co/google/gemma-2-9b-it',
    description: 'Incredible density of capability. Regularly scores higher than models twice its size on reasoning, math, and style benchmarks.',
    metrics: {
      mmlu: 74.0,
      gsm8k: 79.4,
      humanEval: 65.3,
      gpqa: 28.5,
      mathScore: 35.8
    },
    category: 'General',
    license: 'Gemma Terms of Use',
    recommendedQuant: 'Q8_0 (requires ~11GB memory)'
  },
  {
    id: 'phi-3.5-mini',
    name: 'Phi-3.5 Mini Instruct',
    developer: 'Microsoft',
    params: 3.8,
    type: 'dense',
    releaseDate: '2024-08',
    contextLength: 128000,
    huggingFaceUrl: 'https://huggingface.co/microsoft/Phi-3.5-mini-instruct',
    description: 'Ultra-compact model that can run fast on almost any computer or smartphone. Long context context support (128k) is its superpower.',
    metrics: {
      mmlu: 66.8,
      gsm8k: 73.1,
      humanEval: 58.5,
      gpqa: 24.3,
      mathScore: 28.5
    },
    category: 'Lightweight',
    license: 'MIT',
    recommendedQuant: 'Q8_0 (requires ~5GB memory)'
  },
  {
    id: 'deepseek-r1-llama-8b',
    name: 'DeepSeek-R1-Distill-Llama-8B',
    developer: 'DeepSeek',
    params: 8,
    type: 'dense',
    releaseDate: '2025-01',
    contextLength: 128000,
    huggingFaceUrl: 'https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Llama-8B',
    description: 'Llama 3.1 8B fine-tuned with distillation data generated by the primary DeepSeek-R1 models. Packs impressive reasoning habits into 8B params.',
    metrics: {
      mmlu: 73.5,
      gsm8k: 88.9,
      humanEval: 77.4,
      gpqa: 32.6,
      mathScore: 47.5
    },
    category: 'Reasoning',
    license: 'MIT',
    recommendedQuant: 'Q8_0 or Q5_K_M (requires ~6.5-9.5GB memory)'
  },
  {
    id: 'deepseek-r1-qwen-32b',
    name: 'DeepSeek-R1-Distill-Qwen-32B',
    developer: 'DeepSeek',
    params: 32,
    type: 'dense',
    releaseDate: '2025-01',
    contextLength: 128000,
    huggingFaceUrl: 'https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
    description: 'DeepSeek distilled Qwen 2.5 32B model. Highly accurate, capable of very deep reasoning and excels on mathematical, coding, and logical tasks.',
    metrics: {
      mmlu: 82.6,
      gsm8k: 94.3,
      humanEval: 82.1,
      gpqa: 46.1,
      mathScore: 70.9
    },
    category: 'Reasoning',
    license: 'Apache-2.0',
    recommendedQuant: 'Q5_K_M or Q4_K_M (requires ~22-26GB memory)'
  },
  {
    id: 'mixtral-8x7b',
    name: 'Mixtral 8x7B Instruct v0.1',
    developer: 'Mistral',
    params: 46.7,
    type: 'moe',
    activeParams: 12.9,
    releaseDate: '2023-12',
    contextLength: 32000,
    huggingFaceUrl: 'https://huggingface.co/mistralai/Mixtral-8x7B-Instruct-v0.1',
    description: 'High-quality sparse mixture of experts model that behaves like an incredibly fast dense 13B of uncompromised depth.',
    metrics: {
      mmlu: 70.6,
      gsm8k: 74.4,
      humanEval: 40.2,
      gpqa: 19.5,
      mathScore: 24.2
    },
    category: 'General',
    license: 'Apache-2.0',
    recommendedQuant: 'Q4_K_M (requires ~30GB memory)'
  },
  {
    id: 'llama-3.2-3b',
    name: 'Llama 3.2 3B Instruct',
    developer: 'Meta',
    params: 3.2,
    type: 'dense',
    releaseDate: '2024-09',
    contextLength: 128000,
    huggingFaceUrl: 'https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct',
    description: 'Perfect micro-assistant for low-resource environments or edge devices. Fine-tuned for multilingual translation and structured agent usage.',
    metrics: {
      mmlu: 63.4,
      gsm8k: 48.2,
      humanEval: 45.4,
      gpqa: 20.3,
      mathScore: 21.0
    },
    category: 'Lightweight',
    license: 'Llama 3.2 Community',
    recommendedQuant: 'Q8_0 or FP16'
  },
  {
    id: 'command-r-plus',
    name: 'Command R+ (104B)',
    developer: 'Cohere',
    params: 104,
    type: 'dense',
    releaseDate: '2024-04',
    contextLength: 128000,
    huggingFaceUrl: 'https://huggingface.co/CohereForAI/c4ai-command-r-plus',
    description: 'Commercial-grade, open weights multilingual model optimized for high-fidelity retrieval-augmented generation (RAG) and multi-step tool execution.',
    metrics: {
      mmlu: 75.7,
      gsm8k: 76.1,
      humanEval: 68.2,
      gpqa: 24.5,
      mathScore: 27.6
    },
    category: 'General',
    license: 'CC-BY-NC-4.0',
    recommendedQuant: 'Q4_K_M (requires ~65GB memory)'
  }
];

export const QUANTIZATIONS: QuantizationOption[] = [
  {
    key: 'fp16',
    name: 'FP16 (Unquantized)',
    bpw: 16,
    sizeMultiplier: 2.0,
    qualityLoss: 'None',
    description: 'Original precision. Zero quantization loss. Excellent output quality, but massive resource footprints.'
  },
  {
    key: 'q8_0',
    name: 'Q8_0 (8-bit quantized)',
    bpw: 8.5,
    sizeMultiplier: 1.1,
    qualityLoss: 'Imperceptible',
    description: 'Near-native FP16 performance with 45% RAM reduction. Recommended baseline for setups with plenty of VRAM.'
  },
  {
    key: 'q6_k',
    name: 'Q6_K (6-bit quantized)',
    bpw: 6.6,
    sizeMultiplier: 0.88,
    qualityLoss: 'Very Low',
    description: 'Incredible balance of speed, retention, and file size. Almost indistinguishable from 8-bit.'
  },
  {
    key: 'q5_k_m',
    name: 'Q5_K_M (5-bit medium)',
    bpw: 5.5,
    sizeMultiplier: 0.75,
    qualityLoss: 'Very Low',
    description: 'Extremely popular "sweet-spot". Highly recommended budget configuration for small GPU cards.'
  },
  {
    key: 'q4_k_m',
    name: 'Q4_K_M (4-bit medium)',
    bpw: 4.8,
    sizeMultiplier: 0.65,
    qualityLoss: 'Low',
    description: 'The standard local benchmark standard. Standardized size-to-utility ratio for 95% of self-hosters.'
  },
  {
    key: 'q3_k_m',
    name: 'Q3_K_M (3-bit medium)',
    bpw: 3.7,
    sizeMultiplier: 0.52,
    qualityLoss: 'Medium',
    description: 'Serviceable performance when desperate to fit a large model. Visible degrade in complex reasoning but fast.'
  },
  {
    key: 'q2_k',
    name: 'Q2_K (2-bit quantized)',
    bpw: 2.9,
    sizeMultiplier: 0.42,
    qualityLoss: 'High',
    description: 'Extreme degradation. Only suitable for basic chats on restricted RAM environments.'
  }
];
