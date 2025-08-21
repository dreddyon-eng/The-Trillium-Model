/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  MessageSquare,
  ClipboardList,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  List
} from 'lucide-react';
import { marked } from 'marked';
import { generateSummary, answerQuestion, generateQuiz } from './services/geminiService';
import type { QuizQuestion } from './types';


// The full content of the Trillium Model report, formatted as a JavaScript string.
const reportContent = `
# Andre Smith's Trillium Model: A Comprehensive Exploration

## Abstract

This report provides a comprehensive exploration of The Trillium Model, a theoretical hypothesis proposed by Andre Smith, a theoretical physicist. The model presents a sophisticated framework for understanding how consciousness and reality are inextricably linked. It defines reality not as a static, external environment but as a dynamic, self-referential process that is actively co-created through the interplay of an individual’s mental, physical, emotional, and visual faculties. By establishing a clear, multi-layered scale of existence, the model offers profound insights into personal agency, the nature of time, and the psychological mechanisms by which a person's inner state manifests their external reality.

## I. The Core Framework: A Scale of Existence

Andre Smith conceptualizes his model as an elegant numerical scale—with **-1** representing the past, **0** for the present, and **+1** for the future. This scale is not a measure of distance, but a hierarchy of influence and agency that underpins the constant process of creation.

* **The Reflective Wave (-1): The Repository of Truth and Obstacles.** The Reflective Wave is more than a simple record of history; it is a repository of learned experiences and a living memory of every detail, including the obstacles encountered. As Andre Smith explains with his fan and backscratcher analogies, the past holds the precise knowledge of what went right and, more importantly, what went wrong. This truth, embedded in an individual's physical, emotional, and visual memory, is a resource that can be consciously accessed in the present to inform their choices and avoid future pitfalls. This is the **subconscious mind**, a vast reservoir of past data that constantly flows into the present.

* **The Consciousness Filter (0): The Crucible of the Now.** The "now," represented by the **0**, is the critical core of the model and the sole point where creation and decision-making occur. It is the mental crucible where a person can mentally and emotionally "try out" future possibilities before they are physically manifested. This is a profound psychological concept—the mind is a simulator. As illustrated by the example of rearranging a living room, a person uses their mental, visual, physical, and emotional faculties to navigate the Probabilistic Landscape, running through scenarios and potential problems in their mind, all from the vantage point of the present. This is the **conscious mind**, the active agent in the process of creation.

* **The Probabilistic Landscape (+1): The Unfolding of Potential.** The **+1** is the realm of pure potentiality, a canvas of endless possibilities. Andre Smith's insight is that this landscape is not a static list of futures, but a space a person actively engages with from the **0**. One "looks forward, ahead of that zero," using imagination and foresight to pre-experience outcomes. The truth of the future is not what is fated, but what is chosen and manifested from the current moment. This is the realm where a person's inner work becomes outer reality.

## II. The Encompassing Elements: The Unified Field of Consciousness

The dynamic interplay of the Trillium Model's core components is housed within a larger, unified field of consciousness, defined by three key elements:

* **The Square: The Four Pillars of Embodied Reality.** The Square is a conceptual element that surrounds the entire Trillium Model, and its four corners represent the fundamental, integrated dimensions of human experience: **Visual, Physical, Emotional, and Mental**. This is not about external societal pressures or beliefs. It is a profound acknowledgment that a person’s inner world is constructed from these four intrinsic components. The Square acts as a unified container for a person’s entire embodied reality, asserting that to truly understand consciousness, we must see it not as a disembodied mental event, but as an inseparable synthesis of how we see, feel, think, and exist physically.

* **The Sphere & The Circle: The Point and The Process.** At the center of this unified field is **The Sphere**, the singular, non-divisible point of the "eternal now." This is the precise intersection where the past and future converge, all processed through the Consciousness Filter. The Sphere is the point of ultimate truth and agency, as it is the only moment where real change can be initiated. The entire process is then unified by **The Circle**, a continuous, integrated feedback loop. This circular dynamic shows how past, present, and future are not separate, but are in constant, fluid interaction, underscoring the holistic truth that our mental, physical, emotional, and visual aspects are seamlessly unified within one overarching process.

## III. The Psychological and Philosophical Interconnection

The most profound philosophical truth within Andre Smith's theoretical hypothesis is that individuals are the architects of their own reality.

* **The Paradox of Creation.** Andre Smith highlights a powerful psychological paradox: the very act of fearing a negative outcome and dwelling on what a person *doesn't* want to happen is a creative act. By giving their mental, emotional, and visual energy to the "opposite" of what they desire, they are effectively and often unconsciously creating that very reality. This concept directly challenges the notion of "free will" as a random, unguided force. Instead, it suggests that expectations and thoughts, whether conscious or unconscious, are the primary determinants of one's future. As he explains, a person who thinks about a past failure and says, "that ain't going to work, so I'm not going to do it," is actively creating the failure they fear.

* **Personal Agency and Conscious Overriding.** The key to personal agency, as he articulates, is the conscious use of the Consciousness Filter (**0**). The solution is to deliberately shift focus from what didn't work previously to what *must* work this time. This isn't just positive thinking; it's a deliberate psychological act of overriding a past, negative memory with a new, intentional probability. By mentally rehearsing positive outcomes and acknowledging the obstacles from the Reflective Wave, a person can make a conscious decision to choose a new path. This process is not about denying the past but learning from it to inform a more intentional present and a more desirable future.

## Conclusion

In this way, Andre Smith’s theoretical hypothesis is not a theory to be passively understood, but a guide for active participation in the creation of reality. It reveals the constant, dynamic, and intricate dance between a person's past experiences, their present thoughts, and their future possibilities, all grounded in the truth of their embodied experience. By consciously engaging with the various components of The Trillium Model, an individual can gain profound self-awareness and leverage their innate creative power to become the architect of their own life.
`;

// Function to parse the report into sections for easier navigation and processing
const parseSections = (text: string) => {
  const sections: {title: string, content: string}[] = [];
  const lines = text.split('\n');
  let currentSection = { title: 'Abstract', content: '' };

  const abstractContent = text.substring(text.indexOf('## Abstract'), text.indexOf("## I. The Core Framework"));
  sections.push({title: 'Abstract', content: abstractContent.replace('## Abstract', '').trim()});

  for (const line of lines) {
    if (line.trim().startsWith('##')) {
      if (currentSection.content.trim().length > 0 && currentSection.title !== 'Abstract') {
        sections.push({ ...currentSection, content: currentSection.content.trim() });
      }
      currentSection = {
        title: line.trim().replace(/^## /, ''),
        content: ''
      };
    } else {
      currentSection.content += line + '\n';
    }
  }

  if (currentSection.content.trim().length > 0) {
    sections.push({ ...currentSection, content: currentSection.content.trim() });
  }

  return sections;
};

// Component for displaying the full report
const FullReport: React.FC<{ content: string; searchTerm: string }> = ({ content, searchTerm }) => {
  const highlight = (text: string) => {
    if (!searchTerm) {
      return { __html: marked(text) };
    }
    const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
    const highlightedHtml = marked(text).replace(regex, `<span class="bg-yellow-300 font-bold">$1</span>`);
    return { __html: highlightedHtml };
  };

  return (
    <div className="prose prose-lg mx-auto p-4 md:p-8">
      <div dangerouslySetInnerHTML={highlight(content)} />
    </div>
  );
};

// Component for generating and displaying summaries
const Summaries: React.FC<{ sections: {title: string, content: string}[] }> = ({ sections }) => {
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  // Generates a summary for a given section using the Gemini API
  const callGenerateSummary = async (sectionTitle: string, sectionContent: string) => {
    setLoading(prev => ({ ...prev, [sectionTitle]: true }));
    try {
        const summaryText = await generateSummary(sectionTitle, sectionContent);
        setSummaries(prev => ({ ...prev, [sectionTitle]: summaryText }));
    } catch (error) {
        console.error('Error generating summary:', error);
        setSummaries(prev => ({ ...prev, [sectionTitle]: 'Failed to generate summary.' }));
    } finally {
        setLoading(prev => ({ ...prev, [sectionTitle]: false }));
    }
  };

  useEffect(() => {
    const currentSection = sections[currentSectionIndex];
    if (currentSection && !summaries[currentSection.title] && !loading[currentSection.title]) {
      callGenerateSummary(currentSection.title, currentSection.content);
    }
  }, [currentSectionIndex, sections, summaries, loading]);

  const handleNext = () => {
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  const currentSection = sections[currentSectionIndex];
  const currentSummary = summaries[currentSection?.title];

  return (
    <div className="p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-gray-50 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Section Summaries</h2>
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={handlePrev}
            disabled={currentSectionIndex === 0 || loading[currentSection?.title]}
            className="p-2 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors disabled:opacity-50"
            aria-label="Previous section"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="text-xl font-bold text-slate-700 text-center flex-1 mx-2">
            {currentSection?.title}
          </div>
          <button
            onClick={handleNext}
            disabled={currentSectionIndex === sections.length - 1 || loading[currentSection?.title]}
            className="p-2 rounded-full bg-slate-200 hover:bg-slate-300 transition-colors disabled:opacity-50"
            aria-label="Next section"
          >
            <ChevronRight size={24} />
          </button>
        </div>
        <div className="min-h-[150px] flex items-center justify-center p-4">
          {loading[currentSection?.title] ? (
            <div className="flex flex-col items-center">
              <Loader2 className="animate-spin text-slate-500 mb-2" size={32} />
              <p className="text-slate-500">Generating summary...</p>
            </div>
          ) : (
            <p className="text-gray-700 text-base leading-relaxed">
              {currentSummary}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Component for a Q&A chat
const QnA: React.FC<{ reportText: string }> = ({ reportText }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  // Handles the Q&A logic by calling the Gemini API
  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer('');
    try {
        const answerText = await answerQuestion(reportText, question);
        setAnswer(answerText);
    } catch (error) {
        console.error('Error answering question:', error);
        setAnswer('Failed to get an answer. Please try again.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-gray-50 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Ask a Question</h2>
        <textarea
          className="w-full p-3 mb-4 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={4}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about the Trillium Model..."
          disabled={loading}
        />
        <button
          onClick={handleAsk}
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          disabled={loading || !question.trim()}
        >
          {loading ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            'Get Answer'
          )}
        </button>
        {answer && (
          <div className="mt-6 p-4 bg-white border border-slate-200 rounded-md">
            <h3 className="text-lg font-medium text-gray-800">Answer:</h3>
            <p className="mt-2 text-gray-700 text-base">{answer}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Component for a Quiz
const Quiz: React.FC<{ reportText: string }> = ({ reportText }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  // Generates a multiple-choice quiz using the Gemini API
  const callGenerateQuiz = async () => {
    setLoading(true);
    setQuestions([]);
    setUserAnswers({});
    setShowResults(false);

    try {
        const quizData = await generateQuiz(reportText);
        if (quizData && quizData.quiz) {
            setQuestions(quizData.quiz);
        } else {
            throw new Error('Invalid quiz data format.');
        }
    } catch (error: any) {
        console.error('Error generating quiz:', error);
        alert(`Failed to generate quiz: ${error.message}`);
    } finally {
        setLoading(false);
    }
  };

  const handleOptionSelect = (questionIndex: number, option: string) => {
    setUserAnswers({ ...userAnswers, [questionIndex]: option });
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, index) => {
      if (userAnswers[index] === q.correctAnswer) {
        score++;
      }
    });
    return score;
  };

  return (
    <div className="p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-gray-50 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Quiz</h2>
        <div className="text-center mb-4">
          <button
            onClick={callGenerateQuiz}
            className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center mx-auto"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin mr-2" />
                Generating Quiz...
              </>
            ) : (
              'Start New Quiz'
            )}
          </button>
        </div>

        {questions.length > 0 && !showResults && (
          <div className="mt-4">
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="mb-6 p-4 border border-slate-200 rounded-md bg-white shadow-sm">
                <p className="font-semibold text-gray-800 text-lg mb-3">{`${qIndex + 1}. ${q.question}`}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((option, oIndex) => (
                    <button
                      key={oIndex}
                      onClick={() => handleOptionSelect(qIndex, option)}
                      className={`
                        w-full text-left p-3 border-2 rounded-md transition-colors
                        ${userAnswers[qIndex] === option
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-800 border-gray-300 hover:bg-slate-100'
                        }
                      `}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="text-center mt-6">
              <button
                onClick={() => setShowResults(true)}
                className="bg-green-600 text-white font-semibold py-3 px-8 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                disabled={Object.keys(userAnswers).length < questions.length}
              >
                Submit Answers
              </button>
            </div>
          </div>
        )}

        {showResults && (
          <div className="mt-4 text-center">
            <h3 className="text-2xl font-bold text-gray-800">Your Score: {calculateScore()} / {questions.length}</h3>
            <p className="text-lg text-gray-600 mt-2">Review your answers below:</p>
            <div className="mt-6">
              {questions.map((q, qIndex) => (
                <div key={qIndex} className="mb-6 p-4 border border-slate-200 rounded-md bg-white shadow-sm text-left">
                  <p className="font-semibold text-gray-800 text-lg mb-2">{`${qIndex + 1}. ${q.question}`}</p>
                  <p className="text-gray-600 mb-2">
                    Your Answer: <span className={userAnswers[qIndex] === q.correctAnswer ? 'font-bold text-green-600' : 'font-bold text-red-600'}>{userAnswers[qIndex] || 'No answer'}</span>
                  </p>
                  {userAnswers[qIndex] !== q.correctAnswer && <p className="text-gray-600">
                    Correct Answer: <span className="font-bold text-green-600">{q.correctAnswer}</span>
                  </p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main App component
export default function App() {
  const [view, setView] = useState('home');
  const [searchTerm, setSearchTerm] = useState('');
  const sections = parseSections(reportContent);

  const renderContent = () => {
    switch (view) {
      case 'home':
        return (
          <>
            <div className="p-8 text-center bg-white shadow-sm mb-4">
              <h2 className="text-3xl font-bold text-slate-800">
                Welcome to the Trillium Model Knowledge Base
              </h2>
              <p className="mt-2 text-slate-600 max-w-2xl mx-auto">
                Use the buttons below to explore the report, get summaries, ask questions, or take a quiz.
              </p>
            </div>
            <FullReport content={reportContent} searchTerm={searchTerm} />
          </>
        );
      case 'summary':
        return <Summaries sections={sections} />;
      case 'quiz':
        return <Quiz reportText={reportContent} />;
      case 'qna':
        return <QnA reportText={reportContent} />;
      default:
        return (
          <>
            <div className="p-8 text-center bg-white shadow-sm mb-4">
              <h2 className="text-3xl font-bold text-slate-800">
                Welcome to the Trillium Model Knowledge Base
              </h2>
              <p className="mt-2 text-slate-600 max-w-2xl mx-auto">
                Use the buttons below to explore the report, get summaries, ask questions, or take a quiz.
              </p>
            </div>
            <FullReport content={reportContent} searchTerm={searchTerm} />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 flex flex-col">
      <header className="w-full bg-white shadow-lg p-4 flex flex-col items-center sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-slate-800 mb-4 text-center">Trillium Model Knowledge Base</h1>
        <div className="w-full max-w-md mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (view !== 'home') setView('home');
              }}
              className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search the report..."
            />
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>
        </div>
        <nav className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setView('home')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${view === 'home' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            <BookOpen size={20} className="mr-2" />
            Report
          </button>
          <button
            onClick={() => setView('summary')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${view === 'summary' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            <List size={20} className="mr-2" />
            Summaries
          </button>
          <button
            onClick={() => setView('qna')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${view === 'qna' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            <MessageSquare size={20} className="mr-2" />
            Q&A
          </button>
          <button
            onClick={() => setView('quiz')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${view === 'quiz' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
          >
            <ClipboardList size={20} className="mr-2" />
            Quiz
          </button>
        </nav>
      </header>
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
}
