import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, CheckCircle2 } from 'lucide-react';

interface ContactProps {
  onShowToast: (msg: string) => void;
}

export const Contact: React.FC<ContactProps> = ({ onShowToast }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'wealth',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    onShowToast(`Message sent! Our wealth advisor will contact ${formData.email} within 2 hours.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-16 bg-[#F8FAFC]">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#166534]/10 text-[#166534] text-xs font-bold">
          <MessageSquare className="w-3.5 h-3.5" /> 24/7 Wealth Support
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0F172A] font-display">
          Get in Touch with KN Finance
        </h1>
        <p className="text-[#64748B] text-base font-medium">
          Questions about wealth management, high-yield vaults, or credit lines? Our team is standing by.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Contact Form */}
        <div className="lg:col-span-7 kn-card p-8 lg:p-10 bg-white shadow-xl">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#16A34A]/20 text-[#16A34A] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-[#0F172A] font-display">Message Sent Successfully</h2>
              <p className="text-[#64748B] text-sm max-w-md mx-auto">
                Thank you, <strong>{formData.name}</strong>. A KN Finance advisor will reach out to <strong>{formData.email}</strong> shortly.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 px-6 py-2.5 rounded-xl bg-slate-100 text-[#0F172A] text-xs font-bold hover:bg-slate-200 border border-slate-300"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-2xl font-bold text-[#0F172A] font-display">Send Us a Message</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0F172A]">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-[#0F172A] text-sm focus:outline-none focus:border-[#166534]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0F172A]">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-[#0F172A] text-sm focus:outline-none focus:border-[#166534]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0F172A]">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 019-2834"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-[#0F172A] text-sm focus:outline-none focus:border-[#166534]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0F172A]">Inquiry Topic</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-[#0F172A] text-sm focus:outline-none focus:border-[#166534]"
                  >
                    <option value="wealth">AI Wealth & Vault Strategies</option>
                    <option value="corporate">Corporate Treasury Accounts</option>
                    <option value="credit">Instant Credit Lines</option>
                    <option value="support">General Account Support</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0F172A]">Your Message *</label>
                <textarea
                  rows={4}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can our wealth advisors assist you?"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-[#0F172A] text-sm focus:outline-none focus:border-[#166534]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 rounded-xl text-sm font-extrabold text-white bg-[#166534] hover:bg-[#14532d] shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Send Message</span>
                <Send className="w-4 h-4 text-[#D4A017]" />
              </button>
            </form>
          )}
        </div>

        {/* Channels & Office Addresses */}
        <div className="lg:col-span-5 space-y-6">
          <div className="kn-card p-6 bg-white space-y-6">
            <h3 className="text-lg font-bold text-[#0F172A] font-display">Direct Channels</h3>
            
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-[#166534]/10 text-[#166534]">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[#0F172A]">Email Us</p>
                  <p className="text-[#64748B] text-xs">support@knfinance.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-[#D4A017]/20 text-slate-900">
                  <Phone className="w-5 h-5 text-[#166534]" />
                </div>
                <div>
                  <p className="font-bold text-[#0F172A]">24/7 Support Hotline</p>
                  <p className="text-[#64748B] text-xs">+1 (800) 492-8820 (Toll Free)</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-700">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[#0F172A]">Hours</p>
                  <p className="text-[#64748B] text-xs">24/7 Global Coverage</p>
                </div>
              </div>
            </div>
          </div>

          <div className="kn-card p-6 bg-white space-y-3">
            <h3 className="text-lg font-bold text-[#0F172A] font-display">Global Offices</h3>
            
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="font-bold text-[#0F172A] flex items-center gap-1 text-sm">
                  <MapPin className="w-4 h-4 text-[#166534]" /> New York (HQ)
                </p>
                <p className="text-[#64748B]">One World Trade Center, NY 10007</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="font-bold text-[#0F172A] flex items-center gap-1 text-sm">
                  <MapPin className="w-4 h-4 text-[#166534]" /> London
                </p>
                <p className="text-[#64748B]">30 St Mary Axe, City of London, EC3A 8EP</p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
