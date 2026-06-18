import React, { useState, useMemo } from 'react';
import { 
  Search, Cpu, Layers, Activity, HardDrive, ExternalLink, 
  Sparkles, Check, AlertTriangle, Zap, TrendingUp, Coins, 
  BookOpen, Terminal, ArrowRightLeft, Settings, HelpCircle, Laptop, Sliders
} from 'lucide-react';
import { MODELS, QUANTIZATIONS } from './modelsData';
import { HARDWARE_PROFILES } from './hardwareData';
import { calculateMemoryFootprint, evaluateHardwareMatch } from './utils';
import { ModelData, QuantizationOption, HardwareProfile } from './types';

export default function App() {
  // Tabs config
  const [activeTab, setActiveTab] = useState<'catalog' | 'calculator' | 'compare' | 'analyzer' | 'guides'>('catalog');

  // --- CATALOG TAB STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [devFilter, setDevFilter] = useState<string>('All');
  const [sizeFilter, setSizeFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedModelDetails, setSelectedModelDetails] = useState<string>('deepseek-r1');

  // --- CALCULATOR TAB STATE ---
  const [calcModelId, setCalcModelId] = useState<string>('llama-3.1-8b');
  const [calcQuantKey, setCalcQuantKey] = useState<string>('q4_k_m');
  const [calcHardwareId, setCalcHardwareId] = useState<string>('rtx-4070-ti-super');
  const [calcContextWindow, setCalcContextWindow] = useState<number>(8192);
  const [customVramEnabled, setCustomVramEnabled] = useState<boolean>(false);
  const [customVramValue, setCustomVramValue] = useState<number>(16);

  // --- COMPARE TAB STATE ---
  const [compModelId, setCompModelId] = useState<string>('llama-3.3-70b');
  const [compQuantKey, setCompQuantKey] = useState<string>('q4_k_m');
  const [compHardwareIdA, setCompHardwareIdA] = useState<string>('rtx-4090');
  const [compHardwareIdB, setCompHardwareIdB] = useState<string>('macbook-pro-max');

  // --- RIG ANALYZER STATE ---
  const [rigPlatform, setRigPlatform] = useState<'pc_gpu' | 'mac' | 'pc_cpu'>('pc_gpu');
  const [rigVram, setRigVram] = useState<number>(12); // GB
  const [rigRam, setRigRam] = useState<number>(32); // GB
  const [rigBandwidth, setRigBandwidth] = useState<number>(504); // GB/s (e.g. RTX 4070 level)
  const [rigCpuRamSpeed, setRigCpuRamSpeed] = useState<number>(80); // GB/s (e.g. DDR5 dual level)

  // --- CALCULATED VALUES & MEMOIZED DERIVED STATE ---

  // Model catalog filtering
  const filteredModels = useMemo(() => {
    return MODELS.filter(model => {
      const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            model.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            model.developer.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDev = devFilter === 'All' || model.developer === devFilter;
      
      const matchesCategory = categoryFilter === 'All' || model.category === categoryFilter;

      let matchesSize = true;
      if (sizeFilter === 'under10') matchesSize = model.params < 10;
      else if (sizeFilter === '10to50') matchesSize = model.params >= 10 && model.params <= 50;
      else if (sizeFilter === '50to100') matchesSize = model.params > 50 && model.params <= 100;
      else if (sizeFilter === 'above100') matchesSize = model.params > 100;

      return matchesSearch && matchesDev && matchesSize && matchesCategory;
    });
  }, [searchTerm, devFilter, sizeFilter, categoryFilter]);

  const activeModelDetails = useMemo(() => {
    return MODELS.find(m => m.id === selectedModelDetails) || MODELS[0];
  }, [selectedModelDetails]);

  // Current calculator specs
  const selectedCalcModel = useMemo(() => MODELS.find(m => m.id === calcModelId) || MODELS[0], [calcModelId]);
  const selectedCalcQuant = useMemo(() => QUANTIZATIONS.find(q => q.key === calcQuantKey) || QUANTIZATIONS[0], [calcQuantKey]);
  const selectedCalcHardware = useMemo(() => HARDWARE_PROFILES.find(h => h.id === calcHardwareId) || HARDWARE_PROFILES[0], [calcHardwareId]);

  const currentMemoryReport = useMemo(() => {
    return calculateMemoryFootprint(selectedCalcModel, selectedCalcQuant, calcContextWindow);
  }, [selectedCalcModel, selectedCalcQuant, calcContextWindow]);

  const calculatorResult = useMemo(() => {
    return evaluateHardwareMatch(
      selectedCalcModel,
      selectedCalcQuant,
      calcContextWindow,
      selectedCalcHardware,
      customVramEnabled ? customVramValue : undefined
    );
  }, [selectedCalcModel, selectedCalcQuant, calcContextWindow, selectedCalcHardware, customVramEnabled, customVramValue]);

  // Comparison Results
  const selectedCompModel = useMemo(() => MODELS.find(m => m.id === compModelId) || MODELS[0], [compModelId]);
  const selectedCompQuant = useMemo(() => QUANTIZATIONS.find(q => q.key === compQuantKey) || QUANTIZATIONS[0], [compQuantKey]);
  const compHardwareA = useMemo(() => HARDWARE_PROFILES.find(h => h.id === compHardwareIdA) || HARDWARE_PROFILES[0], [compHardwareIdA]);
  const compHardwareB = useMemo(() => HARDWARE_PROFILES.find(h => h.id === compHardwareIdB) || HARDWARE_PROFILES[0], [compHardwareIdB]);

  const compMatchA = useMemo(() => {
    return evaluateHardwareMatch(selectedCompModel, selectedCompQuant, 8192, compHardwareA);
  }, [selectedCompModel, selectedCompQuant, compHardwareA]);

  const compMatchB = useMemo(() => {
    return evaluateHardwareMatch(selectedCompModel, selectedCompQuant, 8192, compHardwareB);
  }, [selectedCompModel, selectedCompQuant, compHardwareB]);

  // Custom User Rig Analysis vs catalog
  const rigAnalysisReport = useMemo(() => {
    return MODELS.map(model => {
      // Find optimal speed for this model across quantizations based on user custom rig
      const quantReports = QUANTIZATIONS.map(quant => {
        // Build a temporary compatible hardware profile representing the custom rig
        const isMac = rigPlatform === 'mac';
        const isCpuOnly = rigPlatform === 'pc_cpu';
        
        const tempHardware: HardwareProfile = {
          id: 'custom-rig',
          name: 'Your Custom Rig',
          category: isCpuOnly ? 'pc_cpu' : (isMac ? 'mac' : 'gpu'),
          platformType: isCpuOnly ? 'CPU Workstation' : (isMac ? 'Mac unified' : 'GPU Rig'),
          memoryType: isCpuOnly ? 'DRAM' : (isMac ? 'Unified RAM' : 'VRAM'),
          vram: isCpuOnly ? rigRam : (isMac ? Math.floor(rigRam * 0.8) : rigVram),
          memoryBandwidth: isCpuOnly ? rigCpuRamSpeed : (isMac ? rigBandwidth : rigBandwidth),
          estimatedPriceUSD: 0,
          powerConsumptionWatts: 0,
          tpsScaling: isCpuOnly ? 0.65 : (isMac ? 0.88 : 0.92),
          description: ''
        };

        const evalMatch = evaluateHardwareMatch(model, quant, 8192, tempHardware);
        return {
          quantKey: quant.key,
          quantName: quant.name,
          requiredVRAM: evalMatch.requiredVRAM,
          isCompatible: evalMatch.isCompatible,
          estimatedSpeed: evalMatch.estimatedSpeed,
        };
      });

      return {
        model,
        quantReports
      };
    });
  }, [rigPlatform, rigVram, rigRam, rigBandwidth, rigCpuRamSpeed]);

  // Helper Preset handles for user custom rigs
  const applyRigPreset = (preset: 'starter' | 'mid' | 'extreme' | 'mac-m-pro' | 'mac-m-max' | 'mac-m-ultra' | 'cpu-ddr4' | 'cpu-ddr5') => {
    if (preset === 'starter') {
      setRigPlatform('pc_gpu');
      setRigVram(12);
      setRigRam(16);
      setRigBandwidth(360); // RTX 3060
    } else if (preset === 'mid') {
      setRigPlatform('pc_gpu');
      setRigVram(16);
      setRigRam(32);
      setRigBandwidth(672); // 4070 Ti Super
    } else if (preset === 'extreme') {
      setRigPlatform('pc_gpu');
      setRigVram(24);
      setRigRam(64);
      setRigBandwidth(1008); // RTX 4090
    } else if (preset === 'mac-m-pro') {
      setRigPlatform('mac');
      setRigVram(28); // 80% out of 36GB
      setRigRam(36);
      setRigBandwidth(150);
    } else if (preset === 'mac-m-max') {
      setRigPlatform('mac');
      setRigVram(102); // 80% out of 128GB
      setRigRam(128);
      setRigBandwidth(400);
    } else if (preset === 'mac-m-ultra') {
      setRigPlatform('mac');
      setRigVram(153); // 80% out of 192GB
      setRigRam(192);
      setRigBandwidth(800);
    } else if (preset === 'cpu-ddr4') {
      setRigPlatform('pc_cpu');
      setRigVram(32);
      setRigRam(32);
      setRigCpuRamSpeed(48); // DDR4 speed
    } else if (preset === 'cpu-ddr5') {
      setRigPlatform('pc_cpu');
      setRigVram(64);
      setRigRam(64);
      setRigCpuRamSpeed(80); // DDR5 dual
    }
  };

  return (
    <div className="min-h-screen text-[#1A1A1A] flex flex-col font-sans bg-[#FDFCFB]">
      
      {/* HEADER BAR */}
      <header id="app-header" className="bg-[#FDFCFB] border-b border-[#E5E2DD] pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex flex-col items-center justify-center space-y-1">
            <span className="text-[10px] font-mono tracking-[0.25em] text-[#8C8881] uppercase font-bold">
              The Self-Hosting Resource Engine • Volume I
            </span>
            <div className="editorial-sep w-24"></div>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tight text-[#1A1A1A] italic">
            The Local AI Model & Hardware Planner
          </h1>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-xs font-mono text-[#5C5852] border-t border-b border-[#E5E2DD] py-2.5 max-w-2xl mx-auto uppercase tracking-wider">
            <span>Published Bi-Annually</span>
            <span className="hidden sm:inline text-[#8C8881] font-sans">•</span>
            <span>June 2026 Edition</span>
            <span className="hidden sm:inline text-[#8C8881] font-sans">•</span>
            <span>Comprehensive Inference Matrix</span>
          </div>
        </div>
      </header>

      {/* TABS NAVIGATION */}
      <div className="border-b border-[#E5E2DD] bg-[#F9F7F2]/60 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap justify-center -mb-px">
            <button
              id="tab-btn-catalog"
              onClick={() => setActiveTab('catalog')}
              className={`px-5 py-3.5 border-b-2 text-xs font-mono uppercase tracking-widest transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                activeTab === 'catalog' 
                  ? 'border-[#1A1A1A] text-[#1A1A1A] font-bold bg-[#FDFCFB]/50' 
                  : 'border-transparent text-[#5C5852] hover:text-[#1A1A1A] hover:border-[#8C8881]'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Open Weight Catalog
            </button>
            <button
              id="tab-btn-calculator"
              onClick={() => setActiveTab('calculator')}
              className={`px-5 py-3.5 border-b-2 text-xs font-mono uppercase tracking-widest transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                activeTab === 'calculator' 
                  ? 'border-[#1A1A1A] text-[#1A1A1A] font-bold bg-[#FDFCFB]/50' 
                  : 'border-transparent text-[#5C5852] hover:text-[#1A1A1A] hover:border-[#8C8881]'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              Inference Calculator
            </button>
            <button
              id="tab-btn-compare"
              onClick={() => setActiveTab('compare')}
              className={`px-5 py-3.5 border-b-2 text-xs font-mono uppercase tracking-widest transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                activeTab === 'compare' 
                  ? 'border-[#1A1A1A] text-[#1A1A1A] font-bold bg-[#FDFCFB]/50' 
                  : 'border-transparent text-[#5C5852] hover:text-[#1A1A1A] hover:border-[#8C8881]'
              }`}
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              Hardware Matcher
            </button>
            <button
              id="tab-btn-analyzer"
              onClick={() => setActiveTab('analyzer')}
              className={`px-5 py-3.5 border-b-2 text-xs font-mono uppercase tracking-widest transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                activeTab === 'analyzer' 
                  ? 'border-[#1A1A1A] text-[#1A1A1A] font-bold bg-[#FDFCFB]/50' 
                  : 'border-transparent text-[#5C5852] hover:text-[#1A1A1A] hover:border-[#8C8881]'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              My Setup Analyzer
            </button>
            <button
              id="tab-btn-guides"
              onClick={() => setActiveTab('guides')}
              className={`px-5 py-3.5 border-b-2 text-xs font-mono uppercase tracking-widest transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                activeTab === 'guides' 
                  ? 'border-[#1A1A1A] text-[#1A1A1A] font-bold bg-[#FDFCFB]/50' 
                  : 'border-transparent text-[#5C5852] hover:text-[#1A1A1A] hover:border-[#8C8881]'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Deployment Blueprint
            </button>
          </nav>
        </div>
      </div>

      {/* CORE APPLICATION CONTAINER */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* ==================== TAB 1 STATEMENT: MODEL CATALOG ==================== */}
        {activeTab === 'catalog' && (
          <div id="catalog-view" className="space-y-6">
            
            {/* SEARCH & FILTER CONTROLS BAR */}
            <div id="catalog-filters-card" className="bg-white p-6 rounded-none border border-[#E5E2DD] space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="relative flex-grow max-w-xl">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#8C8881]" />
                  <input
                    id="search-models-input"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by model, organization, properties (e.g. Llama, Coding)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-none border border-[#E5E2DD] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] focus:border-[#1A1A1A] text-sm bg-white text-[#1A1A1A]"
                  />
                </div>
                
                <div className="text-[#5C5852] text-xs font-mono text-right shrink-0 uppercase tracking-wider">
                  Catalog size: {filteredModels.length} of {MODELS.length} Models
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Developer select filter */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="dev-filter" className="text-xs font-bold uppercase tracking-wider text-[#5C5852] font-mono">Developer Org</label>
                  <select
                    id="dev-filter"
                    value={devFilter}
                    onChange={(e) => setDevFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-none border border-[#E5E2DD] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] text-sm bg-[#F9F7F2]/50 text-[#1A1A1A] cursor-pointer"
                  >
                    <option value="All">All Companies</option>
                    <option value="Meta">Meta Llama</option>
                    <option value="Google">Google Gemma</option>
                    <option value="Mistral">Mistral AI</option>
                    <option value="Qwen">Qwen / Alibaba</option>
                    <option value="Microsoft">Microsoft Phi</option>
                    <option value="Cohere">Cohere AI</option>
                    <option value="DeepSeek">DeepSeek</option>
                  </select>
                </div>

                {/* Model Capacity Select filter */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="size-filter" className="text-xs font-bold uppercase tracking-wider text-[#5C5852] font-mono">Model Weight Size</label>
                  <select
                    id="size-filter"
                    value={sizeFilter}
                    onChange={(e) => setSizeFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-none border border-[#E5E2DD] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] text-sm bg-[#F9F7F2]/50 text-[#1A1A1A] cursor-pointer"
                  >
                    <option value="All">All Parameter Sizes</option>
                    <option value="under10">Lightweight (&lt; 10 Billion)</option>
                    <option value="10to50">Medium Scale (10B - 50B)</option>
                    <option value="50to100">Large Workhorse (50B - 100B)</option>
                    <option value="above100">Supercomputer Scales (&gt; 100B)</option>
                  </select>
                </div>

                {/* Benchmark focus select filter */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="category-filter" className="text-xs font-bold uppercase tracking-wider text-[#5C5852] font-mono">Architectural Category</label>
                  <select
                    id="category-filter"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-none border border-[#E5E2DD] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] text-sm bg-[#F9F7F2]/50 text-[#1A1A1A] cursor-pointer"
                  >
                    <option value="All">All Capabilities</option>
                    <option value="General">General LLM</option>
                    <option value="Coding">Specialist Coding</option>
                    <option value="Reasoning">Deep Chain-of-Thought Reasoning</option>
                    <option value="Lightweight">Ultra-Lightweight & Edge</option>
                  </select>
                </div>
              </div>
            </div>

            {/* TWIN-PANEL DIRECTORY */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* MODELS MINI-BROWSER LIST (LEFT COLUMN) */}
              <div className="lg:col-span-5 space-y-3 max-h-[640px] overflow-y-auto pr-2">
                {filteredModels.length === 0 ? (
                  <div className="bg-white rounded-none p-12 border border-[#E5E2DD] text-center text-[#8C8881]">
                    <AlertTriangle className="h-8 w-8 mx-auto text-[#8C8881] mb-2" />
                    No models match your search filters.
                  </div>
                ) : (
                  filteredModels.map((model) => (
                    <div
                      id={`model-card-${model.id}`}
                      key={model.id}
                      onClick={() => setSelectedModelDetails(model.id)}
                      className={`p-5 rounded-none border transition-all duration-200 cursor-pointer ${
                        selectedModelDetails === model.id
                          ? 'bg-[#F9F7F2] border-[#1A1A1A] ring-1 ring-[#1A1A1A]'
                          : 'bg-white border-[#E5E2DD] hover:border-[#8C8881] hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 border border-[#E5E2DD] bg-[#FDFCFB] text-[10px] font-mono tracking-wide text-[#1A1A1A] uppercase font-semibold">
                            {model.developer}
                          </span>
                          <span className="text-[#8C8881] font-mono text-[11px]">
                            {model.releaseDate}
                          </span>
                        </div>
                        <span className="text-[#5C5852] font-mono text-xs font-semibold">
                          {model.params}B {model.type === 'moe' ? 'MoE' : 'Params'}
                        </span>
                      </div>
                      
                      <h3 className="mt-2.5 text-base font-semibold text-[#1A1A1A] group-hover:text-[#5C5852] flex items-center justify-between font-serif">
                        {model.name}
                      </h3>
                      
                      <p className="mt-1 text-xs text-[#5C5852] line-clamp-1">
                        {model.description}
                      </p>

                      <div className="mt-3.5 flex items-center gap-4 text-[11px] text-[#8C8881] font-mono border-t border-[#E5E2DD]/60 pt-2.5">
                        {model.metrics.mmlu && (
                          <span>MMLU: <strong className="text-[#1A1A1A]">{model.metrics.mmlu}%</strong></span>
                        )}
                        {model.metrics.humanEval && (
                          <span>Coding: <strong className="text-[#1A1A1A]">{model.metrics.humanEval}%</strong></span>
                        )}
                        <span>Ctx: <strong className="text-[#1A1A1A]">{(model.contextLength / 1000).toFixed(0)}k</strong></span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* DETAILED VIEW EXPANSION (RIGHT COLUMN) */}
              <div id="model-details-panel" className="lg:col-span-7 bg-white rounded-none border border-[#E5E2DD] p-8 sticky top-24 shadow-none">
                <div className="border-b border-[#E5E2DD] pb-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-[#F9F7F2] border border-[#E5E2DD] text-[#1A1A1A] text-[10px] font-mono py-0.5 px-2.5 uppercase font-bold">
                        {activeModelDetails.category}
                      </span>
                      <span className="bg-[#F9F7F2] border border-[#E5E2DD] text-[#5C5852] text-[10px] font-mono py-0.5 px-2.5">
                        License: {activeModelDetails.license}
                      </span>
                    </div>
                    <a
                      id="huggingface-link"
                      href={activeModelDetails.huggingFaceUrl}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#5C5852] hover:text-[#1A1A1A] hover:underline font-mono uppercase tracking-wider font-semibold"
                    >
                      Hugging Face Repo
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                  <h2 className="text-3xl font-bold font-display text-[#1A1A1A] italic">
                    {activeModelDetails.name}
                  </h2>
                  <p className="mt-3 text-sm text-[#5C5852] leading-relaxed font-sans">
                    {activeModelDetails.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-[#E5E2DD]">
                  {/* SPECS AND STATS */}
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-bold text-[#8C8881] uppercase tracking-wider font-mono">
                      Weights Metadata
                    </h4>
                    <div className="space-y-2 text-sm font-mono text-[#5C5852]">
                      <div className="flex justify-between">
                        <span className="text-[#8C8881]">Total Count:</span>
                        <span className="font-semibold text-[#1A1A1A]">{activeModelDetails.params} Billion</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8C8881]">Architecture:</span>
                        <span className="font-semibold text-[#1A1A1A] capitalize">{activeModelDetails.type}</span>
                      </div>
                      {activeModelDetails.activeParams && (
                        <div className="flex justify-between">
                          <span className="text-[#8C8881]">Active Count:</span>
                          <span className="font-semibold text-[#1A1A1A]">{activeModelDetails.activeParams}B per-token</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-[#8C8881]">Context Window:</span>
                        <span className="font-semibold text-[#1A1A1A]">{activeModelDetails.contextLength.toLocaleString()} tokens</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8C8881]">Release Date:</span>
                        <span className="font-semibold text-[#1A1A1A]">{activeModelDetails.releaseDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* BENCHMARK SCORES */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-[#8C8881] uppercase tracking-wider font-mono">
                      Evaluation Benchmarks
                    </h4>
                    
                    <div className="space-y-3">
                      {/* MMLU */}
                      {activeModelDetails.metrics.mmlu && (
                        <div>
                          <div className="flex justify-between text-xs font-mono font-bold mb-1">
                            <span className="text-[#5C5852]">MMLU (General Knowledge)</span>
                            <span className="text-[#1A1A1A]">{activeModelDetails.metrics.mmlu}%</span>
                          </div>
                          <div className="w-full bg-[#F2EFE9] h-1">
                            <div className="bg-[#1A1A1A] h-full" style={{ width: `${activeModelDetails.metrics.mmlu}%` }}></div>
                          </div>
                        </div>
                      )}

                      {/* Coding */}
                      {activeModelDetails.metrics.humanEval && (
                        <div>
                          <div className="flex justify-between text-xs font-mono font-bold mb-1">
                            <span className="text-[#5C5852]">HumanEval (Python Coding)</span>
                            <span className="text-[#1A1A1A]">{activeModelDetails.metrics.humanEval}%</span>
                          </div>
                          <div className="w-full bg-[#F2EFE9] h-1">
                            <div className="bg-[#5C5852] h-full" style={{ width: `${activeModelDetails.metrics.humanEval}%` }}></div>
                          </div>
                        </div>
                      )}

                      {/* Math Score */}
                      {activeModelDetails.metrics.mathScore && (
                        <div>
                          <div className="flex justify-between text-xs font-mono font-bold mb-1">
                            <span className="text-[#5C5852]">MATH (Calculus/Algebra)</span>
                            <span className="text-[#1A1A1A]">{activeModelDetails.metrics.mathScore}%</span>
                          </div>
                          <div className="w-full bg-[#F2EFE9] h-1">
                            <div className="bg-[#8C8881] h-full" style={{ width: `${activeModelDetails.metrics.mathScore}%` }}></div>
                          </div>
                        </div>
                      )}

                      {/* Reasoning GPQA */}
                      {activeModelDetails.metrics.gpqa && (
                        <div>
                          <div className="flex justify-between text-xs font-mono font-bold mb-1">
                            <span className="text-[#5C5852]">GPQA (Graduate Benchmark)</span>
                            <span className="text-[#1A1A1A]">{activeModelDetails.metrics.gpqa}%</span>
                          </div>
                          <div className="w-full bg-[#F2EFE9] h-1">
                            <div className="bg-[#1A1A1A] h-full" style={{ width: `${activeModelDetails.gpqa || activeModelDetails.metrics.gpqa}%` }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                  <div className="bg-[#F9F7F2] border border-[#E5E2DD] p-3.5 rounded-none flex-grow">
                    <span className="text-[#8C8881] font-mono text-[10px] block font-bold uppercase">Ideal Local Quantization Recommendation</span>
                    <span className="text-[#1A1A1A] font-semibold text-sm font-mono">
                      {activeModelDetails.recommendedQuant || "Q4_K_M (Typical benchmark format)"}
                    </span>
                  </div>

                  <button
                    id={`test-model-btn-${activeModelDetails.id}`}
                    onClick={() => {
                      setCalcModelId(activeModelDetails.id);
                      setActiveTab('calculator');
                    }}
                    className="shrink-0 bg-[#1A1A1A] border border-[#1A1A1A] hover:bg-[#5C5852] text-white rounded-none py-3.5 px-6 font-mono uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer"
                  >
                    <Zap className="h-4 w-4" />
                    Load in Calculator
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ==================== TAB 2 STATEMENT: RESOURCE CALCULATOR ==================== */}
        {activeTab === 'calculator' && (
          <div id="calculator-view" className="space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                       {/* CONFIGURATION PANEL (LEFT COLUMN) */}
              <div className="lg:col-span-4 bg-white rounded-none border border-[#E5E2DD] p-6 space-y-6">
                <div className="flex items-center gap-2 border-b border-[#E5E2DD] pb-4">
                  <Sliders className="h-5 w-5 text-[#1A1A1A]" />
                  <h2 className="text-xl font-bold font-display text-[#1A1A1A]">
                    Calculator Setup
                  </h2>
                </div>

                {/* 1. Model Selector */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="calc-model-select" className="text-xs font-bold uppercase tracking-wider text-[#5C5852] font-mono">
                    1. Choose AI Model
                  </label>
                  <select
                    id="calc-model-select"
                    value={calcModelId}
                    onChange={(e) => setCalcModelId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-none border border-[#E5E2DD] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] text-sm bg-[#F9F7F2]/50 text-[#1A1A1A] cursor-pointer"
                  >
                    {MODELS.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.params}B)</option>
                    ))}
                  </select>
                </div>

                {/* 2. Quantization Selector */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="calc-quant-select" className="text-xs font-bold uppercase tracking-wider text-[#5C5852] font-mono">
                    2. Weight Format / Quantization
                  </label>
                  <select
                    id="calc-quant-select"
                    value={calcQuantKey}
                    onChange={(e) => setCalcQuantKey(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-none border border-[#E5E2DD] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] text-sm bg-[#F9F7F2]/50 text-[#1A1A1A] cursor-pointer"
                  >
                    {QUANTIZATIONS.map(q => (
                      <option key={q.key} value={q.key}>{q.name} - {q.qualityLoss} Loss</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-[#8C8881] font-mono leading-tight">
                    {selectedCalcQuant.description}
                  </p>
                </div>

                {/* 3. Context Length Slider */}
                <div className="space-y-2 border-t border-[#E5E2DD] pt-4">
                  <div className="flex justify-between items-center text-xs font-bold text-[#5C5852] font-mono uppercase tracking-wider">
                    <span>3. Max Context Size</span>
                    <span className="font-mono bg-[#1A1A1A] text-white px-2 py-0.5 text-[11px]">
                      {calcContextWindow >= 1000 ? `${(calcContextWindow / 1000).toFixed(0)}k tokens` : `${calcContextWindow} tokens`}
                    </span>
                  </div>
                  <input
                    id="context-window-slider"
                    type="range"
                    min="2048"
                    max="131072"
                    step="2048"
                    value={calcContextWindow}
                    onChange={(e) => setCalcContextWindow(Number(e.target.value))}
                    className="w-full accent-[#1A1A1A] cursor-ew-resize"
                  />
                  <div className="flex justify-between text-[10px] text-[#8C8881] font-mono">
                    <span>2k (Standard)</span>
                    <span>32k (Long)</span>
                    <span>128k (Max)</span>
                  </div>
                  <p className="text-[11px] text-[#5C5852] font-sans leading-relaxed">
                    Note: Larger contexts hold longer memory, but consume direct system VRAM for Key-Value Cache.
                  </p>
                </div>

                {/* 4. Hardware Selection Toggle */}
                <div className="space-y-4 border-t border-[#E5E2DD] pt-4">
                  <div className="flex items-center justify-between select-none">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#5C5852] font-mono">
                      4. Hardware Target
                    </label>
                    <button
                      id="custom-vram-toggle"
                      onClick={() => setCustomVramEnabled(!customVramEnabled)}
                      className={`text-[10px] font-mono px-2.5 py-1 rounded-none cursor-pointer transition-colors border uppercase tracking-wider ${
                        customVramEnabled ? 'bg-[#5C5852] text-white border-[#5C5852]' : 'bg-[#F9F7F2] text-[#1A1A1A] border-[#E5E2DD]'
                      }`}
                    >
                      {customVramEnabled ? 'Use Preset' : 'Custom VRAM'}
                    </button>
                  </div>

                  {!customVramEnabled ? (
                    <select
                      id="calc-hardware-select"
                      value={calcHardwareId}
                      onChange={(e) => setCalcHardwareId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-none border border-[#E5E2DD] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] text-sm bg-[#F9F7F2]/50 text-[#1A1A1A] cursor-pointer"
                    >
                      {HARDWARE_PROFILES.map(h => (
                        <option key={h.id} value={h.id}>{h.name} - {h.memoryType}</option>
                      ))}
                    </select>
                  ) : (
                    <div id="custom-vram-controls" className="space-y-3 p-4 bg-[#F9F7F2] border border-[#E5E2DD] rounded-none">
                      <div className="flex justify-between items-center text-xs font-bold text-[#1A1A1A] font-mono">
                        <span>Define Custom VRAM:</span>
                        <span>{customVramValue} GB VRAM</span>
                      </div>
                      <input
                        id="custom-vram-slider"
                        type="range"
                        min="4"
                        max="192"
                        step="2"
                        value={customVramValue}
                        onChange={(e) => setCustomVramValue(Number(e.target.value))}
                        className="w-full accent-[#1A1A1A] cursor-ew-resize"
                      />
                      <div className="flex justify-between text-[10px] text-[#8C8881] font-mono">
                        <span>4GB (Budget)</span>
                        <span>24GB (High)</span>
                        <span>48GB (Multi)</span>
                        <span>192GB (Mono)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* REPORT GAUGE AND ANALYSIS (RIGHT COLUMN) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* MATCHER BANNER DIAGNOSTIC */}
                <div id="calculator-status-card" className={`p-8 rounded-none border transition-all duration-300 ${
                  calculatorResult.isCompatible === 'yes' 
                    ? 'bg-[#F9F7F2] border-[#1A1A1A] text-[#1A1A1A]' 
                    : calculatorResult.isCompatible === 'partial'
                    ? 'bg-[#FDFCFB] border-[#5C5852] text-[#1A1A1A]'
                    : 'bg-[#FDFCFB] border-[#E5E2DD] text-[#5C5852]'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-none border shrink-0 ${
                      calculatorResult.isCompatible === 'yes' 
                        ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' 
                        : calculatorResult.isCompatible === 'partial'
                        ? 'bg-[#5C5852] border-[#5C5852] text-white'
                        : 'bg-white border-[#E5E2DD] text-[#8C8881]'
                    }`}>
                      {calculatorResult.isCompatible === 'yes' ? <Check className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                    </div>

                    <div className="space-y-1.5 flex-grow">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E2DD]/70 pb-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-[#8C8881]">Local Compatibility Matrix</span>
                        <span className={`px-2.5 py-0.5 border text-xs font-mono font-bold uppercase ${
                          calculatorResult.isCompatible === 'yes' ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' :
                          calculatorResult.isCompatible === 'partial' ? 'bg-[#5C5852] text-white border-[#5C5852]' : 'bg-white text-[#8C8881] border-[#E5E2DD]'
                        }`}>
                          {calculatorResult.isCompatible === 'yes' ? 'Optimal Profile' :
                           calculatorResult.isCompatible === 'partial' ? 'Paging / Memory Cache Bound' : 'Below Memory Limit'}
                        </span>
                      </div>

                      <h3 className="text-2xl font-bold font-serif italic text-[#1A1A1A]">
                        {calculatorResult.modelName} ({selectedCalcQuant.name})
                      </h3>
                      <p className="text-sm opacity-90 leading-relaxed font-sans text-[#5C5852]">
                        {calculatorResult.explanation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* MEMORY CONSTRAINTS ALLOCATION GAUGES */}
                <div id="memory-breakout-card" className="bg-white rounded-none border border-[#E5E2DD] p-8 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold font-serif text-[#1A1A1A]">
                      Memory Allocation Report
                    </h3>
                    <p className="text-xs text-[#5C5852] mt-1 font-sans">
                      Calculation mapping model weights footprint against absolute execution limits.
                    </p>
                  </div>

                  {/* STACKED BAR CHART ALLOCATION */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono mb-2">
                      <span className="text-[#8C8881] text-[10px] uppercase font-bold tracking-wider">Allocation Stack Chart</span>
                      <span className="font-semibold text-[#1A1A1A] text-sm uppercase font-mono tracking-wider">{currentMemoryReport.totalRequired} GB Required</span>
                    </div>
                    
                    {/* Visual Stacked Progress Bar */}
                    <div className="w-full h-8 bg-[#F2EFE9] rounded-none overflow-hidden flex">
                      {/* Weights block */}
                      <div 
                        title={`Model Weights Size: ${currentMemoryReport.weightsSize} GB`}
                        className="bg-[#1A1A1A] h-full flex items-center justify-center text-[10px] text-white font-mono font-bold shrink-0" 
                        style={{ width: `${(currentMemoryReport.weightsSize / currentMemoryReport.totalRequired) * 100}%` }}
                      >
                        {((currentMemoryReport.weightsSize / currentMemoryReport.totalRequired) * 100) > 15 ? `Weights (${currentMemoryReport.weightsSize}G)` : `${currentMemoryReport.weightsSize}G`}
                      </div>
                      {/* KV Cache block */}
                      <div 
                        title={`KV Cache (Memory): ${currentMemoryReport.kvCacheSize} GB`}
                        className="bg-[#8C8881] h-full flex items-center justify-center text-[10px] text-white font-mono font-bold shrink-0" 
                        style={{ width: `${(currentMemoryReport.kvCacheSize / currentMemoryReport.totalRequired) * 100}%` }}
                      >
                        {((currentMemoryReport.kvCacheSize / currentMemoryReport.totalRequired) * 100) > 15 ? `KV Cache (${currentMemoryReport.kvCacheSize}G)` : `${currentMemoryReport.kvCacheSize}G`}
                      </div>
                      {/* Overhead block */}
                      <div 
                        title={`Overhead & Orchestrator context: ${currentMemoryReport.overhead} GB`}
                        className="bg-[#E5E2DD] h-full flex items-center justify-center text-[10px] text-[#1A1A1A] font-mono font-bold shrink-0" 
                        style={{ width: `${(currentMemoryReport.overhead / currentMemoryReport.totalRequired) * 100}%` }}
                      >
                        {((currentMemoryReport.overhead / currentMemoryReport.totalRequired) * 100) > 15 ? `Overhead (${currentMemoryReport.overhead}G)` : ''}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center mt-3.5 gap-y-2 gap-x-5 text-xs font-mono text-[#5C5852]">
                      <div className="flex items-center gap-1.5">
                        <div className="h-3 w-3 bg-[#1A1A1A]"></div>
                        Model Weights: <strong>{currentMemoryReport.weightsSize} GB</strong>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-3 w-3 bg-[#8C8881]"></div>
                        KV Cache Slot Capacity: <strong>{currentMemoryReport.kvCacheSize} GB</strong>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-3 w-3 bg-[#E5E2DD]"></div>
                        Hypervisor VRAM Overhead: <strong>{currentMemoryReport.overhead} GB</strong>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#F9F7F2] p-4 rounded-none border border-[#E5E2DD] flex items-center justify-between gap-4 font-mono">
                    <div>
                      <span className="text-[10px] font-bold text-[#8C8881] uppercase tracking-wider block">Available Limit Profile</span>
                      <div className="text-[#1A1A1A] font-semibold text-sm">
                        {customVramEnabled ? "Custom Config VRAM" : selectedCalcHardware.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-[#8C8881] uppercase tracking-wider block">Total physical VRAM</span>
                      <div className="text-[#1A1A1A] font-bold text-base">
                        {customVramEnabled ? customVramValue : selectedCalcHardware.vram} GB
                      </div>
                    </div>
                  </div>
                </div>

                {/* PERFORMANCE FIGURES & EST TIME (TOKENS PER SECOND) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* SPEED DIAL SPEED CARDS */}
                  <div id="calculator-speed-card" className="bg-white rounded-none border border-[#E5E2DD] p-8 flex flex-col justify-between shadow-none">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold font-serif text-[#1A1A1A]">Estimated Waveform</h3>
                        <Zap className="h-4 w-4 text-[#1A1A1A]" />
                      </div>
                      <p className="text-xs text-[#8C8881] font-sans">Estimated streaming speed metrics.</p>
                      
                      <div className="my-6 text-center space-y-2">
                        <div className="text-5xl font-black font-mono text-[#1A1A1A] tracking-tight flex items-baseline justify-center gap-1 select-none">
                          {calculatorResult.estimatedSpeed}
                          <span className="text-sm font-semibold font-sans text-[#8C8881]">tok/s</span>
                        </div>

                        {/* Text description comparative of speed */}
                        <div className="inline-block mt-2 px-3 py-1 font-mono text-[10px] uppercase font-bold tracking-wider bg-[#F9F7F2] text-[#1A1A1A] border border-[#E5E2DD]">
                          {calculatorResult.estimatedSpeed === 0 ? "Cannot run" :
                           calculatorResult.estimatedSpeed > 60 ? "Extreme Bandwidth" :
                           calculatorResult.estimatedSpeed > 25 ? "High Bandwidth Speed" :
                           calculatorResult.estimatedSpeed > 8 ? "Reading Speed Pace" :
                           "Degraded Paging Lag"}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-[#E5E2DD] pt-4 text-xs space-y-1.5 font-mono text-[#5C5852]">
                      <div className="flex justify-between text-[11px]">
                        <span>System Bottleneck:</span>
                        <strong className="text-[#1A1A1A] uppercase">{calculatorResult.bottleneck}</strong>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span>Effective Memory Speeds:</span>
                        <strong className="text-[#1A1A1A]">{customVramEnabled ? 'Dynamically scaling' : `${selectedCalcHardware.memoryBandwidth} GB/s`}</strong>
                      </div>
                    </div>
                  </div>

                  {/* REQUIRED GENERATION TIME FORECAST */}
                  <div id="generation-time-card" className="bg-white rounded-none border border-[#E5E2DD] p-8 flex flex-col justify-between shadow-none">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold font-serif text-[#1A1A1A]">Inference Latency</h3>
                        <HardDrive className="h-4 w-4 text-[#1A1A1A]" />
                      </div>
                      <p className="text-xs text-[#8C8881] font-sans">Predicted duration for generation jobs.</p>

                      <div className="my-6 space-y-4">
                        {/* 200 token response (Short article / reply) */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-[#5C5852]">Prompt Query (~200 tokens)</span>
                            <span className="font-mono font-bold text-[#1A1A1A]">
                              {calculatorResult.estimatedSpeed > 0 ? `${(200 / calculatorResult.estimatedSpeed).toFixed(2)}s` : 'Infinite (N/A)'}
                            </span>
                          </div>
                          <div className="w-full bg-[#F2EFE9] h-1.5">
                            <div className="bg-[#1A1A1A] h-full" style={{ width: calculatorResult.estimatedSpeed > 0 ? `${Math.min(100, (200 / calculatorResult.estimatedSpeed) * 3)}%` : '0%' }}></div>
                          </div>
                        </div>

                        {/* 1000 token response (Code file / essay) */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-[#5C5852]">Complex Code (~1000 tokens)</span>
                            <span className="font-mono font-bold text-[#1A1A1A]">
                              {calculatorResult.estimatedSpeed > 0 ? `${(1000 / calculatorResult.estimatedSpeed).toFixed(2)}s` : 'Infinite (N/A)'}
                            </span>
                          </div>
                          <div className="w-full bg-[#F2EFE9] h-1.5">
                            <div className="bg-[#5C5852] h-full" style={{ width: calculatorResult.estimatedSpeed > 0 ? `${Math.min(100, (1000 / calculatorResult.estimatedSpeed) * 3)}%` : '0%' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-[#8C8881] italic leading-tight">
                      Calculated on raw output streaming. Real execution setups include initial token prefill latency.
                    </p>
                  </div>

                </div>

                {/* ADVICE CARDS */}
                <div id="calculator-advice-card" className="bg-[#1A1A1A] text-white rounded-none p-8 space-y-6 shadow-none">
                  <h4 className="text-xs font-bold text-white font-mono uppercase tracking-widest flex items-center gap-2 border-b border-white/20 pb-2">
                    <Sparkles className="h-4 w-4 text-white animate-pulse" />
                    Expert Local Deployment Advisory
                  </h4>
                  <ul className="space-y-4 text-xs leading-relaxed font-sans text-[#E5E2DD]">
                    {calculatorResult.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex gap-3 items-start border-l border-white/30 pl-3">
                        <span className="font-mono text-[10px] text-white/50 font-bold block shrink-0 mt-0.5">
                          [{idx + 1}]
                        </span>
                        <span className="text-white/90 leading-relaxed">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ==================== TAB 3: BENCHMARK HARWARE COMPARATOR ==================== */}
        {activeTab === 'compare' && (
          <div id="compare-view" className="space-y-6">
            
            <div className="bg-[#F9F7F2] p-8 rounded-none border border-[#1A1A1A] space-y-4">
              <h3 className="text-2xl font-bold text-[#1A1A1A] font-serif italic">
                Side-by-Side Inference Matcher
              </h3>
              <p className="text-xs text-[#5C5852] font-sans">
                Directly bench-test a selected model package and quant grade across two separate physical hardware layouts to evaluate optimal value.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {/* Chosen model */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="comp-model-select" className="text-[10px] font-bold text-[#1A1A1A] font-mono uppercase tracking-wider">Select Model Candidate</label>
                  <select
                    id="comp-model-select"
                    value={compModelId}
                    onChange={(e) => setCompModelId(e.target.value)}
                    className="w-full px-3 py-2 rounded-none border border-[#1A1A1A] focus:outline-none focus:ring-0 text-xs font-mono bg-white"
                  >
                    {MODELS.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.params}B Params)</option>
                    ))}
                  </select>
                </div>

                {/* Chosen quant */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="comp-quant-select" className="text-[10px] font-bold text-[#1A1A1A] font-mono uppercase tracking-wider">Select Quantization Grade</label>
                  <select
                    id="comp-quant-select"
                    value={compQuantKey}
                    onChange={(e) => setCompQuantKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-none border border-[#1A1A1A] focus:outline-none focus:ring-0 text-xs font-mono bg-white"
                  >
                    {QUANTIZATIONS.map(q => (
                      <option key={q.key} value={q.key}>{q.name} - Bits: {q.bpw}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* TWIN COMPARISON GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* PLATFORM ARCHITECTURE A */}
              <div id="compare-panel-a" className="bg-white rounded-none border border-[#E5E2DD] p-8 space-y-6">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-[#8C8881] font-mono tracking-wider uppercase">Hardware Design Profile A</span>
                  <select
                    id="comp-hardware-a-select"
                    value={compHardwareIdA}
                    onChange={(e) => setCompHardwareIdA(e.target.value)}
                    className="w-full px-3 py-2 rounded-none border border-[#1A1A1A] focus:outline-none focus:ring-0 text-xs font-mono bg-white font-bold"
                  >
                    {HARDWARE_PROFILES.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>

                <div className={`p-5 rounded-none border ${
                  compMatchA.isCompatible === 'yes' ? 'bg-[#F9F7F2] border-[#1A1A1A] text-[#1A1A1A]' :
                  compMatchA.isCompatible === 'partial' ? 'bg-[#FDFCFB] border-[#5C5852] text-[#1A1A1A]' : 'bg-[#FDFCFB] border-[#E5E2DD] text-[#5C5852]'
                }`}>
                  <div className="flex justify-between items-center text-xs font-mono mb-2 font-bold border-b border-current/25 pb-1">
                    <span>Inference Matrix A:</span>
                    <span className="uppercase tracking-wider">{compMatchA.isCompatible === 'yes' ? 'OPTIMAL' : compMatchA.isCompatible === 'partial' ? 'PAGING' : 'OOM'}</span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">{compMatchA.explanation}</p>
                </div>

                {/* HARD METRICS TABLE */}
                <div className="space-y-4 font-mono">
                  <h4 className="text-[10px] font-bold text-[#8C8881] uppercase tracking-wider">Metrics & Cost Breakdown</h4>
                  
                  <div className="space-y-3.5 text-xs text-[#5C5852]">
                    <div className="flex justify-between border-b border-[#E5E2DD]/65 pb-2">
                      <span className="text-[#8C8881]">Max Unified VRAM:</span>
                      <strong className="text-[#1A1A1A] font-semibold">{compHardwareA.vram} GB</strong>
                    </div>
                    <div className="flex justify-between border-b border-[#E5E2DD]/65 pb-2">
                      <span className="text-[#8C8881]">Memory Bandwidth:</span>
                      <strong className="text-[#1A1A1A] font-semibold">{compHardwareA.memoryBandwidth} GB/s</strong>
                    </div>
                    <div className="flex justify-between border-b border-[#E5E2DD]/65 pb-2">
                      <span className="text-[#8C8881]">Memory Architecture:</span>
                      <strong className="text-[#1A1A1A] font-semibold">{compHardwareA.memoryType}</strong>
                    </div>
                    <div className="flex justify-between border-b border-[#E5E2DD]/65 pb-2">
                      <span className="text-[#8C8881]">Estimated Price Matrix:</span>
                      <strong className="text-[#1A1A1A] font-semibold">${compHardwareA.estimatedPriceUSD} USD</strong>
                    </div>
                    <div className="flex justify-between border-b border-[#E5E2DD]/65 pb-2">
                      <span className="text-[#8C8881]">Standard Power Load:</span>
                      <strong className="text-[#1A1A1A] font-semibold">{compHardwareA.powerConsumptionWatts} Watts</strong>
                    </div>
                  </div>
                </div>

                {/* PREDICTION BAR */}
                <div className="border-t border-[#E5E2DD] pt-6 space-y-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] font-bold text-[#8C8881] font-mono uppercase block">Estimated Velocity A</span>
                    <div className="text-3xl font-black text-[#1A1A1A] font-mono tracking-tight">
                      {compMatchA.estimatedSpeed} <span className="text-xs font-normal text-[#8C8881]">tok/s</span>
                    </div>
                  </div>

                  <div className="bg-[#F9F7F2] p-4 text-xs leading-relaxed text-[#5C5852] font-mono border border-[#E5E2DD]">
                    <strong className="text-[#1A1A1A] text-[10px] uppercase tracking-wider block mb-1">Overhead Bottleneck A:</strong>
                    <p className="text-[#5C5852] leading-tight font-sans text-xs">{compMatchA.bottleneck}</p>
                  </div>
                </div>

              </div>

              {/* PLATFORM ARCHITECTURE B */}
              <div id="compare-panel-b" className="bg-white rounded-none border border-[#E5E2DD] p-8 space-y-6">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-[#8C8881] font-mono tracking-wider uppercase">Hardware Design Profile B</span>
                  <select
                    id="comp-hardware-b-select"
                    value={compHardwareIdB}
                    onChange={(e) => setCompHardwareIdB(e.target.value)}
                    className="w-full px-3 py-2 rounded-none border border-[#1A1A1A] focus:outline-none focus:ring-0 text-xs font-mono bg-white font-bold"
                  >
                    {HARDWARE_PROFILES.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>

                <div className={`p-5 rounded-none border ${
                  compMatchB.isCompatible === 'yes' ? 'bg-[#F9F7F2] border-[#1A1A1A] text-[#1A1A1A]' :
                  compMatchB.isCompatible === 'partial' ? 'bg-[#FDFCFB] border-[#5C5852] text-[#1A1A1A]' : 'bg-[#FDFCFB] border-[#E5E2DD] text-[#5C5852]'
                }`}>
                  <div className="flex justify-between items-center text-xs font-mono mb-2 font-bold border-b border-current/25 pb-1">
                    <span>Inference Matrix B:</span>
                    <span className="uppercase tracking-wider">{compMatchB.isCompatible === 'yes' ? 'OPTIMAL' : compMatchB.isCompatible === 'partial' ? 'PAGING' : 'OOM'}</span>
                  </div>
                  <p className="text-xs leading-relaxed opacity-90">{compMatchB.explanation}</p>
                </div>

                {/* HARD METRICS TABLE */}
                <div className="space-y-4 font-mono">
                  <h4 className="text-[10px] font-bold text-[#8C8881] uppercase tracking-wider">Metrics & Cost Breakdown</h4>
                  
                  <div className="space-y-3.5 text-xs text-[#5C5852]">
                    <div className="flex justify-between border-b border-[#E5E2DD]/65 pb-2">
                      <span className="text-[#8C8881]">Max Unified VRAM:</span>
                      <strong className="text-[#1A1A1A] font-semibold">{compHardwareB.vram} GB</strong>
                    </div>
                    <div className="flex justify-between border-b border-[#E5E2DD]/65 pb-2">
                      <span className="text-[#8C8881]">Memory Bandwidth:</span>
                      <strong className="text-[#1A1A1A] font-semibold">{compHardwareB.memoryBandwidth} GB/s</strong>
                    </div>
                    <div className="flex justify-between border-b border-[#E5E2DD]/65 pb-2">
                      <span className="text-[#8C8881]">Memory Architecture:</span>
                      <strong className="text-[#1A1A1A] font-semibold">{compHardwareB.memoryType}</strong>
                    </div>
                    <div className="flex justify-between border-b border-[#E5E2DD]/65 pb-2">
                      <span className="text-[#8C8881]">Estimated Price Matrix:</span>
                      <strong className="text-[#1A1A1A] font-semibold">${compHardwareB.estimatedPriceUSD} USD</strong>
                    </div>
                    <div className="flex justify-between border-b border-[#E5E2DD]/65 pb-2">
                      <span className="text-[#8C8881]">Standard Power Load:</span>
                      <strong className="text-[#1A1A1A] font-semibold">{compHardwareB.powerConsumptionWatts} Watts</strong>
                    </div>
                  </div>
                </div>

                {/* PREDICTION BAR */}
                <div className="border-t border-[#E5E2DD] pt-6 space-y-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] font-bold text-[#8C8881] font-mono uppercase block">Estimated Velocity B</span>
                    <div className="text-3xl font-black text-[#1A1A1A] font-mono tracking-tight">
                      {compMatchB.estimatedSpeed} <span className="text-xs font-normal text-[#8C8881]">tok/s</span>
                    </div>
                  </div>

                  <div className="bg-[#F9F7F2] p-4 text-xs leading-relaxed text-[#5C5852] font-mono border border-[#E5E2DD]">
                    <strong className="text-[#1A1A1A] text-[10px] uppercase tracking-wider block mb-1">Overhead Bottleneck B:</strong>
                    <p className="text-[#5C5852] leading-tight font-sans text-xs">{compMatchB.bottleneck}</p>
                  </div>
                </div>

              </div>

            </div>

            {/* ECONOMIC SUMMARY ALERT */}
            <div className="bg-[#1A1A1A] text-white rounded-none p-8 space-y-4">
              <h4 className="text-xs font-bold text-white font-mono uppercase tracking-widest flex items-center gap-2 border-b border-white/20 pb-2">
                <Sparkles className="h-4 w-4 text-white animate-pulse" />
                Architectural Platform Analysis
              </h4>
              <p className="text-xs text-[#E5E2DD] leading-relaxed font-sans">
                Notice the deep structural trade-off. High speed Mac Studio configurations offer massive consolidated memory bounds (up to 192GB Unified Memory), enabling execution of massive 70B or even 405B models without paging faults. However, raw bandwidth remains around 800 GB/s. A dedicated dual or tri NVIDIA RTX configuration yields significantly faster raw tokens per second (due to the 1000-1400 GB/s ultra-low latency GDDR6X modules), but caps out quickly VRAM-wise without costly multi-card installations.
              </p>
            </div>

          </div>
        )}

        {/* ==================== TAB 4: PERSONAL RIG ANALYZER ==================== */}
        {activeTab === 'analyzer' && (
          <div id="analyzer-view" className="space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* INTERACTIVE INPUTS (LEFT) */}
              <div id="personal-rig-card" className="lg:col-span-4 bg-white rounded-none border border-[#E5E2DD] p-6 space-y-6">
                <div className="flex items-center gap-2 border-b border-[#E5E2DD] pb-3">
                  <Laptop className="h-4.5 w-4.5 text-[#1A1A1A]" />
                  <h3 className="text-lg font-bold text-[#1A1A1A] font-serif italic">Config My Rig</h3>
                </div>

                {/* Setup Presets */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#8C8881] font-mono uppercase block tracking-wider">Configuration Profiles</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button id="preset-rtx3060" onClick={() => applyRigPreset('starter')} className="text-[10px] font-mono bg-[#F9F7F2] border border-[#E5E2DD] hover:bg-[#1A1A1A] hover:text-white px-2 py-0.5 text-[#1A1A1A] transition-all cursor-pointer">
                      RTX 3060 PC
                    </button>
                    <button id="preset-rtx4070" onClick={() => applyRigPreset('mid')} className="text-[10px] font-mono bg-[#F9F7F2] border border-[#E5E2DD] hover:bg-[#1A1A1A] hover:text-white px-2 py-0.5 text-[#1A1A1A] transition-all cursor-pointer">
                      RTX 4070 PC
                    </button>
                    <button id="preset-rtx4090" onClick={() => applyRigPreset('extreme')} className="text-[10px] font-mono bg-[#F9F7F2] border border-[#E5E2DD] hover:bg-[#1A1A1A] hover:text-white px-2 py-0.5 text-[#1A1A1A] transition-all cursor-pointer">
                      RTX 4090 Workstation
                    </button>
                    <button id="preset-macbpro" onClick={() => applyRigPreset('mac-m-pro')} className="text-[10px] font-mono bg-[#F9F7F2] border border-[#E5E2DD] hover:bg-[#1A1A1A] hover:text-white px-2 py-0.5 text-[#1A1A1A] transition-all cursor-pointer">
                      M-Pro 36G
                    </button>
                    <button id="preset-macbmax" onClick={() => applyRigPreset('mac-m-max')} className="text-[10px] font-mono bg-[#F9F7F2] border border-[#E5E2DD] hover:bg-[#1A1A1A] hover:text-white px-2 py-0.5 text-[#1A1A1A] transition-all cursor-pointer">
                      M-Max 128G
                    </button>
                    <button id="preset-macultra" onClick={() => applyRigPreset('mac-m-ultra')} className="text-[10px] font-mono bg-[#F9F7F2] border border-[#E5E2DD] hover:bg-[#1A1A1A] hover:text-white px-2 py-0.5 text-[#1A1A1A] transition-all cursor-pointer">
                      M-Ultra 192G
                    </button>
                    <button id="preset-cpu-ddr4" onClick={() => applyRigPreset('cpu-ddr4')} className="text-[10px] font-mono bg-[#F9F7F2] border border-[#E5E2DD] hover:bg-[#1A1A1A] hover:text-white px-2 py-0.5 text-[#1A1A1A] transition-all cursor-pointer">
                      CPU DDR4
                    </button>
                    <button id="preset-cpu-ddr5" onClick={() => applyRigPreset('cpu-ddr5')} className="text-[10px] font-mono bg-[#F9F7F2] border border-[#E5E2DD] hover:bg-[#1A1A1A] hover:text-white px-2 py-0.5 text-[#1A1A1A] transition-all cursor-pointer">
                      CPU DDR5
                    </button>
                  </div>
                </div>

                {/* Platform select dropdown */}
                <div className="flex flex-col gap-1.5 border-t border-[#E5E2DD] pt-4">
                  <label htmlFor="analyzer-platform-select" className="text-[10px] font-bold text-[#1A1A1A] font-mono uppercase tracking-wider">Host Platform</label>
                  <select
                    id="analyzer-platform-select"
                    value={rigPlatform}
                    onChange={(e) => {
                      const plat = e.target.value as any;
                      setRigPlatform(plat);
                      if (plat === 'mac') {
                        setRigVram(12);
                        setRigRam(16);
                        setRigBandwidth(150);
                      } else if (plat === 'pc_cpu') {
                        setRigVram(32);
                        setRigRam(32);
                        setRigBandwidth(48);
                      } else {
                        setRigVram(12);
                        setRigRam(32);
                        setRigBandwidth(504);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-none border border-[#1A1A1A] text-xs font-mono bg-white"
                  >
                    <option value="pc_gpu">Windows / Linux PC with NVIDIA GPU</option>
                    <option value="mac">Apple Silicon Mac (MacBook etc)</option>
                    <option value="pc_cpu">CPU Only / No High-End Graphics Card</option>
                  </select>
                </div>

                {/* VRAM Input Slider (For GPUs) */}
                {rigPlatform === 'pc_gpu' && (
                  <div className="space-y-2 border-t border-[#E5E2DD] pt-4">
                    <div className="flex justify-between items-center text-xs text-[#1A1A1A]">
                      <span className="font-mono text-[10px] uppercase font-bold text-[#8C8881]">Graphics Memory (VRAM)</span>
                      <span className="font-mono font-bold text-[#1A1A1A]">{rigVram} GB</span>
                    </div>
                    <input
                      id="analyzer-vram-slider"
                      type="range"
                      min="4"
                      max="1024"
                      step="4"
                      value={rigVram}
                      onChange={(e) => setRigVram(Number(e.target.value))}
                      className="w-full accent-[#1A1A1A] h-1 bg-[#F2EFE9] rounded-none appearance-none cursor-pointer"
                    />
                  </div>
                )}

                {/* System RAM Input Slider (Commonly used across all) */}
                <div className="space-y-2 border-t border-[#E5E2DD] pt-4">
                  <div className="flex justify-between items-center text-xs text-[#1A1A1A]">
                    <span className="font-mono text-[10px] uppercase font-bold text-[#8C8881]">{rigPlatform === 'mac' ? 'Unified system RAM' : 'System Memory (DRAM)'}</span>
                    <span className="font-mono font-bold text-[#1A1A1A]">{rigRam} GB</span>
                  </div>
                  <input
                    id="analyzer-ram-slider"
                    type="range"
                    min="8"
                    max="256"
                    step="8"
                    value={rigRam}
                    onChange={(e) => setRigRam(Number(e.target.value))}
                    className="w-full accent-[#1A1A1A] h-1 bg-[#F2EFE9] rounded-none appearance-none cursor-pointer"
                  />
                </div>

                {/* Memory Bandwidth Slider */}
                <div className="space-y-2 border-t border-[#E5E2DD] pt-4">
                  <div className="flex justify-between items-center text-xs text-[#1A1A1A]">
                    <span className="font-mono text-[10px] uppercase font-bold text-[#8C8881]">{rigPlatform === 'pc_cpu' ? 'Memory Bus Bandwidth' : 'System Transfer Speed'}</span>
                    <span className="font-mono font-bold text-[#1A1A1A]">{rigBandwidth} GB/s</span>
                  </div>
                  <input
                    id="analyzer-bandwidth-slider"
                    type="range"
                    min="30"
                    max="1200"
                    step="10"
                    value={rigBandwidth}
                    onChange={(e) => setRigBandwidth(Number(e.target.value))}
                    className="w-full accent-[#1A1A1A] h-1 bg-[#F2EFE9] rounded-none appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-[#8C8881] font-mono">
                    <span>50 GB/s (DDR5)</span>
                    <span>400 GB/s (M-Max)</span>
                    <span>1000 GB/s (4090)</span>
                  </div>
                </div>

              </div>

              {/* DURATION COMPREHENSIVE COMPARISON RESULT TABLE */}
              <div className="lg:col-span-8 bg-white rounded-none border border-[#E5E2DD] p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-[#1A1A1A] font-serif italic">
                    Local Performance Forecast Matrix
                  </h3>
                  <p className="text-xs text-[#5C5852] mt-1 font-sans">
                    Matches your dynamic system specs against every model in the catalog. Real-time token output evaluations are printed below.
                  </p>
                </div>

                <div className="overflow-x-auto border border-[#1A1A1A] rounded-none">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F9F7F2] border-b border-[#1A1A1A] font-mono font-bold text-[#1A1A1A] text-[10px] uppercase">
                        <th className="p-3">Model Family</th>
                        <th className="p-3 text-center">Params</th>
                        <th className="p-3 text-center">FP16 (Pure)</th>
                        <th className="p-3 text-center">Q8_0 (Lossless)</th>
                        <th className="p-3 text-center">Q5_K_M (Budget)</th>
                        <th className="p-3 text-center">Q4_K_M (Optimal)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E2DD] font-mono text-[11px] text-[#1A1A1A]">
                      {rigAnalysisReport.map(({ model, quantReports }) => {
                        const fp16 = quantReports.find(q => q.quantKey === 'fp16')!;
                        const q8 = quantReports.find(q => q.quantKey === 'q8_0')!;
                        const q5 = quantReports.find(q => q.quantKey === 'q5_k_m')!;
                        const q4 = quantReports.find(q => q.quantKey === 'q4_k_m')!;

                        const renderCell = (report: typeof fp16) => {
                           if (report.isCompatible === 'no') {
                             return <span className="text-[#C2410C] font-semibold">OOM</span>;
                           }
                           if (report.isCompatible === 'partial') {
                             return (
                               <div className="flex flex-col items-center">
                                 <span className="text-[#B45309] font-bold">{report.estimatedSpeed} t/s</span>
                                 <span className="text-[8px] text-[#A16207]">Paging</span>
                               </div>
                             );
                           }
                           return (
                             <div className="flex flex-col items-center">
                               <span className="text-[#15803D] font-bold">{report.estimatedSpeed} t/s</span>
                               <span className="text-[8px] text-[#8C8881]">Fits VRAM</span>
                             </div>
                           );
                        };

                        return (
                          <tr key={model.id} className="hover:bg-[#FDFCFB]">
                            <td className="p-3 font-sans font-bold text-[#1A1A1A] border-r border-[#E5E2DD]">
                              {model.name}
                            </td>
                            <td className="p-3 text-center text-[#5C5852] border-r border-[#E5E2DD]">
                              {model.params}B
                            </td>
                            <td className="p-3 text-center border-r border-[#E5E2DD] bg-[#F9F7F2]/30">{renderCell(fp16)}</td>
                            <td className="p-3 text-center border-r border-[#E5E2DD]">{renderCell(q8)}</td>
                            <td className="p-3 text-center border-r border-[#E5E2DD] bg-[#F9F7F2]/30">{renderCell(q5)}</td>
                            <td className="p-3 text-center">{renderCell(q4)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-1.5 text-[10px] text-[#8C8881] font-mono border-t border-[#E5E2DD] pt-4 leading-relaxed">
                  <p>• <strong className="text-[#1A1A1A]">OOM</strong>: Out-Of-Memory limit hit. Model footprint exceeds physical memory threshold.</p>
                  <p>• <strong className="text-[#1A1A1A]">Paging / Offloader</strong>: The model weights exceed GPU VRAM boundaries, triggering layer offloads via CPU PCIe lanes. Speeds will suffer.</p>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ==================== TAB 5: HOW-TO GUIDES ==================== */}
        {activeTab === 'guides' && (
          <div id="guides-view" className="space-y-6">
            
            <div className="bg-white rounded-none border border-[#E5E2DD] p-8 space-y-8">
              
              <div className="border-b border-[#E5E2DD] pb-4">
                <h3 className="text-2xl font-bold font-serif italic text-[#1A1A1A] flex items-center gap-2.5">
                  <Terminal className="h-5 w-5 text-[#1A1A1A]" />
                  Local AI Deployment Blueprint
                </h3>
                <p className="text-xs text-[#5C5852] mt-1.5 font-sans">
                  How to run these models locally. Follow these structural instructions to get up and running on Windows, macOS, or Linux platforms.
                </p>
              </div>

              {/* OLLAMA GUIDE CARD */}
              <div id="guide-ollama" className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="bg-[#1A1A1A] text-white text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-none tracking-widest uppercase">
                    Method One
                  </span>
                  <h4 className="font-bold text-[#1A1A1A] text-sm">Ollama (Easiest Local CLI Engine)</h4>
                </div>
                <p className="text-xs text-[#5C5852] leading-relaxed font-sans">
                  Ollama is the premier lightweight application that wraps llama.cpp into a clean system service. It handles GPU management automatically, supports native Apple Metal, NVIDIA CUDA on Windows/Linux, and provides an active REST API endpoint.
                </p>

                <div className="bg-[#1A1A1A] text-[#F9F7F2] rounded-none p-6 font-mono text-xs space-y-3.5 border border-[#1A1A1A]">
                  <div className="text-[#8C8881]"># 1. Download and install on macOS/Linux terminal or Windows Installer</div>
                  <div className="text-[#E5E2DD] border-l-2 border-[#8C8881] pl-3">curl -fsSL https://ollama.com/install.sh | sh</div>
                  
                  <div className="text-[#8C8881] mt-3"># 2. Run your matched model (Ollama defaults to efficient 4-bit quantizations)</div>
                  <div className="text-[#E5E2DD] border-l-2 border-[#8C8881] pl-3">ollama run llama3.1:8b</div>
                  
                  <div className="text-[#8C8881] mt-3"># 3. For reasoning workloads, spin up DeepSeek reasoning nodes:</div>
                  <div className="text-[#E5E2DD] border-l-2 border-[#8C8881] pl-3">ollama run deepseek-r1:8b</div>
                </div>
              </div>

              {/* LM STUDIO GUIDE (GUI APPLICATION) */}
              <div id="guide-lmstudio" className="space-y-4 border-t border-[#E5E2DD] pt-6">
                <div className="flex items-center gap-2">
                  <span className="bg-[#E5E2DD] text-[#1A1A1A] text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-none tracking-widest uppercase">
                    Method Two
                  </span>
                  <h4 className="font-bold text-[#1A1A1A] text-sm">LM Studio (Visual Playground GUI)</h4>
                </div>
                <p className="text-xs text-[#5C5852] leading-relaxed">
                  LM Studio provides a gorgeous desktop frontend with in-app Hugging Face searching, visual slider settings for sliding flash attention window, sliding offload layers count, and a built-in chat UI mimicking Anthropic/OpenAI interfaces.
                </p>
                <ol className="list-decimal list-inside text-xs text-[#5C5852] space-y-2 pl-2">
                  <li>Download <strong>LM Studio</strong> from <a href="https://lmstudio.ai" target="_blank" className="text-[#1A1A1A] underline font-semibold">lmstudio.ai</a>.</li>
                  <li>In the search box, paste any model Hugging Face handles e.g., <code className="bg-[#F9F7F2] p-0.5 px-1 font-mono text-[11px] border border-[#E5E2DD]">meta-llama/Llama-3.1-8B-Instruct</code>.</li>
                  <li>Choose the precise quantization size (e.g. <code className="bg-[#F9F7F2] p-0.5 px-1 font-mono text-[11px] border border-[#E5E2DD]">Q4_K_M</code>) that matched your estimated VRAM limits in our calculator!</li>
                  <li>On the right side menu, check <strong>Hardware Settings &gt; GPU Offload Enabled</strong> to unleash CUDA/Apple Metal acceleration.</li>
                </ol>
              </div>

              {/* EXOTIC STACKS */}
              <div id="guide-advanced" className="bg-[#F9F7F2] p-5 rounded-none border border-[#1A1A1A] space-y-2.5">
                <h5 className="text-[10px] font-bold font-mono text-[#1A1A1A] uppercase tracking-wider">Advanced Stack Configurations:</h5>
                <ul className="text-xs text-[#5C5852] space-y-1.5 list-disc list-inside">
                  <li><strong>vLLM</strong>: Used for high-concurrency hosting on Linux rigs. Offers PagedAttention for maximum enterprise throughput.</li>
                  <li><strong>Exo Cluster</strong>: Got a spare MacBook and an AMD PC? Exo connects separate physical hardware over local Wi-Fi, splitting 70B layer execution workloads concurrently!</li>
                </ul>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer id="app-footer" className="bg-[#F9F7F2] border-t border-[#1A1A1A] mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-[#8C8881] font-mono uppercase tracking-wider">
            Local AI Hardware Index • Updated June 2026
          </p>
          <div className="flex items-center gap-6">
            <span className="text-[10px] text-[#8C8881] font-mono uppercase">
              Estimations built on raw memory bandwidth.
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
