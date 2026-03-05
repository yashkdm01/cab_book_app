module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",      
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",     
    "./components/**/*.{js,ts,jsx,tsx,mdx}", 
    "./src/**/*.{js,ts,jsx,tsx,mdx}",       
  ],
  theme: {
    extend: {
      colors: {
        cab: {
          primary: '#6366f1',     
          secondary: '#a855f7',   
          dark: '#1e1b4b',        
        },
      },
      backgroundImage: {
        'cab-gradient': 'linear-gradient(to bottom right, #1e1b4b, #4c1d95)',
      },
    },
  },
  plugins: [],
}
