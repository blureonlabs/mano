export default function Footer() {
  return (
    <footer className="relative z-[1] py-10 border-t border-[rgba(44,40,37,0.1)]">
      <div className="max-w-[1120px] mx-auto px-8">
        <div className="flex items-center justify-between">
          <div className="text-[13px] text-ink-lighter font-light">
            &copy; 2026 Mano. Made with care in India.
          </div>
          <ul className="flex gap-6 list-none">
            <li>
              <a
                href="#"
                className="text-[13px] text-ink-lighter no-underline font-light hover:text-ink transition-colors"
              >
                Privacy
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-[13px] text-ink-lighter no-underline font-light hover:text-ink transition-colors"
              >
                Terms
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-[13px] text-ink-lighter no-underline font-light hover:text-ink transition-colors"
              >
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
