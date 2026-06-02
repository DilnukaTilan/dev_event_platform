import Image from "next/image";
import Link from "next/link";

const footerLinks = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/create-event", label: "Create Event" },
];

const Footer = () => {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-brand-group">
          <Link href="/" className="footer-brand">
            <Image
              src="/icons/logo.png"
              alt="DevEvent logo"
              width={24}
              height={24}
            />
            <span>DevEvent</span>
          </Link>

          <p>
            Curated developer events, meetups, and conferences in one place.
          </p>
        </div>

        <div className="footer-meta">
          <nav aria-label="Footer navigation">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>

          <small>
            &copy; {new Date().getFullYear()} DevEvent. All rights reserved.
          </small>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
