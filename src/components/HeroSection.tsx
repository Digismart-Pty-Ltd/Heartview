import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-event.jpg";

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Elegant event setup"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-charcoal/75" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/40 to-transparent" />
      </div>

      <div className="relative container mx-auto px-6 pt-32 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-8"
        >
          <Sparkles className="w-4 h-4 text-gold" />
          <span className="text-sm font-medium text-gold">
            Replace printed programs forever
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-cream leading-tight max-w-5xl mx-auto"
        >
          Beautiful Digital
          <br />
          <span className="text-gradient-gold">Event Programs</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 text-lg md:text-xl text-cream/60 max-w-2xl mx-auto font-body"
        >
          Create stunning, mobile-friendly event programs for weddings, funerals,
          church services, and celebrations — in minutes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => navigate("/create")}
            className="bg-gradient-gold text-charcoal font-semibold px-8 py-4 rounded-xl shadow-gold hover:opacity-90 transition-all text-lg flex items-center gap-2 group"
          >
            Create Your Program
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-cream/70 hover:text-cream font-medium px-8 py-4 rounded-xl border border-cream/20 hover:border-cream/40 transition-all text-lg"
          >
            View Dashboard
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-16 flex items-center justify-center gap-8 text-cream/40 text-sm"
        >
          <div className="flex flex-col items-center">
            <span className="text-2xl font-display font-bold text-gold">10k+</span>
            <span>Programs Created</span>
          </div>
          <div className="w-px h-10 bg-cream/10" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-display font-bold text-gold">50+</span>
            <span>Templates</span>
          </div>
          <div className="w-px h-10 bg-cream/10" />
          <div className="flex flex-col items-center">
            <span className="text-2xl font-display font-bold text-gold">4.9★</span>
            <span>User Rating</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
