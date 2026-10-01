export default function InterventionBanner({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div role="alert" className="fixed top-4 left-1/2 -translate-x-1/2 z-10 max-w-lg w-[92%] rounded-lg bg-warn text-white px-4 py-3 shadow-lg flex gap-3">
      <div className="flex-1"><p className="font-semibold">Drift detected</p><p className="text-sm">{text}</p></div>
      <button onClick={onClose} className="text-sm underline self-start">Dismiss</button>
    </div>
  );
}
