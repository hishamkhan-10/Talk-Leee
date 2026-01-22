"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function ContactSection() {
  const [formData, setFormData] = useState({ name: "", email: "", message: "", company: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email address";
    if (!formData.message.trim()) newErrors.message = "Message is required";
    else if (formData.message.length > 500) newErrors.message = "Message must be less than 500 characters";
    
    // Company is optional based on screenshot, but let's include it as optional
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
    setSuccess(true);
    setFormData({ name: "", email: "", message: "", company: "" });
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <section id="contact" className="py-24 px-4 md:px-6 lg:px-8 bg-white">
       <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div 
            // initial={{ opacity: 0, y: 20 }}
            // whileInView={{ opacity: 1, y: 0 }}
            // viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Get in touch with our team to learn how Talk-Lee can transform your business.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
             {/* Form */}
             <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-0 md:p-4"
             >
                <form onSubmit={handleSubmit} className="space-y-6" aria-busy={loading}>
                   <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-500 font-medium">Full Name</Label>
                      <Input 
                        id="name" 
                        data-testid="name-input"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className={cn("bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl h-12", errors.name && "border-red-500 focus-visible:ring-red-500")}
                        aria-invalid={errors.name ? true : undefined}
                        aria-describedby={errors.name ? "contact-name-error" : undefined}
                      />
                      {errors.name && <p id="contact-name-error" role="alert" aria-live="assertive" className="text-sm text-red-500" data-testid="name-error">{errors.name}</p>}
                   </div>
                   
                   <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-500 font-medium">Email Address</Label>
                      <Input 
                        id="email" 
                        data-testid="email-input"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className={cn("bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl h-12", errors.email && "border-red-500 focus-visible:ring-red-500")}
                        aria-invalid={errors.email ? true : undefined}
                        aria-describedby={errors.email ? "contact-email-error" : undefined}
                      />
                      {errors.email && <p id="contact-email-error" role="alert" aria-live="assertive" className="text-sm text-red-500" data-testid="email-error">{errors.email}</p>}
                   </div>

                   <div className="space-y-2">
                      <Label htmlFor="company" className="text-gray-500 font-medium">Company</Label>
                      <Input 
                        id="company" 
                        data-testid="company-input"
                        value={formData.company}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                        className="bg-white border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl h-12"
                      />
                   </div>

                   <div className="space-y-2">
                      <Label htmlFor="message" className="text-gray-500 font-medium">Message</Label>
                      <textarea
                        id="message"
                        data-testid="message-input"
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        rows={6}
                        className={cn(
                          "flex w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-900 ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all",
                          errors.message && "border-red-500 focus-visible:ring-red-500"
                        )}
                        aria-invalid={errors.message ? true : undefined}
                        aria-describedby={[errors.message ? "contact-message-error" : null, "contact-message-count"].filter(Boolean).join(" ")}
                      />
                      {errors.message && <p id="contact-message-error" role="alert" aria-live="assertive" className="text-sm text-red-500" data-testid="message-error">{errors.message}</p>}
                      <p id="contact-message-count" className="text-xs text-gray-400 text-right">{formData.message.length}/500</p>
                   </div>

                   <Button type="submit" size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all rounded-xl" disabled={loading}>
                      {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" aria-hidden /> : null}
                      {loading ? "Sending..." : "Send Message"}
                   </Button>
                   {success && <p role="status" aria-live="polite" className="text-green-600 text-center font-medium bg-green-50 p-3 rounded-lg border border-green-100" data-testid="success-message">Message sent successfully!</p>}
                </form>
             </motion.div>

             {/* Contact Info */}
             <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-gray-50 rounded-3xl p-8 lg:p-12"
             >
                <h3 className="text-2xl font-bold text-gray-900 mb-8">Get in Touch</h3>
                
                <div className="space-y-8">
                   <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">Email</h4>
                      <a href="mailto:contact@talk-lee.com" className="text-gray-600 hover:text-indigo-600 transition-colors">contact@talk-lee.com</a>
                   </div>
                   
                   <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">Phone</h4>
                      <a href="tel:+15551234567" className="text-gray-600 hover:text-indigo-600 transition-colors">+1 (555) 123-4567</a>
                   </div>

                   <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">Address</h4>
                      <p className="text-gray-600">123 AI Street<br/>San Francisco, CA 94105<br/>United States</p>
                   </div>

                   <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-1">Business Hours</h4>
                      <p className="text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM PST<br/>Saturday - Sunday: Closed</p>
                   </div>
                </div>
             </motion.div>
          </div>
       </div>
    </section>
  );
}
