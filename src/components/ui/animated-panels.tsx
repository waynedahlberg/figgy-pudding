"use client";

import { motion, AnimatePresence } from "motion/react";
import { ReactNode } from "react";

// =============================================================================
// ANIMATED PANEL WRAPPER
// =============================================================================

interface AnimatedPanelProps {
  isOpen: boolean;
  children: ReactNode;
  position: "left" | "right";
  className?: string;
}

/**
 * Wrapper component for panels that animates in/out from the side.
 * Uses Motion (framer-motion) for smooth animations.
 */
export function AnimatedPanel({ 
  isOpen, 
  children, 
  position, 
  className = "" 
}: AnimatedPanelProps) {
  const xOffset = position === "left" ? -320 : 320;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: xOffset, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: xOffset, opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            mass: 0.8,
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// ANIMATED FLOATING PANEL
// =============================================================================

interface AnimatedFloatingPanelProps {
  isOpen: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Floating panel that animates with scale and fade.
 * Good for popups, menus, and floating toolbars.
 */
export function AnimatedFloatingPanel({ 
  isOpen, 
  children, 
  className = "" 
}: AnimatedFloatingPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 25,
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// SLIDE OVER PANEL
// =============================================================================

interface SlideOverPanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  position: "left" | "right";
  width?: string;
  showBackdrop?: boolean;
}

/**
 * Full-height slide-over panel with optional backdrop.
 */
export function SlideOverPanel({ 
  isOpen, 
  onClose, 
  children, 
  position,
  width = "w-80",
  showBackdrop = false,
}: SlideOverPanelProps) {
  const xOffset = position === "left" ? "-100%" : "100%";
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          {showBackdrop && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={onClose}
            />
          )}
          
          {/* Panel */}
          <motion.div
            initial={{ x: xOffset }}
            animate={{ x: 0 }}
            exit={{ x: xOffset }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
            }}
            className={`
              fixed top-0 ${position === "left" ? "left-0" : "right-0"} 
              h-full ${width} z-50
              bg-surface1 border-${position === "left" ? "r" : "l"} border-border-subtle
              shadow-xl
            `}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// COLLAPSIBLE SECTION (for use inside panels)
// =============================================================================

interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="border-b border-border-subtle">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-sm font-medium text-text-primary hover:bg-surface2 transition-colors"
      >
        <span>{title}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronIcon />
        </motion.span>
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 16 16" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2"
    >
      <path d="M4 6L8 10L12 6" />
    </svg>
  );
}
