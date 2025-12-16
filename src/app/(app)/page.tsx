export default function CanvasPage() {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-surface-2 flex items-center justify-center">
          <span className="text-2xl">🎨</span>
        </div>
        <h2 className="text-lg font-medium text-text-primary mb-2">
          Canvas Area
        </h2>
        <p className="text-sm text-text-secondary max-w-xs">
          This is where the infinite canvas will be rendered.
          The application shell is working!
        </p>
      </div>
    </div>
  );
}