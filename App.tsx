import React, { useState, useEffect } from 'react';
import ImageUploader from './components/ImageUploader';
import MarkdownRenderer from './components/MarkdownRenderer';
import FilledFormPreview from './components/FilledFormPreview';
import ChatInterface from './components/ChatInterface';
import { DocumentIcon, RefreshIcon, CheckIcon, PdfIcon, SunIcon, MoonIcon, ArrowUpRightIcon } from './components/Icons';
import { AppState, FormAnalysisResponse } from './types';
import { analyzeForm } from './services/geminiService';

const App = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Q&A State
  const [analysisResult, setAnalysisResult] = useState<FormAnalysisResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const [error, setError] = useState<string | null>(null);

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return newMode;
    });
  };

  // Scroll to top on state change for better UX
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [appState]);

  const handleImageSelect = (base64: string, name: string) => {
    setSelectedImage(base64);
    setFileName(name);
    setError(null);
  };

  const handleClear = () => {
    setSelectedImage(null);
    setFileName(null);
    setAppState(AppState.IDLE);
    setAnalysisResult(null);
    setDescription('');
    setAnswers({});
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setAppState(AppState.ANALYZING);
    setError(null);

    try {
      const response = await analyzeForm(selectedImage, description);
      setAnalysisResult(response);
      
      if (response.status === "NEEDS_DETAILS") {
        setAppState(AppState.NEEDS_INFO);
        // Initialize answer state for the questions
        const initialAnswers: Record<string, string> = {};
        response.questions?.forEach(q => initialAnswers[q] = '');
        setAnswers(initialAnswers);
      } else {
        setAppState(AppState.SUCCESS);
      }

    } catch (err) {
      console.error(err);
      setError("Something went wrong analyzing the document. Please try again.");
      setAppState(AppState.ERROR);
    }
  };

  const handleSubmitAnswers = async () => {
    if (!selectedImage || !analysisResult?.questions) return;

    setAppState(AppState.ANALYZING);
    
    // Format Q&A history
    const qaHistory = analysisResult.questions.map(q => ({
      question: q,
      answer: answers[q] || "Not provided"
    }));

    try {
      const response = await analyzeForm(selectedImage, description, qaHistory);
      setAnalysisResult(response);
      setAppState(AppState.SUCCESS);
    } catch (err) {
       console.error(err);
       setError("Failed to process answers. Please try again.");
       setAppState(AppState.ERROR); // Or stay in NEEDS_INFO with error
    }
  };

  const isPdf = selectedImage?.startsWith('data:application/pdf') || false;

  return (
    <div className="relative flex flex-col min-h-screen font-sans transition-colors duration-300 overflow-hidden">
      
      {/* Ambient Background Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
         {/* Blob 1 */}
         <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 dark:bg-purple-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-40 dark:opacity-70 animate-blob"></div>
         {/* Blob 2 */}
         <div className="absolute top-0 -right-4 w-96 h-96 bg-primary-300 dark:bg-primary-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-40 dark:opacity-70 animate-blob animation-delay-2000"></div>
         {/* Blob 3 */}
         <div className="absolute -bottom-32 left-20 w-96 h-96 bg-blue-300 dark:bg-blue-900/40 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-40 dark:opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 transition-all duration-300">
        <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/70 backdrop-blur-xl border-b border-white/40 dark:border-white/5 shadow-sm"></div>
        <div className="relative max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={handleClear}>
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-2 rounded-xl text-white shadow-lg shadow-primary-500/30 transform group-hover:scale-105 transition-transform duration-300">
               <DocumentIcon className="w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-slate-800 dark:text-white drop-shadow-sm">
              Form<span className="text-primary-600 dark:text-primary-400">Ease</span> AI
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
             <button
               onClick={toggleTheme}
               className="p-2.5 rounded-full bg-white/70 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-all shadow-sm hover:shadow-md border border-white/40 dark:border-white/10"
               aria-label="Toggle Dark Mode"
             >
               {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
             </button>

             {(appState === AppState.SUCCESS || appState === AppState.NEEDS_INFO) && (
                <button 
                onClick={handleClear}
                className="px-4 py-2 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 hover:text-primary-700 dark:hover:text-primary-400 flex items-center gap-2 transition-all shadow-sm border border-white/40 dark:border-white/10 backdrop-blur-md"
                >
                <RefreshIcon className="w-4 h-4" />
                <span className="hidden sm:inline">New Form</span>
                </button>
             )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-4 py-8 md:py-16 flex flex-col items-center">
        
        {/* Intro Text - Only show when IDLE */}
        {appState === AppState.IDLE && !selectedImage && (
          <div className="text-center mb-12 max-w-2xl animate-fade-in space-y-4">
            <h2 className="text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight drop-shadow-sm">
              Bureaucracy, <br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600 dark:from-primary-500 dark:to-blue-500">simplified.</span>
            </h2>
            <p className="text-lg md:text-xl text-slate-700 dark:text-slate-300 max-w-lg mx-auto leading-relaxed font-medium">
              Upload any government or legal form. We'll analyze it and guide you through it, step by step.
            </p>
          </div>
        )}

        {/* Layout Container */}
        <div className="w-full grid grid-cols-1 md:grid-cols-1 gap-8">
          
          {/* Input Section */}
          {(appState === AppState.IDLE || appState === AppState.ANALYZING || appState === AppState.ERROR) && (
            <div className="w-full flex flex-col items-center gap-6 animate-fade-in">
              <ImageUploader 
                selectedImage={selectedImage}
                fileName={fileName}
                onImageSelected={handleImageSelect}
                onClear={handleClear}
              />

              {/* Context Input - Only show if image is selected */}
              {selectedImage && (
                <div className="w-full max-w-md space-y-4 animate-slide-up">
                  <div className="glass-panel p-6 rounded-3xl transition-all duration-300">
                    <label htmlFor="context" className="block text-sm font-bold text-slate-900 dark:text-slate-200 mb-1 ml-1">
                      Quick Context (Optional)
                    </label>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 ml-1 font-medium">
                        You can tell us a bit about yourself now, or we can ask you specific questions later.
                    </p>
                    <textarea
                      id="context"
                      rows={3}
                      className="w-full px-5 py-4 rounded-2xl glass-input text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 outline-none transition-all duration-300 resize-none font-medium shadow-inner"
                      placeholder="e.g., I'm applying for a tourist visa, my name is Jane Doe..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={appState === AppState.ANALYZING}
                    />
                  </div>
                  
                  {/* Action Button */}
                  <div className="sticky bottom-6 z-40 w-full">
                    <button
                        onClick={handleAnalyze}
                        disabled={appState === AppState.ANALYZING}
                        className={`
                        group relative w-full py-4 px-6 rounded-2xl font-bold text-lg shadow-2xl
                        transition-all duration-300 transform hover:-translate-y-1 active:scale-[0.98]
                        flex items-center justify-center gap-3 overflow-hidden
                        backdrop-blur-md
                        
                        /* Glass Button Style */
                        bg-slate-900/90 dark:bg-slate-100/10 text-white dark:text-white
                        border border-white/20 dark:border-white/20
                        hover:bg-slate-800 dark:hover:bg-slate-800/50
                        hover:shadow-primary-500/20
                        
                        ${appState === AppState.ANALYZING ? 'opacity-80 cursor-wait' : ''}
                        `}
                    >
                        {/* Fluid Animation Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 via-primary-400/20 to-primary-600/20 bg-[length:200%_100%] animate-fluid opacity-0 group-hover:opacity-100 dark:opacity-50 pointer-events-none" />

                        {appState === AppState.ANALYZING ? (
                        <>
                            <svg className="animate-spin -ml-1 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Reading Document...
                        </>
                        ) : (
                        <div className="relative z-10 flex items-center gap-2 w-full justify-between px-2">
                             <div className="flex items-center gap-3">
                                <DocumentIcon className="w-6 h-6" />
                                <span>Analyze Form</span>
                             </div>
                             <ArrowUpRightIcon className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                        </div>
                        )}
                    </button>
                  </div>
                  
                  {appState === AppState.ERROR && (
                    <div className="p-4 bg-red-50/90 dark:bg-red-900/40 backdrop-blur-sm text-red-800 dark:text-red-300 rounded-2xl border border-red-200 dark:border-red-800 text-sm text-center shadow-lg font-medium">
                        {error}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Question & Answer Section */}
          {appState === AppState.NEEDS_INFO && analysisResult && (
             <div className="w-full max-w-2xl mx-auto animate-fade-in space-y-6">
                 
                 {/* Summary Card */}
                 <div className="glass-panel p-5 rounded-3xl flex items-start gap-4 transition-all bg-white/90 dark:bg-slate-900/60">
                    <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-2xl shrink-0 backdrop-blur-sm">
                         <DocumentIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{analysisResult.documentTitle || "Form Detected"}</h3>
                        <p className="text-slate-700 dark:text-slate-300 text-sm mt-1 leading-relaxed">{analysisResult.summary}</p>
                    </div>
                 </div>

                 {/* Questions Form */}
                 <div className="glass-panel rounded-[2.5rem] overflow-hidden transition-all bg-white/90 dark:bg-slate-900/60">
                    <div className="bg-white/60 dark:bg-slate-800/40 px-8 py-6 border-b border-white/40 dark:border-white/5 backdrop-blur-md">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                            <span className="flex items-center justify-center w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-lg shadow-sm">🤔</span> 
                            Missing Details
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 ml-14 font-medium">Please answer these questions so I can fill the form accurately.</p>
                    </div>
                    
                    <div className="p-6 md:p-8 space-y-8">
                        {analysisResult.questions?.map((question, idx) => (
                            <div key={idx} className="space-y-3">
                                <label className="block text-sm font-bold text-slate-800 dark:text-slate-300 ml-1">
                                    {idx + 1}. {question}
                                </label>
                                <input 
                                    type="text"
                                    className="w-full px-6 py-4 rounded-2xl glass-input text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-500 font-medium focus:ring-2 focus:ring-primary-500/50 focus:border-transparent outline-none transition-all shadow-inner"
                                    placeholder="Type your answer here..."
                                    value={answers[question] || ''}
                                    onChange={(e) => setAnswers(prev => ({...prev, [question]: e.target.value}))}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="px-6 py-6 bg-white/50 dark:bg-slate-800/30 border-t border-white/40 dark:border-white/5 flex justify-end backdrop-blur-sm">
                         <button
                            onClick={handleSubmitAnswers}
                            className={`
                            group relative overflow-hidden
                            bg-slate-900/90 dark:bg-primary-600/90 hover:bg-slate-800 dark:hover:bg-primary-500
                            text-white font-bold py-4 px-8 rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-black/30 
                            transition-all transform hover:scale-[1.02] active:scale-[0.98] border border-white/10
                            backdrop-blur-md
                            `}
                         >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 bg-[length:200%_100%] animate-fluid opacity-0 group-hover:opacity-100 pointer-events-none" />
                            <span className="relative z-10 flex items-center gap-2">
                                Generate Auto-Fill Guide <ArrowUpRightIcon className="w-5 h-5" />
                            </span>
                         </button>
                    </div>
                 </div>
             </div>
          )}

          {/* Result Section (Success) */}
          {appState === AppState.SUCCESS && analysisResult && (
            <div className="w-full animate-fade-in space-y-8">
                
              {/* Reference Thumbnail */}
              <div className="glass-panel p-4 rounded-3xl flex items-center gap-4 max-w-4xl mx-auto transition-all bg-white/90 dark:bg-slate-900/60">
                 <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800/50 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                    {isPdf ? (
                        <PdfIcon className="w-8 h-8 text-red-500" />
                    ) : (
                        <img src={selectedImage!} alt="Original" className="w-full h-full object-cover" />
                    )}
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {analysisResult.documentTitle || fileName || "Document"}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{analysisResult.summary}</p>
                 </div>
                 <div className="text-primary-700 dark:text-green-400 bg-primary-100/80 dark:bg-green-900/20 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 border border-primary-200 dark:border-green-800/30">
                    <CheckIcon className="w-4 h-4" /> Guide Ready
                 </div>
              </div>

               {/* Filled Form Preview */}
               {analysisResult.filledFields && analysisResult.filledFields.length > 0 && selectedImage && (
                  <FilledFormPreview 
                    imageSrc={selectedImage}
                    isPdf={isPdf}
                    fields={analysisResult.filledFields}
                    fileName={fileName}
                  />
               )}
               
               {/* AI Chat Assistant */}
               {selectedImage && (
                  <ChatInterface imageSrc={selectedImage} />
               )}

              {/* The Plan */}
              <div className="glass-panel rounded-[2.5rem] overflow-hidden transition-all bg-white/90 dark:bg-slate-900/60">
                <div className="bg-white/60 dark:bg-slate-800/40 px-8 py-6 border-b border-white/40 dark:border-white/5 backdrop-blur-md">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                        <span className="flex items-center justify-center w-10 h-10 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full shadow-sm">
                            <DocumentIcon className="w-5 h-5" />
                        </span>
                        Explanation & Guide
                    </h2>
                </div>
                <div className="p-6 md:p-10 bg-white/40 dark:bg-slate-900/20 backdrop-blur-sm">
                    {analysisResult.markdownGuide && (
                        <MarkdownRenderer content={analysisResult.markdownGuide} />
                    )}
                </div>
              </div>

              <div className="text-center pt-8 pb-16">
                  <button 
                    onClick={handleClear}
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full glass-panel hover:bg-white dark:hover:bg-slate-800/80 text-slate-800 dark:text-slate-200 font-bold transition-all hover:-translate-y-0.5 shadow-lg hover:shadow-xl bg-white/80"
                  >
                    <RefreshIcon className="w-5 h-5" />
                    Upload Another Form
                  </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;