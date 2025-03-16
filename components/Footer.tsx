export default function Footer() {
  return (
    <footer className="mt-auto p-2 bg-gray-800/50 border-t border-gray-700">
      <div className="flex justify-between items-center">
        <div className="text-[10px] text-gray-400">
          Built with ♥ by{' '}
          <a 
            href="https://whoisjason.me" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Jason Graham
          </a>
        </div>
        <div className="flex items-center gap-2">
          <a 
            href="https://bee.whoisjason.me" 
            className="text-[10px] text-gray-400 hover:text-gray-300 transition-colors"
            target="_blank" 
            rel="noopener noreferrer"
          >
            My Blog
          </a>
          <span className="text-gray-600">•</span>
          <a 
            href="https://speed.whoisjason.me" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] text-gray-400 hover:text-gray-300 transition-colors"
          >
            SpeedTest
          </a>
        </div>
      </div>
    </footer>
  );
} 