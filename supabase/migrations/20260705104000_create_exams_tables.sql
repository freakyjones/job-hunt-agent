-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'COMPLETED')), -- NOSONAR
    score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure a user can only have one active exam at a time
CREATE UNIQUE INDEX unique_active_exam ON exams (user_id) WHERE status = 'PENDING'; -- NOSONAR

-- Create exam_questions table
CREATE TABLE IF NOT EXISTS exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exam_answers table (separate for security)
CREATE TABLE IF NOT EXISTS exam_answers (
    question_id UUID PRIMARY KEY REFERENCES exam_questions(id) ON DELETE CASCADE,
    correct_option TEXT NOT NULL,
    explanation TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exams
-- Users can read their own exams
CREATE POLICY "Users can view their own exams" 
    ON exams FOR SELECT 
    USING (auth.uid() = user_id);

-- Users can insert their own exams (with PENDING status)
CREATE POLICY "Users can insert their own exams" 
    ON exams FOR INSERT 
    WITH CHECK (auth.uid() = user_id AND status = 'PENDING'); -- NOSONAR

-- Users can update their own exams (primarily to mark COMPLETED, though Server Action usually does this)
CREATE POLICY "Users can update their own exams" 
    ON exams FOR UPDATE 
    USING (auth.uid() = user_id);

-- RLS Policies for exam_questions
-- Users can read questions for their own exams
CREATE POLICY "Users can view questions for their exams" 
    ON exam_questions FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM exams WHERE exams.id = exam_questions.exam_id AND exams.user_id = auth.uid()
    ));

-- Exam answers are NOT accessible by the authenticated user role.
-- Only the Service Role (which bypasses RLS) can access them.
-- Therefore, we don't create any policies for the 'authenticated' or 'anon' roles on exam_answers.
