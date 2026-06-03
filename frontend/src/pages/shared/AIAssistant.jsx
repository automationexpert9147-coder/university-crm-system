import { useState, useRef, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FaRobot, FaPaperPlane, FaTrash, FaBrain, FaQuestionCircle } from 'react-icons/fa';

const AIAssistant = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState('chat');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hello ${user?.name}! I'm your AI academic assistant. I can help you with:\n• Explaining concepts\n• Study guidance\n• Quiz generation\n• Performance analysis\n\nHow can I help you today?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [quizForm, setQuizForm] = useState({ topic: '', difficulty: 'medium', numQuestions: 5 });
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await api.post('/ai/ask', { message: input });
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, AI service is currently unavailable. Please check your API key in the backend .env file.' }]);
    }
    setLoading(false);
  };

  const generateQuiz = async () => {
    if (!quizForm.topic) return toast.error('Enter a topic');
    setLoading(true);
    try {
      const { data } = await api.post('/ai/quiz', quizForm);
      setQuiz(data.quiz);
      setQuizAnswers({});
      setQuizSubmitted(false);
    } catch { toast.error('Failed to generate quiz'); }
    setLoading(false);
  };

  const submitQuiz = () => {
    setQuizSubmitted(true);
    const correct = quiz.questions.filter((q, i) => quizAnswers[i] === q.correct).length;
    const pct = Math.round((correct / quiz.questions.length) * 100);
    toast.success(`Quiz complete! Score: ${correct}/${quiz.questions.length} (${pct}%)`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
            <FaRobot className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Academic Assistant</h1>
            <p className="text-xs text-gray-500">Powered by Claude AI</p>
          </div>
        </div>
        <div className="flex gap-2">
          {[{ id: 'chat', icon: FaBrain, label: 'Chat' }, { id: 'quiz', icon: FaQuestionCircle, label: 'Quiz Generator' }].map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${mode === m.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <m.icon size={12} /> {m.label}
            </button>
          ))}
        </div>
      </div>

      {mode === 'chat' && (
        <div className="card flex flex-col h-[calc(100vh-12rem)]">
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                    <FaRobot className="text-white text-xs" />
                  </div>
                )}
                <div className={`max-w-2xl px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mr-2">
                  <FaRobot className="text-white text-xs" />
                </div>
                <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex gap-3 items-end">
            <textarea className="input flex-1 resize-none" rows={2} placeholder="Ask me anything about your studies..." value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} />
            <div className="flex flex-col gap-2">
              <button onClick={sendMessage} disabled={loading || !input.trim()} className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50">
                <FaPaperPlane size={14} />
              </button>
              <button onClick={() => setMessages([{ role: 'assistant', content: `Hello ${user?.name}! How can I help you today?` }])} className="w-10 h-10 bg-gray-100 text-gray-500 rounded-xl flex items-center justify-center hover:bg-gray-200">
                <FaTrash size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === 'quiz' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Generate Practice Quiz</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="label">Topic</label>
                <input className="input" placeholder="e.g. Data Structures, OOP, SQL..." value={quizForm.topic}
                  onChange={e => setQuizForm(f => ({ ...f, topic: e.target.value }))} />
              </div>
              <div>
                <label className="label">Difficulty</label>
                <select className="input" value={quizForm.difficulty} onChange={e => setQuizForm(f => ({ ...f, difficulty: e.target.value }))}>
                  <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="label">Questions</label>
                <select className="input" value={quizForm.numQuestions} onChange={e => setQuizForm(f => ({ ...f, numQuestions: parseInt(e.target.value) }))}>
                  {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n} Questions</option>)}
                </select>
              </div>
            </div>
            <button onClick={generateQuiz} disabled={loading} className="btn-primary mt-4">
              {loading ? 'Generating Quiz...' : 'Generate Quiz'}
            </button>
          </div>

          {quiz && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-6">Quiz: {quizForm.topic}</h2>
              <div className="space-y-6">
                {quiz.questions.map((q, i) => (
                  <div key={i} className="border rounded-xl p-4">
                    <p className="font-medium text-gray-900 mb-3">{i + 1}. {q.question}</p>
                    <div className="space-y-2">
                      {q.options.map((opt, j) => {
                        const letter = ['A', 'B', 'C', 'D'][j];
                        const isSelected = quizAnswers[i] === letter;
                        const isCorrect = quizSubmitted && letter === q.correct;
                        const isWrong = quizSubmitted && isSelected && letter !== q.correct;
                        return (
                          <button key={j} onClick={() => !quizSubmitted && setQuizAnswers(a => ({ ...a, [i]: letter }))}
                            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${isCorrect ? 'bg-green-100 border-2 border-green-500 text-green-800' : isWrong ? 'bg-red-100 border-2 border-red-500 text-red-800' : isSelected ? 'bg-blue-100 border-2 border-blue-400 text-blue-800' : 'bg-gray-50 hover:bg-gray-100 text-gray-700'}`}>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {quizSubmitted && q.explanation && (
                      <div className="mt-3 bg-blue-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-blue-800">Explanation:</p>
                        <p className="text-sm text-blue-700 mt-1">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {!quizSubmitted ? (
                <button onClick={submitQuiz} className="btn-primary mt-6 w-full">Submit Quiz</button>
              ) : (
                <div className="mt-6 bg-green-50 rounded-xl p-4 text-center">
                  <p className="text-lg font-bold text-green-800">
                    Score: {quiz.questions.filter((q, i) => quizAnswers[i] === q.correct).length}/{quiz.questions.length}
                  </p>
                  <button onClick={() => { setQuiz(null); setQuizAnswers({}); setQuizSubmitted(false); }} className="btn-primary mt-3">New Quiz</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
