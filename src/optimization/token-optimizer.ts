/**
 * Token Optimization System for OnChainAgents
 * Inspired by SuperClaude's 30-50% token reduction with crypto symbols
 * Provides intelligent compression while maintaining clarity
 */

import { EventEmitter } from 'events';

// Crypto-specific symbols
export const CRYPTO_SYMBOLS = {
  // Blockchain symbols
  '⛓️': 'blockchain',
  '🔗': 'chain',
  '📦': 'block',
  '💎': 'token',
  '🪙': 'coin',
  '⚡': 'transaction',
  '🔑': 'wallet',
  '📜': 'contract',
  
  // DeFi symbols
  '🏦': 'protocol',
  '💰': 'liquidity',
  '📈': 'yield',
  '🔄': 'swap',
  '🌊': 'pool',
  '🌾': 'farming',
  '🏛️': 'governance',
  '🎯': 'apy',
  
  // Security symbols
  '🛡️': 'security',
  '🔒': 'locked',
  '⚠️': 'risk',
  '🚨': 'alert',
  '✅': 'verified',
  '❌': 'failed',
  '🔍': 'audit',
  '🐛': 'bug',
  
  // Market symbols
  '📊': 'market',
  '🐂': 'bullish',
  '🐻': 'bearish',
  '🚀': 'pump',
  '💥': 'dump',
  '🐋': 'whale',
  '🦐': 'shrimp',
  '💹': 'price',
  
  // Operations
  '➕': 'add',
  '➖': 'remove',
  '✖️': 'multiply',
  '➗': 'divide',
  '→': 'transfer',
  '←': 'receive',
  '↔️': 'exchange',
  '⏱️': 'pending',
};

// Abbreviation dictionary
export const ABBREVIATIONS: Record<string, string> = {
  // Blockchain terms
  'address': 'addr',
  'transaction': 'tx',
  'block': 'blk',
  'height': 'ht',
  'confirmation': 'conf',
  'signature': 'sig',
  'validator': 'val',
  'delegator': 'del',
  
  // DeFi terms
  'liquidity': 'liq',
  'provider': 'prov',
  'automatic market maker': 'AMM',
  'decentralized exchange': 'DEX',
  'centralized exchange': 'CEX',
  'total value locked': 'TVL',
  'annual percentage yield': 'APY',
  'annual percentage rate': 'APR',
  'impermanent loss': 'IL',
  
  // Technical terms
  'ethereum': 'ETH',
  'bitcoin': 'BTC',
  'polygon': 'POLY',
  'binance smart chain': 'BSC',
  'arbitrum': 'ARB',
  'optimism': 'OP',
  'configuration': 'cfg',
  'implementation': 'impl',
  'optimization': 'opt',
  'validation': 'val',
  
  // Common patterns
  'greater than': '>',
  'less than': '<',
  'equal to': '=',
  'not equal': '≠',
  'approximately': '≈',
  'therefore': '∴',
  'because': '∵',
  'maximum': 'max',
  'minimum': 'min',
  'average': 'avg',
};

// Compression strategies
export enum CompressionStrategy {
  NONE = 'none',
  SOFT = 'soft',        // 10-20% reduction
  MEDIUM = 'medium',    // 20-35% reduction
  HARD = 'hard',        // 35-50% reduction
  ULTRA = 'ultra',      // 50%+ reduction (may lose clarity)
}

// Token optimization result
export interface OptimizationResult {
  original: string;
  optimized: string;
  originalTokens: number;
  optimizedTokens: number;
  reduction: number;
  reductionPercentage: number;
  strategy: CompressionStrategy;
  symbolsUsed: string[];
  preservedInformation: number; // 0-100%
}

/**
 * Token Optimizer
 * Achieves 30-50% token reduction while maintaining clarity
 */
export class TokenOptimizer extends EventEmitter {
  private strategy: CompressionStrategy = CompressionStrategy.MEDIUM;
  private symbolLegend: Map<string, string> = new Map();
  private customAbbreviations: Map<string, string> = new Map();
  private preserveReadability: boolean = true;
  private autoGenerateLegend: boolean = true;
  
  constructor() {
    super();
    this.initializeSymbolLegend();
  }
  
  /**
   * Initialize symbol legend
   */
  private initializeSymbolLegend(): void {
    for (const [symbol, meaning] of Object.entries(CRYPTO_SYMBOLS)) {
      this.symbolLegend.set(symbol, meaning);
    }
  }
  
  /**
   * Set compression strategy
   */
  public setStrategy(strategy: CompressionStrategy): void {
    this.strategy = strategy;
    this.emit('strategy-changed', { strategy });
  }
  
  /**
   * Optimize text
   */
  public optimize(text: string, strategy?: CompressionStrategy): OptimizationResult {
    const startTime = Date.now();
    strategy = strategy || this.strategy;
    
    const originalTokens = this.estimateTokens(text);
    let optimized = text;
    const symbolsUsed: Set<string> = new Set();
    
    // Apply optimization based on strategy
    switch (strategy) {
      case CompressionStrategy.SOFT:
        optimized = this.applySoftCompression(text, symbolsUsed);
        break;
      case CompressionStrategy.MEDIUM:
        optimized = this.applyMediumCompression(text, symbolsUsed);
        break;
      case CompressionStrategy.HARD:
        optimized = this.applyHardCompression(text, symbolsUsed);
        break;
      case CompressionStrategy.ULTRA:
        optimized = this.applyUltraCompression(text, symbolsUsed);
        break;
      default:
        // No compression
        break;
    }
    
    const optimizedTokens = this.estimateTokens(optimized);
    const reduction = originalTokens - optimizedTokens;
    const reductionPercentage = (reduction / originalTokens) * 100;
    
    // Generate legend if needed
    if (this.autoGenerateLegend && symbolsUsed.size > 0) {
      optimized = this.appendLegend(optimized, symbolsUsed);
    }
    
    const result: OptimizationResult = {
      original: text,
      optimized,
      originalTokens,
      optimizedTokens,
      reduction,
      reductionPercentage,
      strategy,
      symbolsUsed: Array.from(symbolsUsed),
      preservedInformation: this.calculateInformationPreservation(text, optimized),
    };
    
    this.emit('optimization-complete', {
      result,
      duration: Date.now() - startTime,
    });
    
    return result;
  }
  
  /**
   * Apply soft compression (10-20% reduction)
   */
  private applySoftCompression(text: string, symbolsUsed: Set<string>): string {
    let compressed = text;
    
    // Remove unnecessary whitespace
    compressed = compressed.replace(/\s+/g, ' ').trim();
    
    // Use common abbreviations
    for (const [full, abbr] of Object.entries(ABBREVIATIONS).slice(0, 10)) {
      const regex = new RegExp(`\\b${full}\\b`, 'gi');
      if (regex.test(compressed)) {
        compressed = compressed.replace(regex, abbr);
      }
    }
    
    // Add a few symbols for common terms
    const commonSymbols = ['🔗', '💎', '📊', '✅'];
    for (const symbol of commonSymbols) {
      const meaning = this.symbolLegend.get(symbol);
      if (meaning && compressed.includes(meaning)) {
        compressed = compressed.replace(new RegExp(`\\b${meaning}\\b`, 'gi'), symbol);
        symbolsUsed.add(symbol);
      }
    }
    
    return compressed;
  }
  
  /**
   * Apply medium compression (20-35% reduction)
   */
  private applyMediumCompression(text: string, symbolsUsed: Set<string>): string {
    let compressed = this.applySoftCompression(text, symbolsUsed);
    
    // Use more abbreviations
    for (const [full, abbr] of Object.entries(ABBREVIATIONS)) {
      const regex = new RegExp(`\\b${full}\\b`, 'gi');
      if (regex.test(compressed)) {
        compressed = compressed.replace(regex, abbr);
      }
    }
    
    // Use more symbols
    for (const [symbol, meaning] of this.symbolLegend) {
      if (compressed.includes(meaning)) {
        compressed = compressed.replace(new RegExp(`\\b${meaning}\\b`, 'gi'), symbol);
        symbolsUsed.add(symbol);
      }
    }
    
    // Compress common phrases
    compressed = this.compressCommonPhrases(compressed);
    
    // Remove articles when safe
    compressed = compressed.replace(/\b(the|a|an)\s+/gi, '');
    
    return compressed;
  }
  
  /**
   * Apply hard compression (35-50% reduction)
   */
  private applyHardCompression(text: string, symbolsUsed: Set<string>): string {
    let compressed = this.applyMediumCompression(text, symbolsUsed);
    
    // Aggressive abbreviation
    compressed = this.aggressiveAbbreviate(compressed);
    
    // Use compound symbols
    compressed = this.useCompoundSymbols(compressed, symbolsUsed);
    
    // Remove all non-essential words
    compressed = this.removeNonEssential(compressed);
    
    // Use mathematical notation
    compressed = this.useMathNotation(compressed);
    
    return compressed;
  }
  
  /**
   * Apply ultra compression (50%+ reduction)
   */
  private applyUltraCompression(text: string, symbolsUsed: Set<string>): string {
    let compressed = this.applyHardCompression(text, symbolsUsed);
    
    // Extreme abbreviation
    compressed = this.extremeAbbreviate(compressed);
    
    // Use custom encoding
    compressed = this.customEncode(compressed, symbolsUsed);
    
    // Remove all spaces where possible
    compressed = this.removeSpaces(compressed);
    
    return compressed;
  }
  
  /**
   * Compress common phrases
   */
  private compressCommonPhrases(text: string): string {
    const phrases: Record<string, string> = {
      'smart contract': 'SC',
      'gas fee': 'gas',
      'transaction hash': 'txh',
      'wallet address': 'addr',
      'private key': 'pvk',
      'public key': 'pbk',
      'market cap': 'mcap',
      'trading volume': 'vol',
      'all time high': 'ATH',
      'all time low': 'ATL',
      'return on investment': 'ROI',
      'fear uncertainty doubt': 'FUD',
      'fear of missing out': 'FOMO',
      'do your own research': 'DYOR',
      'not financial advice': 'NFA',
    };
    
    let compressed = text;
    for (const [phrase, abbr] of Object.entries(phrases)) {
      compressed = compressed.replace(new RegExp(phrase, 'gi'), abbr);
    }
    
    return compressed;
  }
  
  /**
   * Aggressive abbreviation
   */
  private aggressiveAbbreviate(text: string): string {
    // Abbreviate all words > 6 characters
    return text.replace(/\b(\w{7,})\b/g, (match) => {
      if (match.toUpperCase() === match) return match; // Keep acronyms
      
      // Take first 3 letters + last letter
      return match.substring(0, 3) + match.slice(-1);
    });
  }
  
  /**
   * Use compound symbols
   */
  private useCompoundSymbols(text: string, symbolsUsed: Set<string>): string {
    const compounds: Record<string, string> = {
      'whale alert': '🐋🚨',
      'bull market': '🐂📊',
      'bear market': '🐻📊',
      'yield farming': '📈🌾',
      'liquidity pool': '💰🌊',
      'smart contract': '📜🔒',
      'security audit': '🛡️🔍',
      'price pump': '💹🚀',
      'rug pull': '🏃💰',
      'gas war': '⛽⚔️',
    };
    
    let compressed = text;
    for (const [phrase, symbols] of Object.entries(compounds)) {
      if (compressed.includes(phrase)) {
        compressed = compressed.replace(new RegExp(phrase, 'gi'), symbols);
        symbols.split('').forEach(s => symbolsUsed.add(s));
      }
    }
    
    return compressed;
  }
  
  /**
   * Remove non-essential words
   */
  private removeNonEssential(text: string): string {
    const nonEssential = [
      'very', 'really', 'actually', 'basically', 'simply',
      'just', 'quite', 'rather', 'somewhat', 'fairly',
      'however', 'therefore', 'moreover', 'furthermore',
      'additionally', 'consequently', 'nevertheless',
    ];
    
    let compressed = text;
    for (const word of nonEssential) {
      compressed = compressed.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
    }
    
    // Clean up extra spaces
    return compressed.replace(/\s+/g, ' ').trim();
  }
  
  /**
   * Use mathematical notation
   */
  private useMathNotation(text: string): string {
    const notations: Record<string, string> = {
      'greater than or equal to': '≥',
      'less than or equal to': '≤',
      'not equal to': '≠',
      'approximately equal to': '≈',
      'plus or minus': '±',
      'multiplied by': '×',
      'divided by': '÷',
      'sum of': 'Σ',
      'product of': 'Π',
      'square root of': '√',
      'infinity': '∞',
      'delta': 'Δ',
      'percent': '%',
    };
    
    let compressed = text;
    for (const [phrase, notation] of Object.entries(notations)) {
      compressed = compressed.replace(new RegExp(phrase, 'gi'), notation);
    }
    
    return compressed;
  }
  
  /**
   * Extreme abbreviation
   */
  private extremeAbbreviate(text: string): string {
    // Keep only first 2 letters of each word
    return text.replace(/\b(\w{3,})\b/g, (match) => {
      if (match.toUpperCase() === match) return match; // Keep acronyms
      return match.substring(0, 2);
    });
  }
  
  /**
   * Custom encoding
   */
  private customEncode(text: string, symbolsUsed: Set<string>): string {
    // Create custom abbreviations for frequent words
    const words = text.split(/\s+/);
    const frequency: Map<string, number> = new Map();
    
    for (const word of words) {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    }
    
    // Sort by frequency
    const sorted = Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    let compressed = text;
    let index = 1;
    
    for (const [word, count] of sorted) {
      if (count > 2 && word.length > 3) {
        const code = `#${index}`;
        compressed = compressed.replace(new RegExp(`\\b${word}\\b`, 'g'), code);
        this.customAbbreviations.set(code, word);
        index++;
      }
    }
    
    return compressed;
  }
  
  /**
   * Remove spaces where safe
   */
  private removeSpaces(text: string): string {
    // Remove spaces around punctuation
    let compressed = text.replace(/\s*([,;:!?])\s*/g, '$1');
    
    // Remove spaces around symbols
    compressed = compressed.replace(/\s*([→←↔️⚡🔗💎])\s*/g, '$1');
    
    // Remove spaces between number and unit
    compressed = compressed.replace(/(\d+)\s+(ETH|BTC|USD|USDC|USDT|%)/g, '$1$2');
    
    return compressed;
  }
  
  /**
   * Append legend for symbols used
   */
  private appendLegend(text: string, symbolsUsed: Set<string>): string {
    if (symbolsUsed.size === 0) return text;
    
    let legend = '\n---\nSymbol Legend:\n';
    for (const symbol of symbolsUsed) {
      const meaning = this.symbolLegend.get(symbol);
      if (meaning) {
        legend += `${symbol} = ${meaning}\n`;
      }
    }
    
    // Add custom abbreviations if any
    if (this.customAbbreviations.size > 0) {
      legend += '\nCustom Codes:\n';
      for (const [code, word] of this.customAbbreviations) {
        legend += `${code} = ${word}\n`;
      }
    }
    
    return text + legend;
  }
  
  /**
   * Estimate token count
   */
  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
  
  /**
   * Calculate information preservation
   */
  private calculateInformationPreservation(original: string, optimized: string): number {
    // Simple heuristic based on key terms preservation
    const originalWords = original.toLowerCase().split(/\s+/);
    const keyWords = originalWords.filter(w => w.length > 4);
    
    let preserved = 0;
    for (const word of keyWords) {
      // Check if word or its abbreviation exists
      if (optimized.toLowerCase().includes(word.substring(0, 3))) {
        preserved++;
      }
    }
    
    return Math.min(100, (preserved / Math.max(1, keyWords.length)) * 100);
  }
  
  /**
   * Decompress text (restore original)
   */
  public decompress(compressed: string): string {
    let decompressed = compressed;
    
    // Replace symbols with meanings
    for (const [symbol, meaning] of this.symbolLegend) {
      decompressed = decompressed.replace(new RegExp(symbol, 'g'), meaning);
    }
    
    // Replace custom codes
    for (const [code, word] of this.customAbbreviations) {
      decompressed = decompressed.replace(new RegExp(code, 'g'), word);
    }
    
    // Expand abbreviations
    for (const [full, abbr] of Object.entries(ABBREVIATIONS)) {
      decompressed = decompressed.replace(new RegExp(`\\b${abbr}\\b`, 'g'), full);
    }
    
    return decompressed;
  }
  
  /**
   * Get statistics
   */
  public getStatistics(): any {
    return {
      currentStrategy: this.strategy,
      symbolsAvailable: this.symbolLegend.size,
      abbreviationsAvailable: Object.keys(ABBREVIATIONS).length,
      customAbbreviations: this.customAbbreviations.size,
      preserveReadability: this.preserveReadability,
      autoGenerateLegend: this.autoGenerateLegend,
    };
  }
  
  /**
   * Add custom abbreviation
   */
  public addAbbreviation(full: string, abbreviated: string): void {
    this.customAbbreviations.set(abbreviated, full);
  }
  
  /**
   * Clear custom abbreviations
   */
  public clearCustomAbbreviations(): void {
    this.customAbbreviations.clear();
  }
}

export default TokenOptimizer;