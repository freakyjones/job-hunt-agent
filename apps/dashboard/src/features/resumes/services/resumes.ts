import { createClient } from '@/utils/supabase/server';
import { GeneratedResume } from '@job-hunt/types';

export async function getResumes(): Promise<GeneratedResume[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('generated_resumes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        throw new Error(error.message);
    }

    return data as GeneratedResume[];
}
