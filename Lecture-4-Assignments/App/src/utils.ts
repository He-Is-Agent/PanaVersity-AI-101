import { ModelData, QuantizationOption, HardwareProfile, CalculatorResult } from './types';

/**
 * Calculates the total estimated VRAM / RAM footprint in GB.
 * This includes:
 * 1. Model Weights
 * 2. KV Cache memory based on context window length
 * 3. General run engine & OS overhead
 */
export function calculateMemoryFootprint(
  model: ModelData,
  quant: QuantizationOption,
  contextWindow: number // in tokens
): {
  weightsSize: number;
  kvCacheSize: number;
  totalRequired: number;
  overhead: number;
} {
  // Formula: parameters * bits-per-weight / 8 bits per byte
  // Plus slight file format / metadata overhead (e.g. GGUF block headers add ~3-5%)
  const formatOverheadFactor = 1.05;
  const weightsSizeInGB = (model.params * quant.bpw * formatOverheadFactor) / 8;

  // KV Cache memory heuristic
  // For standard models with GQA (Grouped-Query Attention), cache footprint is light.
  // DeepSeek-V3/R1 use Multi-Head Latent Attention (MLA), which further compresses KV Cache.
  // A robust general formula: Context length * parameters * scale
  // Sparse MoE models (Mixtral, DeepSeek) only use a sub-fraction of parameters active, but the KV cache
  // corresponds to active context representations of the dense layer dimensions.
  const kvCacheFactor = model.developer === 'DeepSeek' && model.type === 'moe' 
    ? 0.0000001 // Special MLA compression factor
    : 0.00000018; // GQA standard compression

  // KV Cache is also dependent on context-width
  const kvCacheSizeInGB = contextWindow * model.params * kvCacheFactor;

  // Ollama/llama.cpp inference engine / loaded backend overhead
  const engineOverheadInGB = 1.2;

  const totalRequired = weightsSizeInGB + kvCacheSizeInGB + engineOverheadInGB;

  return {
    weightsSize: Number(weightsSizeInGB.toFixed(2)),
    kvCacheSize: Number(kvCacheSizeInGB.toFixed(2)),
    overhead: engineOverheadInGB,
    totalRequired: Number(totalRequired.toFixed(2)),
  };
}

/**
 * Evaluates model compatibility against a specific hardware profile
 * and calculates the predicted tokens per second (Inference Speed).
 */
export function evaluateHardwareMatch(
  model: ModelData,
  quant: QuantizationOption,
  contextWindow: number,
  hardware: HardwareProfile,
  customVram?: number // Optional custom override
): CalculatorResult {
  const memoryInfo = calculateMemoryFootprint(model, quant, contextWindow);
  const totalRequired = memoryInfo.totalRequired;
  
  // Resolve VRAM / RAM limits
  const actualHardwareVram = customVram ?? hardware.vram;
  
  let isCompatible: 'yes' | 'partial' | 'no' = 'yes';
  let explanation = '';
  let bottleneck = '';
  const recommendations: string[] = [];

  // Speed math initialization
  let estimatedSpeed = 0;

  if (hardware.category === 'mac') {
    // Macs can allocate ~75-80% of Unified Memory to the GPU, but the CPU can use the rest.
    // If the whole footprint fits in total system Unified Memory, it runs entirely on "Unified VRAM".
    const maxSystemMemory = customVram ?? (hardware.vram / 0.8); // Total RAM of the Mac
    
    if (totalRequired <= actualHardwareVram) {
      isCompatible = 'yes';
      explanation = `Beautiful match! The entire model fits cleanly within Mac's configured Unified Memory allocation window (${actualHardwareVram}GB).`;
      bottleneck = 'Unified Memory Bandwidth';
      
      // Mac Unified speed calculation
      estimatedSpeed = (hardware.memoryBandwidth / memoryInfo.weightsSize) * hardware.tpsScaling;
    } else if (totalRequired <= maxSystemMemory) {
      isCompatible = 'partial';
      explanation = `Fits with warning. Runs on Mac Unified Memory, but exceeds standard GPU-allocated threshold. macOS will dynamically page memory, causing minor performance degradation.`;
      bottleneck = 'System Memory Paging / OS Swap';
      
      const speedRaw = (hardware.memoryBandwidth / memoryInfo.weightsSize) * hardware.tpsScaling;
      estimatedSpeed = speedRaw * 0.65; // Paging penalty
    } else {
      isCompatible = 'no';
      explanation = `Insufficient memory! Model footprint (${totalRequired}GB) exceeds maximum total Unified Memory on this Mac (${maxSystemMemory.toFixed(0)}GB).`;
      bottleneck = 'Out of Memory (OOM)';
      estimatedSpeed = 0;
    }
  } else if (hardware.category === 'pc_cpu') {
    // CPU-only execution uses CPU socket RAM
    if (totalRequired <= actualHardwareVram) {
      isCompatible = 'yes';
      explanation = `Compatible on CPU. Fits cleanly within system RAM (${actualHardwareVram}GB). It will run, but execution is bound to system RAM speeds.`;
      bottleneck = 'System RAM Memory Bandwidth (CPU-bound)';
      
      estimatedSpeed = (hardware.memoryBandwidth / memoryInfo.weightsSize) * hardware.tpsScaling;
    } else {
      isCompatible = 'no';
      explanation = `Insufficient system RAM! Model requires ${totalRequired}GB but PC only has ${actualHardwareVram}GB RAM.`;
      bottleneck = 'System RAM limit exceeded';
      estimatedSpeed = 0;
    }
  } else {
    // Standard GPU (NVIDIA, etc.)
    // Standard PCs support partial CPU offload if the GPU is too small, but at severe speed penalties.
    if (totalRequired <= actualHardwareVram) {
      isCompatible = 'yes';
      explanation = `Optimal! The model fits entirely inside dedicated High-Speed VRAM (${actualHardwareVram}GB). Fast execution is guaranteed.`;
      bottleneck = 'GPU Core Compute Limit';
      
      estimatedSpeed = (hardware.memoryBandwidth / memoryInfo.weightsSize) * hardware.tpsScaling;
    } else {
      // Out of VRAM. Can we offload layers to CPU?
      // Requires totalRequired to sit within (VRAM + System RAM). Let's assume standard System RAM is 64GB
      const assumedSystemRam = 64; 
      if (totalRequired <= (actualHardwareVram + assumedSystemRam)) {
        isCompatible = 'partial';
        
        // Calculate offload ratio (how much of the model weights overflows VRAM)
        const vramForWeights = Math.max(0, actualHardwareVram - memoryInfo.kvCacheSize - memoryInfo.overhead);
        const weightsInVramRatio = Math.min(1, vramForWeights / memoryInfo.weightsSize);
        const weightsInCpuRatio = 1 - weightsInVramRatio;
        
        explanation = `Partial CPU Offload. Model weights size (${memoryInfo.weightsSize}GB) exceeds dedicated VRAM (${actualHardwareVram}GB). Llama.cpp will offload ${(weightsInCpuRatio * 100).toFixed(0)}% of layers to your system RAM (CPU), lowering token outputs significantly.`;
        bottleneck = 'PCIe Bus Overhead / CPU RAM Bandwidth';
        
        // PCIe communication and DRAM bandwidth bottleneck calculation
        const cpuBandwidth = 80; // Assuming typical PC DDR5 dual-channel speed (80 GB/s)
        const weightedBandwidth = 1 / ((weightsInVramRatio / hardware.memoryBandwidth) + (weightsInCpuRatio / cpuBandwidth));
        
        estimatedSpeed = (weightedBandwidth / memoryInfo.weightsSize) * hardware.tpsScaling * 0.45; // 45% PCIe sync overhead
      } else {
        isCompatible = 'no';
        explanation = `Insufficient combined memory! Model occupies ${totalRequired}GB, but GPU VRAM (${actualHardwareVram}GB) and normal system RAM cannot sustain execution.`;
        bottleneck = 'Out of Memory';
        estimatedSpeed = 0;
      }
    }
  }

  // Cap estimated speeds to realistic compute values (even for ultra lightweight models)
  if (estimatedSpeed > 150) {
    estimatedSpeed = 150 - (memoryInfo.weightsSize * 0.8);
  }
  estimatedSpeed = Math.max(0, Number(estimatedSpeed.toFixed(1)));

  // Generate tactical advice
  if (isCompatible === 'yes') {
    recommendations.push("Perfect setup! No changes needed. You can increase context window sizes or try larger quantizations to improve output depth.");
  }
  if (isCompatible === 'partial') {
    recommendations.push("To speed up generation, buy a larger-VRAM GPU or select a tighter quantization format like Q4_K_M or Q3_K_M.");
    if (hardware.category === 'gpu') {
      recommendations.push("Minimize OS background memory or close active games to ensure the entire VRAM slice can be allocated to local llama.cpp/Ollama.");
    }
  }
  if (isCompatible === 'no') {
    recommendations.push("Highly suggest stepping down to a smaller parameter-class model (e.g., Llama 8B or Phi-4 14B instead of a huge 70B model).");
    recommendations.push("Alternatively, upgrade your hardware or deploy the model on cloud providers or host via server clustering (e.g., Exo, vLLM multi-GPU node).");
  }

  // Context-specific recommendations
  if (model.contextLength > 32000 && contextWindow > 16000) {
    recommendations.push(`Heads Up: Your large context window configuration (${contextWindow} tokens) reserves ${memoryInfo.kvCacheSize}GB of cache alone. Turn down the context if you experience out-of-memory errors.`);
  }

  return {
    modelName: model.name,
    modelParams: model.params,
    quantName: quant.name,
    bpw: quant.bpw,
    requiredVRAM: totalRequired,
    isCompatible,
    explanation,
    estimatedSpeed,
    bottleneck,
    recommendations
  };
}
