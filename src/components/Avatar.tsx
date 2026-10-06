import { useState } from 'react';
import { cn } from '../lib/utils';
import { initials } from '../lib/format';

/** Foto redonda/quadrada de piloto ou badge de equipe; cai nas iniciais quando a imagem falha. */
export function Avatar({
  src,
  name,
  size = 40,
  className,
  square = false,
  fit = 'cover',
}: {
  src?: string;
  name: string;
  size?: number;
  className?: string;
  square?: boolean;
  fit?: 'cover' | 'contain';
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  return (
    <div
      className={cn(
        'shrink-0 overflow-hidden bg-surface-container flex items-center justify-center',
        square ? 'rounded-lg' : 'rounded-full',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className={cn('w-full h-full', fit === 'cover' ? 'object-cover object-top' : 'object-contain p-1')}
        />
      ) : (
        <span className="type-label-badge text-text-secondary" style={{ fontSize: Math.max(10, size * 0.32) }}>
          {initials(name)}
        </span>
      )}
    </div>
  );
}
