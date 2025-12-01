import { BaseService } from './BaseService';
import { UserContext } from '../types/ai.types';
import { logger } from '../utils/logger';

/**
 * User Context Service
 * Manages user profile data for AI context enrichment
 */
class UserContextService extends BaseService<any> {
  constructor() {
    super('user_profiles');
  }

  /**
   * Get formatted user context for AI prompts
   */
  async getUserContext(userId: string): Promise<string> {
    try {
      const profile = await this.findById(userId);
      
      if (!profile) {
        logger.debug('No user context found', { userId });
        return '';
      }

      return this.formatContext(profile);
    } catch (error) {
      logger.error('Error loading user context', error, { userId });
      return '';
    }
  }

  /**
   * Format user profile into AI context string
   * @private
   */
  private formatContext(profile: any): string {
    const contextParts: string[] = [];

    const fieldMappings = [
      { key: 'full_name', label: 'Użytkownik' },
      { key: 'job_title', label: 'Stanowisko' },
      { key: 'department', label: 'Dział' },
      { key: 'company', label: 'Firma' },
      { key: 'company_description', label: 'O firmie' },
      { key: 'work_description', label: 'Obowiązki zawodowe' },
      { key: 'ai_context_notes', label: 'Preferencje użytkownika' },
    ];

    for (const { key, label } of fieldMappings) {
      if (profile[key]) {
        contextParts.push(`${label}: ${profile[key]}`);
      }
    }

    // Add communication preferences
    if (profile.preferences) {
      const prefs = profile.preferences;

      if (prefs.communication_tone) {
        const toneMap: Record<string, string> = {
          professional: 'profesjonalny i formalny',
          'friendly-professional': 'przyjazny ale profesjonalny',
          casual: 'swobodny i nieformalny',
          formal: 'bardzo formalny',
          friendly: 'przyjazny i ciepły',
        };
        const tone = toneMap[prefs.communication_tone] || prefs.communication_tone;
        contextParts.push(`Preferowany ton: ${tone}`);
      }

      if (prefs.language) {
        const lang = prefs.language === 'pl' ? 'Polski' : prefs.language;
        contextParts.push(`Język: ${lang}`);
      }
    }

    if (contextParts.length === 0) {
      return '';
    }

    const contextString = [
      '\n\n=== KONTEKST UŻYTKOWNIKA ===',
      ...contextParts,
      '=== KONIEC KONTEKSTU ===\n\n',
    ].join('\n');

    logger.debug('User context loaded', { 
      userId: profile.user_id,
      fieldsCount: contextParts.length 
    });
    
    return contextString;
  }
}

export default new UserContextService();
