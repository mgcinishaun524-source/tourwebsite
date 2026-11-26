import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  theme?: 'light' | 'dark';
}

export function Breadcrumbs({ items, theme = 'light' }: BreadcrumbsProps) {
  const isDark = theme === 'dark';

  return (
    <nav aria-label="Breadcrumb" className="text-xs tracking-wide">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link
            to="/"
            className={`transition-colors ${
              isDark
                ? 'text-[#F6F4ED]/70 hover:text-[#D9C397]'
                : 'text-[#788078] hover:text-[#102D25]'
            }`}
          >
            Home
          </Link>
        </li>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={isDark ? 'text-[#F6F4ED]/40' : 'text-[#788078]/50'}
              >
                /
              </span>
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className={`transition-colors ${
                    isDark
                      ? 'text-[#F6F4ED]/70 hover:text-[#D9C397]'
                      : 'text-[#788078] hover:text-[#102D25]'
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={isDark ? 'text-[#D9C397]' : 'text-[#102D25] font-medium'}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
