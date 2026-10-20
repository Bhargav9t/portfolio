import React, { useState } from "react";
import { PORTFOLIO_DATA } from "@/data/portfolioData";
import { Mail, Send, Copy, Check, Terminal, Phone, MapPin } from "lucide-react";
import { soundFx } from "@/utils/audio";
import confetti from "canvas-confetti";
import { GithubIcon, LinkedinIcon } from "@/components/Icons";

export function ContactView() {
  const { profile } = PORTFOLIO_DATA;
  const [copied, setCopied] = useState(false);
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(profile.email);
    setCopied(true);
    soundFx.success();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name || !formState.email || !formState.message) return;

    setIsSubmitting(true);
    soundFx.select();

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      soundFx.success();

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#8b3c1b", "#d5b893", "#544534", "#1a1107", "#f5ebd9"],
        });
      } catch {
        // Fallback
      }
    }, 800);
  };

  return (
    <div className="space-y-4">
      {/* Contact Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Email & Phone Direct Card */}
        <div className="parchment-card p-3.5 sm:p-4 space-y-2.5 parchment-card-hover">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#69523b] font-bold uppercase tracking-wider">
              PRIMARY TRANSMISSION LINE
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#8b3c1b] shadow-[0_0_8px_#8b3c1b] animate-pulse" />
          </div>

          <div className="space-y-0.5">
            <div className="text-[11px] font-mono text-[#69523b]">DIRECT INBOX</div>
            <div className="text-base sm:text-lg font-mono font-bold text-[#1a1107] break-all">
              {profile.email}
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#59432d] pt-0.5">
              <Phone className="w-3.5 h-3.5 text-[#8b3c1b]" />
              <span>{profile.phone}</span>
              <span className="text-[#8c7b64]">•</span>
              <MapPin className="w-3.5 h-3.5 text-[#8b3c1b]" />
              <span>{profile.location}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={handleCopyEmail}
              className="parchment-chip parchment-chip-interactive px-3 py-1.5 text-xs font-mono font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#2d6a4f]" /> : <Copy className="w-3.5 h-3.5 text-[#8b3c1b]" />}
              <span>{copied ? "COPIED!" : "COPY EMAIL"}</span>
            </button>

            <a
              href={`mailto:${profile.email}?subject=Collaboration%20Inquiry`}
              className="parchment-chip parchment-chip-interactive px-3 py-1.5 text-xs font-mono inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-[#8b3c1b]" />
              <span>OPEN EMAIL CLIENT</span>
            </a>
          </div>
        </div>

        {/* Social Network Coordinates */}
        <div className="parchment-card p-3.5 sm:p-4 space-y-2.5 parchment-card-hover">
          <span className="text-[11px] font-mono text-[#69523b] font-bold uppercase tracking-wider block">
            NETWORK COORDINATES
          </span>

          <div className="space-y-2">
            <a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              className="parchment-inset flex items-center justify-between p-2.5 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <GithubIcon className="w-4 h-4 text-[#1a1107] group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-xs font-mono font-bold text-[#1a1107]">GITHUB PROFILE</div>
                  <div className="text-[11px] text-[#59432d] font-mono">github.com/Bhargav9t</div>
                </div>
              </div>
              <span className="text-xs font-mono text-[#8b3c1b] font-bold">EXPLORE ›</span>
            </a>

            <a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              className="parchment-inset flex items-center justify-between p-2.5 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <LinkedinIcon className="w-4 h-4 text-[#1a1107] group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-xs font-mono font-bold text-[#1a1107]">LINKEDIN PROFILE</div>
                  <div className="text-[11px] text-[#59432d] font-mono">bhargav-reddy-6369b732b</div>
                </div>
              </div>
              <span className="text-xs font-mono text-[#8b3c1b] font-bold">CONNECT ›</span>
            </a>
          </div>
        </div>
      </div>

      {/* Cyber Signal Dispatch Form */}
      <div className="parchment-card p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between border-b border-[#8c7b64]/30 pb-2.5">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-mono font-bold text-[#1a1107]">
            <Terminal className="w-4 h-4 text-[#8b3c1b]" />
            <span>// TRANSMIT MESSAGE PACKET TO BHARGAV</span>
          </div>
          <span className="text-[10px] font-mono text-[#69523b] font-semibold">GRID STATUS: ACTIVE</span>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2.5">
            <div className="w-10 h-10 rounded-full bg-[#2d6a4f]/20 border border-[#2d6a4f]/50 flex items-center justify-center text-[#2d6a4f] mx-auto animate-bounce shadow-sm">
              <Check className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold font-mono text-[#1a1107]">MESSAGE TRANSMITTED</h4>
            <p className="text-xs text-[#59432d] max-w-md mx-auto">
              Your message packet has been routed through The Celestial Sea to Bhargav Reddy. Expect a reply soon.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setFormState({ name: "", email: "", subject: "", message: "" });
              }}
              className="mt-3 parchment-chip parchment-chip-interactive px-3.5 py-1.5 text-xs font-mono cursor-pointer"
            >
              TRANSMIT ANOTHER PACKET
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#59432d] font-bold">YOUR NAME / CALLSIGN *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sam Flynn"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  className="parchment-input px-3 py-2 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-[#59432d] font-bold">YOUR RETURN TRANSMISSION EMAIL *</label>
                <input
                  type="email"
                  required
                  placeholder="flynn@grid.org"
                  value={formState.email}
                  onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                  className="parchment-input px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-[#59432d] font-bold">TRANSMISSION SUBJECT</label>
              <input
                type="text"
                placeholder="e.g. Collaboration on AI Systems / Opportunities"
                value={formState.subject}
                onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                className="parchment-input px-3 py-2 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono text-[#59432d] font-bold">MESSAGE CONTENT *</label>
              <textarea
                required
                rows={3}
                placeholder="Describe project scope, inquiry, or transmission parameters..."
                value={formState.message}
                onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                className="parchment-input px-3 py-2 text-xs resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="parchment-chip-active w-full py-2.5 font-mono font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>DISPATCH SIGNAL TO BHARGAV</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
