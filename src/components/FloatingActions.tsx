import React, { useState, useEffect } from 'react';
import { MessageCircle, ArrowUp, X, Send, Phone, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export const FloatingActions = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
      <AnimatePresence>
        {showBackToTop && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full luxury-shadow bg-white hover:bg-slate-50 text-primary"
              onClick={scrollToTop}
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl luxury-shadow border overflow-hidden"
            >
              <div className="bg-primary p-4 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">ApnarPonno Support</h3>
                    <p className="text-xs opacity-80">We're online to help you</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10"
                    onClick={() => setIsChatOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="p-4 h-64 overflow-y-auto bg-slate-50 flex flex-col gap-3">
                <div className="bg-white p-3 rounded-2xl rounded-tl-none luxury-shadow text-sm max-w-[85%]">
                  Hello! How can we help you today with our organic products?
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Quick Contact</p>
                  <div className="grid grid-cols-2 gap-2">
                    <a href="tel:+880123456789" className="flex items-center gap-2 p-2 bg-white rounded-lg border text-xs hover:bg-slate-50">
                      <Phone className="h-3 w-3 text-primary" /> Call Us
                    </a>
                    <a href="mailto:support@apnarponno.com" className="flex items-center gap-2 p-2 bg-white rounded-lg border text-xs hover:bg-slate-50">
                      <Mail className="h-3 w-3 text-primary" /> Email
                    </a>
                  </div>
                </div>
              </div>
              <div className="p-3 border-t flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="rounded-full"
                  onKeyDown={(e) => e.key === 'Enter' && setMessage('')}
                />
                <Button size="icon" className="rounded-full shrink-0" onClick={() => setMessage('')}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          size="icon"
          className="h-14 w-14 rounded-full luxury-shadow bg-primary hover:bg-primary/90 text-white"
          onClick={() => setIsChatOpen(!isChatOpen)}
        >
          {isChatOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </Button>
      </div>
    </div>
  );
};
