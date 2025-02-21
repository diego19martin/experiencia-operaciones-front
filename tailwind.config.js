/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
      "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
      "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
      "*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
      extend: {
        colors: {
          border: "hsl(var(--border))",
          input: "hsl(var(--input))",
          ring: "hsl(var(--ring))",
          background: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
          primary: {
            DEFAULT: "hsl(var(--primary))",
            foreground: "hsl(var(--primary-foreground))",
            50: "#eff2ff",
            100: "#e1e5ff",
            200: "#c7d0ff",
            300: "#acb9ff",
            400: "#8a99ff",
            500: "#6b7cff",
            600: "#5264ff",
            700: "#404de6",
            800: "#343ca3",
            900: "#282d7a",
            950: "#181a47",
          },
          secondary: {
            DEFAULT: "hsl(var(--secondary))",
            foreground: "hsl(var(--secondary-foreground))",
            50: "#f5f0ff",
            100: "#ede5ff",
            200: "#d7c7ff",
            300: "#c1a9ff",
            400: "#aa8bff",
            500: "#956dff",
            600: "#7e52ff",
            700: "#643de6",
            800: "#4d31a3",
            900: "#39267a",
            950: "#231847",
          },
          destructive: {
            DEFAULT: "hsl(var(--destructive))",
            foreground: "hsl(var(--destructive-foreground))",
          },
          muted: {
            DEFAULT: "hsl(var(--muted))",
            foreground: "hsl(var(--muted-foreground))",
          },
          accent: {
            DEFAULT: "hsl(var(--accent))",
            foreground: "hsl(var(--accent-foreground))",
          },
          popover: {
            DEFAULT: "hsl(var(--popover))",
            foreground: "hsl(var(--popover-foreground))",
          },
          card: {
            DEFAULT: "hsl(var(--card))",
            foreground: "hsl(var(--card-foreground))",
          },
          chart: {
            1: "hsl(var(--chart-1))",
            2: "hsl(var(--chart-2))",
            3: "hsl(var(--chart-3))",
            4: "hsl(var(--chart-4))",
            5: "hsl(var(--chart-5))",
          },
        },
        borderRadius: {
          lg: "var(--radius)",
          md: "calc(var(--radius) - 2px)",
          sm: "calc(var(--radius) - 4px)",
        },
        backgroundImage: {
          "card-header": "linear-gradient(to right, rgb(17, 24, 39), rgb(75, 85, 99))",
        },
      },
    },
    plugins: [require("tailwindcss-animate")],
  }
  
  