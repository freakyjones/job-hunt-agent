import { createClient } from '@/utils/supabase/server';
import { Job, JobStatusEnum } from '@job-hunt/types';

export async function getJobs(): Promise<Job[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('score', { ascending: false, nullsFirst: false })
        .limit(100);

    if (error) {
        throw new Error(error.message);
    }

    return data as Job[];
}

export async function updateJobStatus(id: string, newStatusStr: string): Promise<void> {
    const newStatus = JobStatusEnum.parse(newStatusStr);
    const supabase = await createClient();
    
    const { error } = await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', id);

    if (error) {
        throw new Error(error.message);
    }
}
