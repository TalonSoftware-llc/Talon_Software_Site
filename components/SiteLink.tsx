import Link from "next/link";

type SiteLinkProps = {
  href: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  "aria-label"?: string;
  "aria-current"?: "page" | "true" | undefined;
};

export default function SiteLink({
  href,
  className,
  children,
  onClick,
  "aria-label": ariaLabel,
  "aria-current": ariaCurrent,
}: SiteLinkProps) {
  if (href.startsWith("https://") || href.startsWith("http://")) {
    return (
      <a href={href} className={className} onClick={onClick} aria-label={ariaLabel} aria-current={ariaCurrent}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} onClick={onClick} aria-label={ariaLabel} aria-current={ariaCurrent}>
      {children}
    </Link>
  );
}
