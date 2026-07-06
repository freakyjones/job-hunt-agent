import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

test.describe('Exams UX Improvements', () => {
  let testUserId = '';
  let testUserEmail = '';
  let testJobId = '';

  test.beforeAll(async () => {
    testUserEmail = `e2e_test_${Date.now()}@example.com`;
    // Setup test user
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email: testUserEmail,
      password: 'password123',
      email_confirm: true,
    });
    if (userError || !user.user) throw new Error('Test setup failed: User creation');
    testUserId = user.user.id;

    // Setup dummy job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        company: 'Test Corp',
        role: 'Test Engineer',
        user_id: testUserId,
        status: 'APPLIED',
      })
      .select()
      .single();
    if (jobError) throw new Error('Test setup failed: Job creation');
    testJobId = job.id;
  });

  test.afterAll(async () => {
    // Cleanup
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', testUserEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('Scenario A: Generate Exam Queue Flow', async ({ page }) => {
    await page.goto('/exams');

    // User clicks Generate Exam (assuming there's a trigger for this specific job)
    // For simplicity, we might just intercept the API or click a generic generate button
    const generateBtn = page.getByRole('button', { name: /Generate Exam/i }).first();
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
    }

    // Assert Processing State
    await expect(page.locator('.processingWrapper')).toBeVisible({ timeout: 15000 });

    // Simulate Edge Function Completion
    const { data: jobQueue } = await supabase
      .from('exam_generation_jobs')
      .select('id')
      .eq('user_id', testUserId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (jobQueue) {
      // Create actual exam
      const { data: exam } = await supabase
        .from('exams')
        .insert({
          user_id: testUserId,
          job_id: testJobId,
          status: 'PENDING',
        })
        .select()
        .single();

      if (exam) {
        await supabase
          .from('exam_generation_jobs')
          .update({ status: 'completed', exam_id: exam.id })
          .eq('id', jobQueue.id);
      }
    }

    // Assert Ready State dynamically via realtime
    await expect(page.getByRole('button', { name: /Take Exam/i })).toBeVisible({ timeout: 15000 });
  });

  test('Scenario B: Exam Submission & Grading', async ({ page }) => {
    // Seed PENDING exam with questions
    const { data: exam } = await supabase
      .from('exams')
      .insert({
        user_id: testUserId,
        job_id: testJobId,
        status: 'PENDING',
      })
      .select()
      .single();

    if (!exam) throw new Error('Failed to seed exam');

    const { data: question } = await supabase
      .from('exam_questions')
      .insert({
        exam_id: exam.id,
        question_text: 'What is 2+2?',
        options: ['3', '4', '5'],
      })
      .select()
      .single();

    if (question) {
      await supabase.from('exam_answers').insert({
        question_id: question.id,
        correct_option: '4',
        explanation: 'Math',
      });
    }

    await page.goto(`/exams/${exam.id}`);

    // Fill out form
    await page.getByLabel('4').check();
    await page.getByRole('button', { name: /Submit/i }).click();

    // Verify success alert
    await expect(page.getByRole('alert').filter({ hasText: 'Success' })).toBeVisible({
      timeout: 15000,
    });

    // Verify completed state
    await expect(page.getByText(/Review Results/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Score:/i)).toBeVisible();

    // Verify DB
    const { data: dbExam } = await supabase
      .from('exams')
      .select('status, score')
      .eq('id', exam.id)
      .single();

    expect(dbExam?.status).toBe('COMPLETED');
    expect(dbExam?.score).toBe(100);
  });

  test('Scenario C: Prevent Duplicate Pending Exams', async ({ page }) => {
    // Seed PENDING exam
    await supabase.from('exams').insert({
      user_id: testUserId,
      job_id: testJobId,
      status: 'PENDING',
    });

    await page.goto('/exams');
    const generateBtn = page.getByRole('button', { name: /Generate Exam/i }).first();

    if (await generateBtn.isVisible()) {
      await generateBtn.click();
    }

    // Expect error
    await expect(
      page.getByRole('alert').filter({ hasText: 'already have a pending exam' })
    ).toBeVisible({ timeout: 15000 });
  });
});
