import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import type { LogoProps } from './types';

interface LogoWithLinkProps extends LogoProps {
  to?: string;
  external?: boolean;
}

export const LogoWithLink = memo(({
  to = '/',
  external = false,
  ...logoProps
}: LogoWithLinkProps) => {
  const linkProps = {
    className: 'inline-block focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded',
    'aria-label': `${logoProps.alt || 'DankDeals'} - Go to homepage`
  };

  if (external) {
    return (
      <a href={to} {...linkProps} target="_blank" rel="noopener noreferrer">
        <Logo {...logoProps} />
      </a>
    );
  }

  return (
    <Link to={to} {...linkProps}>
      <Logo {...logoProps} />
    </Link>
  );
});

LogoWithLink.displayName = 'LogoWithLink';