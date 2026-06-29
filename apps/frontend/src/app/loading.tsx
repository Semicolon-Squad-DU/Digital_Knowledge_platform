export default function GlobalLoading() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 9999,
        background: "linear-gradient(90deg, var(--avatar-theme-color, #1a1a2e) 0%, #6366f1 60%, transparent 100%)",
        animation: "dkp-progress 1.2s ease-in-out infinite",
      }}
    >
      <style>{`
        @keyframes dkp-progress {
          0%   { transform: translateX(-100%); opacity: 1; }
          70%  { transform: translateX(20%);  opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
