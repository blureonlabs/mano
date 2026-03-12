"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "@/app/(marketing)/marketing.module.css";

const LOGO_URL =
  "https://bjodimpnpwuuoogwufso.supabase.co/storage/v1/object/public/assets/logo.webp";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    document.body.style.overflow = "";
  }, []);

  const toggleMenu = useCallback(() => {
    setMenuOpen((prev) => {
      const next = !prev;
      document.body.style.overflow = next ? "hidden" : "";
      return next;
    });
  }, []);

  return (
    <>
      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
        <Link href="/" className="flex items-center gap-[9px] no-underline">
          <Image
            src={LOGO_URL}
            alt="Mano logo"
            width={32}
            height={32}
            className="rounded-[9px]"
          />
          <span className="font-heading text-base font-medium text-ink tracking-tight">
            Mano
          </span>
        </Link>

        <ul className={styles.navLinks}>
          <li>
            <a href="#features" className={styles.navLink}>
              Features
            </a>
          </li>
          <li>
            <a href="#privacy" className={styles.navLink}>
              Privacy
            </a>
          </li>
          <li>
            <a href="#pricing" className={styles.navLink}>
              Pricing
            </a>
          </li>
          <li>
            <Link href="/login" className={`${styles.navLink} ${styles.navSignIn}`}>
              Sign In
            </Link>
          </li>
          <li>
            <Link
              href="/signup"
              className={`${styles.navLink} ${styles.navCta}`}
            >
              Get Started
            </Link>
          </li>
        </ul>

        <button
          className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ""}`}
          onClick={toggleMenu}
          aria-label="Open menu"
        >
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
        </button>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ""}`}
      >
        <ul className="list-none flex flex-col gap-1 mb-5">
          <li>
            <a href="#features" className={styles.mobileMenuLink} onClick={closeMenu}>
              Features
            </a>
          </li>
          <li>
            <a href="#privacy" className={styles.mobileMenuLink} onClick={closeMenu}>
              Privacy
            </a>
          </li>
          <li>
            <a href="#pricing" className={styles.mobileMenuLink} onClick={closeMenu}>
              Pricing
            </a>
          </li>
        </ul>
        <Link href="/signup" className={styles.mobileMenuCta} onClick={closeMenu}>
          Get Started Free &rarr;
        </Link>
        <Link href="/login" className={styles.mobileSignIn} onClick={closeMenu}>
          Sign In
        </Link>
      </div>
    </>
  );
}
