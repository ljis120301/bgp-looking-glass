export default function Footer() {
  return (
    <footer className="mt-auto p-2 bg-gray-800/50 border-t border-gray-700" role="contentinfo">
      <div className="flex justify-between items-center">
        <div className="text-[10px] text-gray-400">
          Built with <span aria-label="love">♥</span> by{' '}
          <a 
            href="https://whoisjason.me" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors"
            aria-label="Visit Jason Graham's website"
          >
            Jason Graham
          </a>
        </div>
        <nav className="flex items-center gap-2" aria-label="Footer links">
          <a 
            href="https://bee.whoisjason.me" 
            className="text-[10px] text-gray-400 hover:text-gray-300 transition-colors"
            target="_blank" 
            rel="noopener noreferrer"
            aria-label="Visit my blog"
          >
            My Blog
          </a>
          <span className="text-gray-600" aria-hidden="true">•</span>
          <a 
            href="https://speed.whoisjason.me" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[10px] text-gray-400 hover:text-gray-300 transition-colors"
            aria-label="Visit my speed test tool"
          >
            SpeedTest
          </a>
        </nav>
      </div>
    </footer>
  );
} 