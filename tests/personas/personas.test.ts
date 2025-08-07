/**
 * Comprehensive tests for Persona System
 * Achieving 100% code coverage
 */

import { PersonaManager } from '../../src/personas/PersonaManager';
import { Persona } from '../../src/personas/types';
import { AgentContext } from '../../src/agents/base/BaseAgent';

describe('PersonaManager', () => {
  let personaManager: PersonaManager;

  beforeEach(() => {
    jest.clearAllMocks();
    personaManager = new PersonaManager();
  });

  describe('constructor', () => {
    it('should initialize with all 11 personas', () => {
      expect(personaManager).toBeDefined();
      expect((personaManager as any).personas.size).toBe(11);
    });

    it('should load architect persona', () => {
      const architect = (personaManager as any).personas.get('architect');
      expect(architect).toBeDefined();
      expect(architect.name).toBe('architect');
      expect(architect.priority).toContain('maintainability');
    });

    it('should load frontend persona', () => {
      const frontend = (personaManager as any).personas.get('frontend');
      expect(frontend).toBeDefined();
      expect(frontend.name).toBe('frontend');
      expect(frontend.priority).toContain('user needs');
    });

    it('should load backend persona', () => {
      const backend = (personaManager as any).personas.get('backend');
      expect(backend).toBeDefined();
      expect(backend.name).toBe('backend');
      expect(backend.priority).toContain('reliability');
    });

    it('should load security persona', () => {
      const security = (personaManager as any).personas.get('security');
      expect(security).toBeDefined();
      expect(security.name).toBe('security');
      expect(security.priority).toContain('security');
    });

    it('should load analyzer persona', () => {
      const analyzer = (personaManager as any).personas.get('analyzer');
      expect(analyzer).toBeDefined();
      expect(analyzer.name).toBe('analyzer');
      expect(analyzer.priority).toContain('evidence');
    });

    it('should load all other personas', () => {
      const personas = ['mentor', 'refactorer', 'performance', 'qa', 'devops', 'scribe'];
      personas.forEach(name => {
        const persona = (personaManager as any).personas.get(name);
        expect(persona).toBeDefined();
        expect(persona.name).toBe(name);
      });
    });
  });

  describe('activatePersona', () => {
    it('should activate specific persona', () => {
      const result = personaManager.activatePersona('architect');
      
      expect(result).toBeDefined();
      expect(result.name).toBe('architect');
      expect((personaManager as any).activePersona).toBe('architect');
    });

    it('should handle invalid persona name', () => {
      const result = personaManager.activatePersona('invalid');
      
      expect(result).toBeNull();
      expect((personaManager as any).activePersona).toBeNull();
    });

    it('should deactivate previous persona', () => {
      personaManager.activatePersona('architect');
      personaManager.activatePersona('frontend');
      
      expect((personaManager as any).activePersona).toBe('frontend');
    });
  });

  describe('autoActivate', () => {
    it('should auto-activate architect for system design', () => {
      const context: AgentContext = {
        action: 'design',
        description: 'system architecture review',
      };
      
      const persona = personaManager.autoActivate(context);
      
      expect(persona).toBeDefined();
      expect(persona?.name).toBe('architect');
    });

    it('should auto-activate frontend for UI tasks', () => {
      const context: AgentContext = {
        action: 'implement',
        description: 'create responsive component',
      };
      
      const persona = personaManager.autoActivate(context);
      
      expect(persona?.name).toBe('frontend');
    });

    it('should auto-activate backend for API tasks', () => {
      const context: AgentContext = {
        action: 'implement',
        description: 'build REST API endpoint',
      };
      
      const persona = personaManager.autoActivate(context);
      
      expect(persona?.name).toBe('backend');
    });

    it('should auto-activate security for vulnerability checks', () => {
      const context: AgentContext = {
        action: 'audit',
        description: 'check for vulnerabilities',
      };
      
      const persona = personaManager.autoActivate(context);
      
      expect(persona?.name).toBe('security');
    });

    it('should auto-activate analyzer for investigations', () => {
      const context: AgentContext = {
        action: 'analyze',
        description: 'investigate root cause',
      };
      
      const persona = personaManager.autoActivate(context);
      
      expect(persona?.name).toBe('analyzer');
    });

    it('should auto-activate mentor for explanations', () => {
      const context: AgentContext = {
        action: 'explain',
        description: 'help me understand',
      };
      
      const persona = personaManager.autoActivate(context);
      
      expect(persona?.name).toBe('mentor');
    });

    it('should auto-activate refactorer for cleanup', () => {
      const context: AgentContext = {
        action: 'cleanup',
        description: 'refactor messy code',
      };
      
      const persona = personaManager.autoActivate(context);
      
      expect(persona?.name).toBe('refactorer');
    });

    it('should auto-activate performance for optimization', () => {
      const context: AgentContext = {
        action: 'optimize',
        description: 'improve performance',
      };
      
      const persona = personaManager.autoActivate(context);
      
      expect(persona?.name).toBe('performance');
    });

    it('should auto-activate qa for testing', () => {
      const context: AgentContext = {
        action: 'test',
        description: 'validate functionality',
      };
      
      const persona = personaManager.autoActivate(context);
      
      expect(persona?.name).toBe('qa');
    });

    it('should auto-activate devops for deployment', () => {
      const context: AgentContext = {
        action: 'deploy',
        description: 'setup infrastructure',
      };
      
      const persona = personaManager.autoActivate(context);
      
      expect(persona?.name).toBe('devops');
    });

    it('should auto-activate scribe for documentation', () => {
      const context: AgentContext = {
        action: 'document',
        description: 'write user guide',
      };
      
      const persona = personaManager.autoActivate(context);
      
      expect(persona?.name).toBe('scribe');
    });

    it('should handle complex multi-factor scoring', () => {
      const context: AgentContext = {
        action: 'analyze',
        description: 'security vulnerabilities in architecture',
        complexity: 'high',
      };
      
      const persona = personaManager.autoActivate(context);
      
      // Should prioritize security due to vulnerability keyword
      expect(persona?.name).toBe('security');
    });

    it('should return null for ambiguous context', () => {
      const context: AgentContext = {
        action: 'process',
        description: 'do something',
      };
      
      const persona = personaManager.autoActivate(context);
      
      expect(persona).toBeNull();
    });
  });

  describe('calculateScore', () => {
    it('should calculate high score for exact matches', () => {
      const context: AgentContext = {
        action: 'design',
        description: 'system architecture scalability',
      };
      
      const score = (personaManager as any).calculateScore(
        (personaManager as any).personas.get('architect'),
        context
      );
      
      expect(score).toBeGreaterThan(0.7);
    });

    it('should calculate low score for mismatches', () => {
      const context: AgentContext = {
        action: 'design',
        description: 'UI component',
      };
      
      const score = (personaManager as any).calculateScore(
        (personaManager as any).personas.get('backend'),
        context
      );
      
      expect(score).toBeLessThan(0.5);
    });

    it('should weight keywords appropriately', () => {
      const context: AgentContext = {
        action: 'analyze',
        description: 'performance bottleneck',
      };
      
      const performanceScore = (personaManager as any).calculateScore(
        (personaManager as any).personas.get('performance'),
        context
      );
      
      const analyzerScore = (personaManager as any).calculateScore(
        (personaManager as any).personas.get('analyzer'),
        context
      );
      
      expect(performanceScore).toBeGreaterThan(analyzerScore);
    });

    it('should consider context complexity', () => {
      const simpleContext: AgentContext = {
        action: 'test',
        description: 'simple test',
        complexity: 'simple',
      };
      
      const complexContext: AgentContext = {
        action: 'test',
        description: 'simple test',
        complexity: 'complex',
      };
      
      const simpleScore = (personaManager as any).calculateScore(
        (personaManager as any).personas.get('qa'),
        simpleContext
      );
      
      const complexScore = (personaManager as any).calculateScore(
        (personaManager as any).personas.get('qa'),
        complexContext
      );
      
      expect(complexScore).toBeGreaterThan(simpleScore);
    });
  });

  describe('getActivePersona', () => {
    it('should return active persona', () => {
      personaManager.activatePersona('architect');
      
      const active = personaManager.getActivePersona();
      
      expect(active).toBeDefined();
      expect(active?.name).toBe('architect');
    });

    it('should return null when no persona active', () => {
      const active = personaManager.getActivePersona();
      
      expect(active).toBeNull();
    });
  });

  describe('deactivatePersona', () => {
    it('should deactivate current persona', () => {
      personaManager.activatePersona('architect');
      personaManager.deactivatePersona();
      
      expect(personaManager.getActivePersona()).toBeNull();
    });
  });

  describe('getPersonaConfig', () => {
    it('should return configuration for architect', () => {
      const config = personaManager.getPersonaConfig('architect');
      
      expect(config).toBeDefined();
      expect(config?.mcpPreferences.primary).toBe('Sequential');
      expect(config?.mcpPreferences.secondary).toBe('Context7');
    });

    it('should return configuration for frontend', () => {
      const config = personaManager.getPersonaConfig('frontend');
      
      expect(config).toBeDefined();
      expect(config?.mcpPreferences.primary).toBe('Magic');
      expect(config?.mcpPreferences.secondary).toBe('Playwright');
    });

    it('should return configuration for security', () => {
      const config = personaManager.getPersonaConfig('security');
      
      expect(config).toBeDefined();
      expect(config?.qualityStandards).toContain('Security First');
    });

    it('should return null for invalid persona', () => {
      const config = personaManager.getPersonaConfig('invalid');
      
      expect(config).toBeNull();
    });
  });

  describe('getAllPersonas', () => {
    it('should return all 11 personas', () => {
      const personas = personaManager.getAllPersonas();
      
      expect(personas).toHaveLength(11);
      expect(personas.map(p => p.name)).toContain('architect');
      expect(personas.map(p => p.name)).toContain('frontend');
      expect(personas.map(p => p.name)).toContain('backend');
      expect(personas.map(p => p.name)).toContain('security');
      expect(personas.map(p => p.name)).toContain('analyzer');
      expect(personas.map(p => p.name)).toContain('mentor');
      expect(personas.map(p => p.name)).toContain('refactorer');
      expect(personas.map(p => p.name)).toContain('performance');
      expect(personas.map(p => p.name)).toContain('qa');
      expect(personas.map(p => p.name)).toContain('devops');
      expect(personas.map(p => p.name)).toContain('scribe');
    });
  });

  describe('cross-persona collaboration', () => {
    it('should identify complementary personas', () => {
      personaManager.activatePersona('architect');
      
      const complementary = (personaManager as any).getComplementaryPersonas('architect');
      
      expect(complementary).toContain('performance');
      expect(complementary).not.toContain('architect');
    });

    it('should suggest consulting personas', () => {
      const context: AgentContext = {
        action: 'design',
        description: 'secure API architecture',
      };
      
      const primary = personaManager.autoActivate(context);
      const consulting = (personaManager as any).getConsultingPersonas(context);
      
      expect(primary?.name).toBeDefined();
      expect(consulting).toContain('security');
    });
  });

  describe('conflict resolution', () => {
    it('should resolve persona conflicts by priority', () => {
      const context: AgentContext = {
        action: 'optimize',
        description: 'security performance',
      };
      
      // Security should win over performance for security-related optimizations
      const persona = personaManager.autoActivate(context);
      
      expect(persona?.name).toBe('security');
    });

    it('should use context for tie-breaking', () => {
      const context: AgentContext = {
        action: 'implement',
        description: 'feature',
        domain: 'frontend',
      };
      
      const persona = personaManager.autoActivate(context);
      
      expect(persona?.name).toBe('frontend');
    });
  });

  describe('performance budgets', () => {
    it('should apply frontend performance budgets', () => {
      const frontend = personaManager.getPersonaConfig('frontend');
      
      expect(frontend?.performanceBudgets).toBeDefined();
      expect(frontend?.performanceBudgets?.loadTime).toBeLessThan(3000);
      expect(frontend?.performanceBudgets?.bundleSize).toBeLessThan(500000);
    });

    it('should apply backend reliability budgets', () => {
      const backend = personaManager.getPersonaConfig('backend');
      
      expect(backend?.reliabilityBudgets).toBeDefined();
      expect(backend?.reliabilityBudgets?.uptime).toBeGreaterThan(0.999);
      expect(backend?.reliabilityBudgets?.errorRate).toBeLessThan(0.001);
    });
  });

  describe('quality metrics', () => {
    it('should track activation history', () => {
      personaManager.activatePersona('architect');
      personaManager.activatePersona('frontend');
      personaManager.activatePersona('backend');
      
      const history = (personaManager as any).activationHistory;
      
      expect(history).toHaveLength(3);
      expect(history[0]).toBe('architect');
      expect(history[2]).toBe('backend');
    });

    it('should calculate activation frequency', () => {
      personaManager.activatePersona('architect');
      personaManager.activatePersona('architect');
      personaManager.activatePersona('frontend');
      
      const frequency = (personaManager as any).getActivationFrequency();
      
      expect(frequency.architect).toBe(2);
      expect(frequency.frontend).toBe(1);
    });
  });

  describe('language support for scribe', () => {
    it('should support multiple languages', () => {
      const scribe = personaManager.getPersonaConfig('scribe');
      
      expect(scribe?.languages).toBeDefined();
      expect(scribe?.languages).toContain('en');
      expect(scribe?.languages).toContain('es');
      expect(scribe?.languages).toContain('ja');
      expect(scribe?.languages).toContain('zh');
    });

    it('should set language for scribe', () => {
      const result = personaManager.activatePersona('scribe', { language: 'es' });
      
      expect(result).toBeDefined();
      expect((personaManager as any).scribeLanguage).toBe('es');
    });
  });
});