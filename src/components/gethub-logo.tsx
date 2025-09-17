import Image from 'next/image';
import type { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

export default function GethubLogo(props: Partial<ImageProps>) {
  const { width = 200, height = 200, className, ...rest } = props;
  return (
    <Image
      src="https://i.ibb.co/xqNC3WZC/logo-jpg.jpg"
      alt="GETHUB Logo"
      width={width}
      height={height}
      className={cn('rounded-lg', className)}
      {...rest}
    />
  );
}
