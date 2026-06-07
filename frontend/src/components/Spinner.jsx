export default function Spinner({ size = 'md' }) {
  const s = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7';
  return (
    <div className={`${s} border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin`}/>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg"/>
    </div>
  );
}
