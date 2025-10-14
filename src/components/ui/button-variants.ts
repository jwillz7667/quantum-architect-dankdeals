import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-md hover:shadow-glow hover:scale-105 transform transition-all duration-200',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border-2 border-primary/50 bg-transparent text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-glow',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm',
        ghost: 'hover:bg-secondary/50 hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline hover:text-primary-hover',
        premium:
          'bg-gradient-green text-primary-foreground shadow-md hover:shadow-glow hover:scale-105',
        'primary-inverted':
          'bg-card text-primary shadow-md hover:bg-card-elevated hover:shadow-elevated transform hover:-translate-y-0.5',
      },
      size: {
        default: 'h-12 px-6 py-3',
        sm: 'h-10 px-4 py-2 text-sm',
        lg: 'h-14 px-8 py-4 text-base font-bold',
        icon: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
