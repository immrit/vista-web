"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Plus, CheckCircle2, XCircle, Clock, Trash2 } from 'lucide-react';
import { CATEGORIES, Category } from '@/lib/game/questions';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';

interface QuestionDTO {
  id: string;
  categoryId: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  status: 'approved' | 'rejected' | 'pending';
  rejectionReason?: string;
  createdAt: string;
}

export default function GameSettingsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [categoryId, setCategoryId] = useState<Category>('general');
  const [text, setText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMyQuestions();
  }, []);

  const fetchMyQuestions = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<QuestionDTO[]>('/v1/game/questions');
      if (res) {
        setQuestions(res);
      }
    } catch (error) {
      console.error('Failed to fetch questions', error);
      toast.error('خطا در دریافت لیست سوالات');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || options.some(o => !o.trim())) {
      toast.error('لطفا صورت سوال و تمام گزینه‌ها را پر کنید');
      return;
    }
    try {
      setSubmitting(true);
      await apiClient.post('/v1/game/questions', {
        categoryId,
        text,
        options,
        correctOptionIndex: correctIndex
      });
      toast.success('سوال شما با موفقیت ثبت شد و در انتظار تایید است');
      setShowForm(false);
      setText('');
      setOptions(['', '', '', '']);
      setCorrectIndex(0);
      fetchMyQuestions();
    } catch (error) {
      console.error(error);
      toast.error('خطا در ثبت سوال');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#4c1d95] flex justify-center overflow-x-hidden">
      <div className="w-full max-w-md bg-[#6d28d9] flex flex-col h-[100dvh] relative shadow-2xl overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center p-4 bg-[#6d28d9] sticky top-0 z-20 shadow-md">
          <button 
            onClick={() => router.push('/game')}
            className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
          >
            <ArrowRight size={24} />
          </button>
          <h1 className="text-white font-bold text-lg mr-4">کارخانه سوال</h1>
        </div>

        <div className="p-4 flex-1">
          {!showForm ? (
            <>
              <div className="bg-white/10 border border-white/20 rounded-2xl p-6 mb-6 text-center text-white">
                <h2 className="font-bold text-xl mb-2 text-yellow-300">طراح سوال ویستا باشید!</h2>
                <p className="text-sm opacity-90 leading-relaxed mb-4">
                  شما می‌توانید سوالات جالب خود را برای ما ارسال کنید. 
                  پس از تایید توسط تیم ویستا، سوالات با نام کاربری خودتان به دیگر بازیکنان نمایش داده می‌شود.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-[#78c02c] hover:bg-[#68a825] text-white font-bold py-3 px-6 rounded-full w-full shadow-[0_4px_0_#5da01f] transition-all flex items-center justify-center space-x-2 space-x-reverse"
                >
                  <Plus size={20} />
                  <span>طرح سوال جدید</span>
                </button>
              </div>

              <h3 className="text-white font-bold mb-4 flex items-center space-x-2 space-x-reverse">
                <span>سوالات ارسالی شما</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{questions.length}</span>
              </h3>

              {loading ? (
                <div className="flex justify-center p-8">
                  <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center text-white/50 py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
                  هیچ سوالی تا به حال ارسال نکرده‌اید.
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((q) => (
                    <div key={q.id} className="bg-white rounded-2xl p-4 shadow-md relative overflow-hidden">
                      <div className={`absolute top-0 right-0 w-1.5 h-full ${
                        q.status === 'approved' ? 'bg-green-500' :
                        q.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-400'
                      }`}></div>
                      
                      <div className="flex justify-between items-start mb-2 pr-2">
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                          {CATEGORIES[q.categoryId as Category]?.label || q.categoryId}
                        </span>
                        
                        <div className="flex items-center space-x-1 space-x-reverse text-xs font-bold px-2 py-1 rounded-full">
                          {q.status === 'approved' && <><CheckCircle2 size={14} className="text-green-600"/><span className="text-green-600">تایید شده</span></>}
                          {q.status === 'rejected' && <><XCircle size={14} className="text-red-600"/><span className="text-red-600">رد شده</span></>}
                          {q.status === 'pending' && <><Clock size={14} className="text-yellow-600"/><span className="text-yellow-600">در انتظار</span></>}
                        </div>
                      </div>
                      
                      <p className="font-bold text-slate-800 text-sm mb-3 pr-2">{q.text}</p>
                      
                      {q.status === 'rejected' && q.rejectionReason && (
                        <div className="bg-red-50 text-red-700 text-xs p-2 rounded-lg mb-2 pr-2 border border-red-100">
                          <strong>علت رد:</strong> {q.rejectionReason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-3xl p-5 shadow-xl animate-in slide-in-from-bottom-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-black text-xl text-[#4c1d95]">طرح سوال جدید</h2>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                  <Trash2 size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">دسته بندی</label>
                  <select 
                    value={categoryId} 
                    onChange={e => setCategoryId(e.target.value as Category)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-[#6d28d9] text-slate-800 font-medium"
                  >
                    {Object.values(CATEGORIES).map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">صورت سوال</label>
                  <textarea 
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="سوال خود را اینجا بنویسید..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-[#6d28d9] text-slate-800 font-medium resize-none h-24"
                    maxLength={150}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">گزینه‌ها (گزینه صحیح را تیک بزنید)</label>
                  <div className="space-y-2">
                    {options.map((opt, idx) => (
                      <div key={idx} className={`flex items-center bg-slate-50 border rounded-xl p-1 pr-3 transition-colors ${correctIndex === idx ? 'border-green-500 bg-green-50' : 'border-slate-200'}`}>
                        <input 
                          type="radio" 
                          name="correctOption" 
                          checked={correctIndex === idx}
                          onChange={() => setCorrectIndex(idx)}
                          className="w-5 h-5 accent-green-600 cursor-pointer"
                        />
                        <input 
                          type="text" 
                          value={opt}
                          onChange={e => handleOptionChange(idx, e.target.value)}
                          placeholder={`گزینه ${idx + 1}`}
                          className="flex-1 bg-transparent border-none p-2 outline-none text-slate-800 font-medium mr-2"
                          maxLength={50}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#6d28d9] hover:bg-[#5b21b6] text-white font-bold py-4 rounded-2xl shadow-[0_4px_0_#4c1d95] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 mt-6"
                >
                  {submitting ? 'در حال ارسال...' : 'ارسال برای تایید'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
