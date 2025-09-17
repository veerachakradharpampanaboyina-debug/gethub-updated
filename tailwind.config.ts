import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        headline: ['Inter', 'sans-serif'],
        code: ['monospace'],
        serif: ['Times New Roman', 'serif'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.300'),
            a: {
              color: theme('colors.primary.DEFAULT'),
              '&:hover': {
                color: theme('colors.primary.DEFAULT'),
              },
            },
          },
        },
        invert: {
           css: {
               '--tw-prose-body': theme('colors.gray[300]'),
               '--tw-prose-headings': theme('colors.white'),
               '--tw-prose-lead': theme('colors.gray.400'),
               '--tw-prose-links': theme('colors.primary.DEFAULT'),
               '--tw-prose-bold': theme('colors.white'),
               '--tw-prose-counters': theme('colors.gray.400'),
               '--tw-prose-bullets': theme('colors.gray.600'),
               '--tw-prose-hr': theme('colors.gray.700'),
               '--tw-prose-quotes': theme('colors.gray.100'),
               '--tw-prose-quote-borders': theme('colors.gray.700'),
               '--tw-prose-captions': theme('colors.gray.400'),
               '--tw-prose-code': theme('colors.white'),
               '--tw-prose-pre-code': theme('colors.gray.300'),
               '--tw-prose-pre-bg': 'rgba(0, 0, 0, 0.2)',
               '--tw-prose-th-borders': theme('colors.gray.600'),
               '--tw-prose-td-borders': theme('colors.gray.700'),
               '--tw-prose-invert-body': theme('colors.gray.300'),
               '--tw-prose-invert-headings': theme('colors.white'),
               '--tw-prose-invert-lead': theme('colors.gray.400'),
               '--tw-prose-invert-links': theme('colors.primary.DEFAULT'),
               '--tw-prose-invert-bold': theme('colors.white'),
               '--tw-prose-invert-counters': theme('colors.gray.400'),
               '--tw-prose-invert-bullets': theme('colors.gray.600'),
               '--tw-prose-invert-hr': theme('colors.gray.700'),
               '--tw-prose-invert-quotes': theme('colors.gray.100'),
               '--tw-prose-invert-quote-borders': theme('colors.gray.700'),
               '--tw-prose-invert-captions': theme('colors.gray.400'),
               '--tw-prose-invert-code': theme('colors.white'),
               '--tw-prose-invert-pre-code': theme('colors.gray.300'),
               '--tw-prose-invert-pre-bg': 'rgba(0, 0, 0, 0.2)',
               '--tw-prose-invert-th-borders': theme('colors.gray.600'),
               '--tw-prose-invert-td-borders': theme('colors.gray.700'),
           },
       },
      }),
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
} satisfies Config;
