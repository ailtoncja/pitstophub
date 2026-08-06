import React from 'react';

type IconProps = {
  className?: string;
  style?: React.CSSProperties;
};

// Silhuetas reais (recortadas de referências pedidas pelo usuário), aplicadas
// como máscara CSS em vez de <img> - assim elas continuam pegando a cor do
// tema/categoria (currentColor) igual os ícones da lucide-react faziam antes,
// só que com a forma de cada carro de verdade em vez de um ícone genérico.
// Uma imagem por arquétipo, reaproveitada entre categorias parecidas.
function MaskIcon({ src, className, style }: IconProps & { src: string }) {
  const maskStyle: React.CSSProperties = {
    backgroundColor: 'currentColor',
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
    display: 'inline-block',
    ...style,
  };
  return <span className={className} style={maskStyle} />;
}

export function OpenWheelCarIcon(props: IconProps) {
  return <MaskIcon {...props} src="/icons/categories/car-openwheel.png" />;
}

export function HypercarIcon(props: IconProps) {
  return <MaskIcon {...props} src="/icons/categories/car-hypercar.png" />;
}

export function GtCarIcon(props: IconProps) {
  return <MaskIcon {...props} src="/icons/categories/car-gt3.png" />;
}

export function RallyCarIcon(props: IconProps) {
  return <MaskIcon {...props} src="/icons/categories/car-rally.png" />;
}

export function StockCarIcon(props: IconProps) {
  return <MaskIcon {...props} src="/icons/categories/car-stockcar.png" />;
}
