import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingScreen } from '../components/Loader';

export function Careers() {
  const [selectedJob, setSelectedJob] = useState<{ id: string, title: string } | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/jobs').then(res => res.json()).then(data => {
      setJobs(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleApply = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedJob) return;

    const formData = new FormData(e.currentTarget);
    const data = {
      jobId: selectedJob.id,
      jobTitle: selectedJob.title,
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      currentRole: formData.get('currentRole'),
      experience: formData.get('experience'),
      qualification: formData.get('qualification')
    };

    try {
      await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setSelectedJob(null);
      }, 3000);
    } catch (err) {
      console.error('Failed to submit application');
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto px-4 py-16"
    >
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Join Our Team</h1>
        <p className="text-lg text-slate-600">Help us redefine the food delivery experience.</p>
      </div>
      
      <div className="space-y-6">
        {jobs.map(job => (
          <div key={job._id || job.id} className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center shadow-sm hover:shadow transition-shadow">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{job.title}</h2>
              <div className="flex gap-4 mt-2 text-sm text-slate-500">
                <span className="bg-slate-100 px-3 py-1 rounded-full">{job.type}</span>
                <span className="flex items-center">{job.location}</span>
              </div>
            </div>
            <button 
              onClick={() => setSelectedJob({ id: job._id || job.id, title: job.title })}
              className="mt-4 md:mt-0 bg-brand-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-600 transition-colors"
            >
              Apply Now
            </button>
          </div>
        ))}
      </div>

      <AnimatePresence>
      {selectedJob && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
              <h2 className="text-xl font-bold text-slate-800">Apply for {selectedJob.title}</h2>
              <button 
                onClick={() => { setSelectedJob(null); setIsSubmitted(false); }} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {isSubmitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🎉</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Application Received!</h3>
                  <p className="text-slate-500">Thank you for your interest. Our HR team will get back to you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input name="name" type="text" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input name="email" type="email" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="john@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                    <input name="phone" type="tel" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="+91 XXXXX XXXXX" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Current Role</label>
                    <input name="currentRole" type="text" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="e.g. Software Engineer" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Total Work Experience (Years)</label>
                    <input name="experience" type="number" min="0" step="0.5" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="e.g. 5" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Highest Qualification</label>
                    <input name="qualification" type="text" required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none" placeholder="e.g. B.Tech in Computer Science" />
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium py-3 rounded-lg transition-colors">
                      Submit Application
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
}
