import React from 'react';
import {
  Utensils,
  Car,
  ShoppingBag,
  GraduationCap,
  HeartPulse,
  Home,
  FileText,
  UserCheck,
  MoreHorizontal,
  Folder,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryIconProps {
  name?: string;
  icon?: string;
  className?: string;
  size?: number;
}

export function CategoryIcon({ name, icon, className, size = 18 }: CategoryIconProps) {
  const normalized = (icon || name || '').toLowerCase();

  const iconProps = {
    className: cn('shrink-0', className),
    size,
  };

  if (normalized.includes('food') || normalized.includes('utensils')) {
    return <Utensils {...iconProps} />;
  }
  if (normalized.includes('transport') || normalized.includes('car')) {
    return <Car {...iconProps} />;
  }
  if (normalized.includes('shopping') || normalized.includes('bag')) {
    return <ShoppingBag {...iconProps} />;
  }
  if (normalized.includes('education') || normalized.includes('graduation')) {
    return <GraduationCap {...iconProps} />;
  }
  if (normalized.includes('health') || normalized.includes('heart') || normalized.includes('pulse')) {
    return <HeartPulse {...iconProps} />;
  }
  if (normalized.includes('home') || normalized.includes('house')) {
    return <Home {...iconProps} />;
  }
  if (normalized.includes('bill') || normalized.includes('file')) {
    return <FileText {...iconProps} />;
  }
  if (normalized.includes('personal') || normalized.includes('user')) {
    return <UserCheck {...iconProps} />;
  }

  return <MoreHorizontal {...iconProps} />;
}
