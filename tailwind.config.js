/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'media',
    content: ['./src/**/*.{html,js,svelte,ts}'],
    important: true,
    theme: {
        extend: {
            fontFamily: {
                sans: [
                    'Inter var, sans-serif',
                    {
                        fontFeatureSettings: '"cv11", "ss01"',
                        fontVariationSettings: '"opsz" 32'
                    }
                ]
            },
            colors: {
                'accent-dark': '#212121'
            }
        }
    },
    plugins: [require('@tailwindcss/typography')]
};
