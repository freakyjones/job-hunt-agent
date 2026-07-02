'use server';

import { createClient } from '@/utils/supabase/server';
import { BaseResume } from '@job-hunt/types';
import pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';

export async function getBaseResume(): Promise<{ data: BaseResume | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('base_resumes')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "No rows found"
      return { data: null, error: error.message };
    }

    return { data: data || null, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function uploadBaseResume(
  formData: FormData
): Promise<{ data: BaseResume | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: 'Not authenticated' };
    }

    const file = formData.get('file') as File | null;
    if (!file) {
      return { data: null, error: 'No file provided' };
    }

    // Check size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { data: null, error: 'File exceeds 5MB limit' };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let extractedContent = '';

    // Extract text based on file type
    if (file.type === 'application/pdf') {
      const parsed = await pdfParse(buffer);
      extractedContent = parsed.text;
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer });
      extractedContent = result.value;
    } else if (
      file.type === 'text/plain' ||
      file.type === 'text/markdown' ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md')
    ) {
      extractedContent = buffer.toString('utf-8');
    } else {
      return { data: null, error: 'Unsupported file type' };
    }

    if (!extractedContent || extractedContent.trim() === '') {
      return { data: null, error: 'Could not extract text from the file' };
    }

    // Upload file to storage
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { error: storageError } = await supabase.storage
      .from('base_resumes')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (storageError) {
      return { data: null, error: `Storage error: ${storageError.message}` };
    }

    // Upsert database record
    const { data: record, error: dbError } = await supabase
      .from('base_resumes')
      .upsert(
        {
          user_id: user.id,
          file_url: filePath,
          extracted_content: extractedContent,
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (dbError) {
      return { data: null, error: `Database error: ${dbError.message}` };
    }

    return { data: record, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function updateTargetRoles(roles: string[]): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Not authenticated' };
    }

    const { error: dbError } = await supabase
      .from('base_resumes')
      .update({ target_roles: roles })
      .eq('user_id', user.id);

    if (dbError) {
      return { error: `Database error: ${dbError.message}` };
    }

    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
