import { Router, Response } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

// ========================================
// GET USER CONTEXT
// Pobierz pełny kontekst użytkownika dla AI
// ========================================
router.get('/', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    console.log(`📋 Fetching user context for: ${userId}`);

    // Pobierz profil użytkownika z wszystkimi polami kontekstu
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('❌ Error fetching user context:', error);
      res.status(500).json({ 
        error: 'Failed to fetch user context',
        details: error.message 
      });
      return;
    }

    if (!profile) {
      // Jeśli profil nie istnieje, stwórz pusty
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('user_profiles')
        .insert([{ 
          user_id: userId,
          preferences: {
            communication_tone: 'professional',
            language: 'pl',
            email_priority: 'high',
            auto_response: false,
            working_hours: {
              start: '09:00',
              end: '17:00',
              timezone: 'Europe/Warsaw'
            },
            notification_preferences: {
              email: true,
              daily_summary: false,
              task_reminders: true
            }
          }
        }])
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating user profile:', createError);
        res.status(500).json({ 
          error: 'Failed to create user profile',
          details: createError.message 
        });
        return;
      }

      res.status(200).json({ context: newProfile });
      return;
    }

    console.log('✅ User context fetched successfully');
    res.status(200).json({ context: profile });
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// ========================================
// UPDATE USER CONTEXT
// Aktualizuj kontekst użytkownika
// ========================================
router.put('/', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const updates = req.body;

    console.log(`📝 Updating user context for: ${userId}`);
    console.log('Updates:', JSON.stringify(updates, null, 2));

    // Walidacja - tylko dozwolone pola
    const allowedFields = [
      'full_name',
      'company',
      'job_title',
      'department',
      'work_description',
      'company_description',
      'ai_context_notes',
      'email_signature',
      'preferences'
    ];

    const filteredUpdates: any = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    // Dodaj updated_at
    filteredUpdates.updated_at = new Date().toISOString();

    // Aktualizuj profil
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update(filteredUpdates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating user context:', error);
      res.status(500).json({ 
        error: 'Failed to update user context',
        details: error.message 
      });
      return;
    }

    console.log('✅ User context updated successfully');
    res.status(200).json({ 
      message: 'User context updated successfully',
      context: data 
    });
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// ========================================
// GET AI PROMPT CONTEXT
// Pobierz sformatowany kontekst do użycia w AI prompt
// ========================================
router.get('/ai-prompt', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    console.log(`🤖 Generating AI prompt context for: ${userId}`);

    // Pobierz profil użytkownika
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !profile) {
      console.error('❌ Error fetching profile for AI context:', error);
      res.status(200).json({ 
        prompt_context: 'Użytkownik jeszcze nie skonfigurował swojego profilu.' 
      });
      return;
    }

    // Buduj sformatowany kontekst dla AI
    const contextParts: string[] = [];

    if (profile.full_name) {
      contextParts.push(`Imię i nazwisko: ${profile.full_name}`);
    }

    if (profile.job_title) {
      contextParts.push(`Stanowisko: ${profile.job_title}`);
    }

    if (profile.department) {
      contextParts.push(`Dział: ${profile.department}`);
    }

    if (profile.company) {
      contextParts.push(`Firma: ${profile.company}`);
    }

    if (profile.company_description) {
      contextParts.push(`O firmie: ${profile.company_description}`);
    }

    if (profile.work_description) {
      contextParts.push(`Obowiązki zawodowe: ${profile.work_description}`);
    }

    if (profile.ai_context_notes) {
      contextParts.push(`Dodatkowe preferencje: ${profile.ai_context_notes}`);
    }

    // Dodaj preferencje komunikacji
    if (profile.preferences) {
      const prefs = profile.preferences as any;
      
      if (prefs.communication_tone) {
        const toneMap: any = {
          'professional': 'profesjonalny i formalny',
          'friendly-professional': 'przyjazny ale profesjonalny',
          'casual': 'swobodny i nieformalny',
          'formal': 'bardzo formalny',
          'friendly': 'przyjazny i ciepły'
        };
        contextParts.push(`Preferowany ton komunikacji: ${toneMap[prefs.communication_tone] || prefs.communication_tone}`);
      }

      if (prefs.language) {
        contextParts.push(`Język: ${prefs.language === 'pl' ? 'Polski' : prefs.language}`);
      }

      if (prefs.working_hours) {
        contextParts.push(`Godziny pracy: ${prefs.working_hours.start} - ${prefs.working_hours.end} (${prefs.working_hours.timezone})`);
      }
    }

    const promptContext = contextParts.length > 0
      ? `KONTEKST UŻYTKOWNIKA:\n${contextParts.join('\n')}`
      : 'Użytkownik jeszcze nie uzupełnił swojego profilu.';

    console.log('✅ AI prompt context generated');
    res.status(200).json({ 
      prompt_context: promptContext,
      has_context: contextParts.length > 0,
      fields_filled: contextParts.length
    });
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// ========================================
// RESET USER CONTEXT
// Resetuj kontekst do wartości domyślnych
// ========================================
router.post('/reset', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    console.log(`🔄 Resetting user context for: ${userId}`);

    const defaultContext = {
      job_title: null,
      work_description: null,
      company_description: null,
      department: null,
      ai_context_notes: null,
      email_signature: null,
      preferences: {
        communication_tone: 'professional',
        language: 'pl',
        email_priority: 'high',
        auto_response: false,
        working_hours: {
          start: '09:00',
          end: '17:00',
          timezone: 'Europe/Warsaw'
        },
        notification_preferences: {
          email: true,
          daily_summary: false,
          task_reminders: true
        }
      },
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .update(defaultContext)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error resetting user context:', error);
      res.status(500).json({ 
        error: 'Failed to reset user context',
        details: error.message 
      });
      return;
    }

    console.log('✅ User context reset successfully');
    res.status(200).json({ 
      message: 'User context reset to defaults',
      context: data 
    });
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

export default router;
