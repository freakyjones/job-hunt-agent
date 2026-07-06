'use client';

import React, { useState } from 'react';
import { ExamQuestion } from '@job-hunt/types';
import { submitExamAction } from '../actions';
import { toast } from 'react-hot-toast';
import styles from './TakeExamForm.module.css';

interface TakeExamFormProps {
  examId: string;
  questions: ExamQuestion[];
  initialFeedback?: Record<
    string,
    { correct: boolean; correct_option: string; explanation: string }
  >;
  initialScore?: number | null;
}

export function TakeExamForm({
  examId,
  questions,
  initialFeedback = undefined,
  initialScore = null,
}: TakeExamFormProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // feedback is populated after submission or passed initially for completed exams
  const [feedback, setFeedback] = useState<Record<
    string,
    { correct: boolean; correct_option: string; explanation: string }
  > | null>(initialFeedback || null);
  const [finalScore, setFinalScore] = useState<number | null>(initialScore);

  const handleOptionChange = (questionId: string, option: string) => {
    if (feedback) return; // Prevent changing after submit
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if all questions are answered
    if (Object.keys(answers).length !== questions.length) {
      toast.error('Please answer all questions before submitting.');
      return;
    }

    setIsSubmitting(true);

    const payload = Object.entries(answers).map(([question_id, selected_option]) => ({
      question_id,
      selected_option,
    }));

    try {
      const result = await submitExamAction(examId, payload);

      if (!result.success) {
        toast.error(result.error || 'Failed to submit exam');
        return;
      }

      setFinalScore(result.score ?? 0);
      if (result.feedback) {
        setFeedback(result.feedback);
      }
      toast.success('Exam submitted successfully!');
    } catch (err) {
      console.error(err);
      toast.error('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {finalScore !== null && (
        <div className={styles.scoreBanner}>
          <h2>Assessment Complete</h2>
          <div className={styles.scoreDisplay}>
            <span className={styles.scoreValue}>{finalScore}%</span>
            <span className={styles.scoreText}>Final Score</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {questions.map((q, index) => {
          const qFeedback = feedback?.[q.id];
          const selectedOption = answers[q.id];

          let containerClass = styles.questionContainer;
          if (qFeedback) {
            containerClass += qFeedback.correct
              ? ` ${styles.correctQuestion}`
              : ` ${styles.incorrectQuestion}`;
          }

          return (
            <div key={q.id} className={containerClass}>
              <h3 className={styles.questionText}>
                <span className={styles.questionNumber}>{index + 1}.</span> {q.question_text}
              </h3>

              <div className={styles.optionsList}>
                {q.options.map((option, optIdx) => {
                  const isSelected = selectedOption === option;
                  const isCorrect = qFeedback?.correct_option === option;
                  const isWrongSelection = qFeedback && isSelected && !isCorrect;

                  let optionClass = styles.optionLabel;
                  if (qFeedback) {
                    if (isCorrect) optionClass += ` ${styles.optionCorrect}`;
                    if (isWrongSelection) optionClass += ` ${styles.optionIncorrect}`;
                    if (isSelected && !isWrongSelection && !isCorrect)
                      optionClass += ` ${styles.optionSelected}`; // Should not happen if feedback is present
                  } else if (isSelected) {
                    optionClass += ` ${styles.optionSelected}`;
                  }

                  return (
                    <label key={optIdx} className={optionClass}>
                      <input
                        type="radio"
                        name={q.id}
                        value={option}
                        checked={isSelected}
                        onChange={() => handleOptionChange(q.id, option)}
                        disabled={!!feedback || isSubmitting}
                        className={styles.radioInput}
                      />
                      <span className={styles.optionText}>{option}</span>
                    </label>
                  );
                })}
              </div>

              {qFeedback && (
                <div className={styles.feedbackBox}>
                  <strong>Explanation:</strong> {qFeedback.explanation}
                </div>
              )}
            </div>
          );
        })}

        {!feedback && (
          <div className={styles.submitWrapper}>
            <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
