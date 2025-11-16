import { Router, Response } from 'express';
import { authenticateUser, AuthenticatedRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

// ========================================
// GET ALL NOTIFICATIONS
// Pobierz wszystkie powiadomienia użytkownika
// ========================================
router.get('/', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { limit = 50, offset = 0, unread_only } = req.query;

    console.log(`📬 Fetching notifications for user: ${userId}`);

    let query = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    // Filtruj tylko nieprzeczytane jeśli requested
    if (unread_only === 'true') {
      query = query.eq('read', false);
    }

    const { data: notifications, error, count } = await query;

    if (error) {
      console.error('❌ Error fetching notifications:', error);
      res.status(500).json({ 
        error: 'Failed to fetch notifications',
        details: error.message 
      });
      return;
    }

    // Policz nieprzeczytane
    const { count: unreadCount } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    console.log(`✅ Found ${notifications?.length || 0} notifications (${unreadCount} unread)`);
    
    res.status(200).json({ 
      notifications: notifications || [],
      unread_count: unreadCount || 0,
      total: count || 0
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
// GET UNREAD COUNT
// Szybkie pobranie liczby nieprzeczytanych
// ========================================
router.get('/unread-count', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const { count } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    res.status(200).json({ unread_count: count || 0 });
  } catch (error: any) {
    console.error('❌ Error getting unread count:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// ========================================
// MARK AS READ
// Oznacz powiadomienie jako przeczytane
// ========================================
router.patch('/:id/read', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    console.log(`📖 Marking notification ${id} as read for user: ${userId}`);

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ 
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error marking as read:', error);
      res.status(500).json({ 
        error: 'Failed to mark notification as read',
        details: error.message 
      });
      return;
    }

    if (!data) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    console.log('✅ Notification marked as read');
    res.status(200).json({ 
      message: 'Notification marked as read',
      notification: data 
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
// MARK ALL AS READ
// Oznacz wszystkie jako przeczytane
// ========================================
router.post('/mark-all-read', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    console.log(`📖 Marking all notifications as read for user: ${userId}`);

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ 
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('❌ Error marking all as read:', error);
      res.status(500).json({ 
        error: 'Failed to mark all as read',
        details: error.message 
      });
      return;
    }

    console.log('✅ All notifications marked as read');
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// ========================================
// DELETE NOTIFICATION
// Usuń powiadomienie
// ========================================
router.delete('/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    console.log(`🗑️ Deleting notification ${id} for user: ${userId}`);

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Error deleting notification:', error);
      res.status(500).json({ 
        error: 'Failed to delete notification',
        details: error.message 
      });
      return;
    }

    console.log('✅ Notification deleted');
    res.status(200).json({ message: 'Notification deleted' });
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// ========================================
// DELETE ALL READ
// Usuń wszystkie przeczytane powiadomienia
// ========================================
router.delete('/read/all', authenticateUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    console.log(`🗑️ Deleting all read notifications for user: ${userId}`);

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('read', true);

    if (error) {
      console.error('❌ Error deleting read notifications:', error);
      res.status(500).json({ 
        error: 'Failed to delete notifications',
        details: error.message 
      });
      return;
    }

    console.log('✅ All read notifications deleted');
    res.status(200).json({ message: 'All read notifications deleted' });
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// ========================================
// CREATE NOTIFICATION (helper dla innych routes)
// Funkcja pomocnicza do tworzenia powiadomień
// ========================================
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  metadata: any = {}
): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        metadata,
        read: false
      });

    if (error) {
      console.error('❌ Error creating notification:', error);
      return;
    }

    console.log(`✅ Notification created: ${title}`);
  } catch (error) {
    console.error('❌ Failed to create notification:', error);
  }
}

export default router;
