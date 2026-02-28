/**
 * survey-engine.ts – CosmoMosaic Diagnostic Survey Engine
 *
 * Each subject gets exactly 3 questions: one easy, one medium, one hard.
 * This determines the player's proficiency per subject on first login.
 * The survey only runs ONCE – subsequent logins skip it entirely.
 */

import {
    type SurveyQuestion,
    SURVEY_SUBJECTS,
    getQuestionsByDifficulty,
} from "./survey-questions";

export interface SurveyResponse {
    questionId: string;
    subject: string;
    difficulty: "easy" | "medium" | "hard";
    selectedAnswer: number;
    isCorrect: boolean;
}

export interface SubjectProficiency {
    subject: string;
    estimatedGrade: number;
    masteryScore: number; // 0-100
    correctCount: number;
    totalCount: number;
    level: "beginner" | "intermediate" | "advanced";
}

export interface SurveyResult {
    proficiencies: SubjectProficiency[];
    estimatedGrade: number;
    totalCorrect: number;
    totalQuestions: number;
}

/* ─── Constants ─── */
const QUESTIONS_PER_SUBJECT = 3; // easy + medium + hard
const DIFFICULTY_ORDER: ("easy" | "medium" | "hard")[] = ["easy", "medium", "hard"];

/* ─── Question selection ─── */

/**
 * Get the next question for a subject.
 * Follows fixed order: easy → medium → hard (3 questions total per subject).
 * Returns null if the subject is complete.
 */
export function getNextQuestion(
    subject: string,
    responses: SurveyResponse[]
): SurveyQuestion | null {
    const subjectResponses = responses.filter(r => r.subject === subject);

    // After 3 questions per subject, we're done
    if (subjectResponses.length >= QUESTIONS_PER_SUBJECT) return null;

    // Determine which difficulty to ask next (easy → medium → hard)
    const nextDifficulty = DIFFICULTY_ORDER[subjectResponses.length];

    // Get available questions at this difficulty
    const availableQuestions = getQuestionsByDifficulty(subject, nextDifficulty);

    // Filter out already-answered questions
    const answeredIds = new Set(subjectResponses.map(r => r.questionId));
    const unanswered = availableQuestions.filter(q => !answeredIds.has(q.id));

    if (unanswered.length === 0) return null;

    // Return a random question from available pool
    return unanswered[Math.floor(Math.random() * unanswered.length)];
}

/**
 * Get the next subject to ask about.
 * Cycles through subjects that still have questions remaining.
 */
export function getNextSubject(responses: SurveyResponse[]): string | null {
    for (const subject of SURVEY_SUBJECTS) {
        const subjectResponses = responses.filter(r => r.subject === subject);
        if (subjectResponses.length < QUESTIONS_PER_SUBJECT) {
            return subject;
        }
    }
    return null; // All subjects complete
}

/**
 * Check if the survey is complete (all subjects have 3 questions answered).
 */
export function isSurveyComplete(responses: SurveyResponse[]): boolean {
    return SURVEY_SUBJECTS.every(subject => {
        const count = responses.filter(r => r.subject === subject).length;
        return count >= QUESTIONS_PER_SUBJECT;
    });
}

/* ─── Proficiency calculation ─── */

function calculateSubjectProficiency(
    subject: string,
    responses: SurveyResponse[]
): SubjectProficiency {
    const subjectResponses = responses.filter(r => r.subject === subject);
    const correctCount = subjectResponses.filter(r => r.isCorrect).length;
    const totalCount = subjectResponses.length;

    // Calculate mastery score (0-100) based on difficulty and correctness
    // easy=1pt, medium=2pt, hard=3pt → max 6 points
    let masteryPoints = 0;
    let maxPoints = 0;

    for (const r of subjectResponses) {
        const difficultyWeight = r.difficulty === "easy" ? 1 : r.difficulty === "medium" ? 2 : 3;
        maxPoints += difficultyWeight * 100;
        if (r.isCorrect) {
            masteryPoints += difficultyWeight * 100;
        }
    }

    const masteryScore = maxPoints > 0 ? Math.round((masteryPoints / maxPoints) * 100) : 50;

    // Estimate grade level based on which difficulties were answered correctly
    let estimatedGrade: number;
    const easyCorrect = subjectResponses.some(r => r.difficulty === "easy" && r.isCorrect);
    const mediumCorrect = subjectResponses.some(r => r.difficulty === "medium" && r.isCorrect);
    const hardCorrect = subjectResponses.some(r => r.difficulty === "hard" && r.isCorrect);

    if (hardCorrect && mediumCorrect && easyCorrect) {
        estimatedGrade = 5; // All correct → advanced
    } else if (hardCorrect && (mediumCorrect || easyCorrect)) {
        estimatedGrade = 4;
    } else if (mediumCorrect && easyCorrect) {
        estimatedGrade = 3;
    } else if (easyCorrect || mediumCorrect) {
        estimatedGrade = 2;
    } else {
        estimatedGrade = 1; // None correct → beginner
    }

    // Determine level label
    let level: "beginner" | "intermediate" | "advanced";
    if (correctCount >= 3) level = "advanced";
    else if (correctCount >= 2) level = "intermediate";
    else level = "beginner";

    return {
        subject,
        estimatedGrade,
        masteryScore,
        correctCount,
        totalCount,
        level,
    };
}

/**
 * Calculate full survey results from all responses.
 */
export function calculateSurveyResults(responses: SurveyResponse[]): SurveyResult {
    const proficiencies = SURVEY_SUBJECTS.map(subject =>
        calculateSubjectProficiency(subject, responses)
    );

    const totalCorrect = responses.filter(r => r.isCorrect).length;
    const totalQuestions = responses.length;

    // Overall estimated grade = weighted average of subject grades
    const avgGrade = proficiencies.reduce((sum, p) => sum + p.estimatedGrade, 0) / proficiencies.length;
    const estimatedGrade = Math.round(avgGrade);

    return {
        proficiencies,
        estimatedGrade: Math.max(1, Math.min(5, estimatedGrade)),
        totalCorrect,
        totalQuestions,
    };
}

/**
 * Get the total number of questions in the survey.
 * 5 subjects × 3 questions (easy + medium + hard) = 15 questions
 */
export function getTotalSurveyQuestions(): number {
    return SURVEY_SUBJECTS.length * QUESTIONS_PER_SUBJECT;
}
