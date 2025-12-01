import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../config/supabase';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Base Service
 * Provides common CRUD operations and utilities
 */
export abstract class BaseService<T = any> {
  protected supabase: SupabaseClient;
  protected tableName: string;

  constructor(tableName: string) {
    this.supabase = supabaseAdmin;
    this.tableName = tableName;
  }

  /**
   * Find record by ID
   * @throws {NotFoundError} if record not found
   */
  async findById(id: string, columns: string = '*'): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(columns)
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundError(this.tableName);
    }

    return data as T;
  }

  /**
   * Find all records with optional filtering
   */
  async findAll(options: {
    userId?: string;
    columns?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
  } = {}): Promise<T[]> {
    const {
      userId,
      columns = '*',
      limit = 100,
      offset = 0,
      orderBy = 'created_at',
      orderDirection = 'desc',
    } = options;

    let query = this.supabase
      .from(this.tableName)
      .select(columns)
      .range(offset, offset + limit - 1)
      .order(orderBy, { ascending: orderDirection === 'asc' });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error(`Error fetching from ${this.tableName}`, error);
      return [];
    }

    return (data as T[]) || [];
  }

  /**
   * Create new record
   */
  async create(record: Partial<T>): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(record as any)
      .select()
      .single();

    if (error) {
      logger.error(`Error creating ${this.tableName}`, error, { record });
      throw new ValidationError(error.message);
    }

    return data as T;
  }

  /**
   * Update record by ID
   */
  async update(id: string, updates: Partial<T>): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error(`Error updating ${this.tableName}`, error, { id, updates });
      throw new ValidationError(error.message);
    }

    if (!data) {
      throw new NotFoundError(this.tableName);
    }

    return data as T;
  }

  /**
   * Delete record by ID
   */
  async delete(id: string, userId?: string): Promise<void> {
    let query = this.supabase.from(this.tableName).delete().eq('id', id);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) {
      logger.error(`Error deleting from ${this.tableName}`, error, { id, userId });
      throw new ValidationError(error.message);
    }
  }

  /**
   * Count records
   */
  async count(userId?: string): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { count, error } = await query;

    if (error) {
      logger.error(`Error counting ${this.tableName}`, error, { userId });
      return 0;
    }

    return count || 0;
  }

  /**
   * Check if record exists
   */
  async exists(id: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('id')
      .eq('id', id)
      .single();

    return !error && !!data;
  }
}
