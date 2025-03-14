# BGP Looking Glass

A modern web application that provides a global view of BGP (Border Gateway Protocol) routing information for any IP address. This tool helps network engineers, administrators, and curious users understand how their IP addresses are seen and reached across the internet.

## Features

- 🌐 Global BGP route visualization
- 🔍 Real-time IP address lookup
- 🗺️ Worldwide route collector data
- 🏷️ BGP community interpretation
- 📊 Geographic distribution of routes
- 🎨 Dark mode UI with intuitive design

## API Integration

This project uses the RIPE NCC Stat API, specifically:

- `https://stat.ripe.net/data/bgp-state/data.json` - For fetching current BGP routing information
- `https://stat.ripe.net/data/whats-my-ip/data.json` - For detecting user's public IP address

No API key is required as these endpoints are publicly accessible.

## Prerequisites

Before running this project, make sure you have:

- Node.js 16.x or higher
- npm (Node Package Manager)

## Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd bgp-looking-glass
```

2. Install dependencies:
```bash
npm install
```

## Running the Project

To run the project in development mode:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

To build for production:

```bash
npm run build
npm start
```

## Project Structure

- `app/page.tsx` - Main application component with BGP lookup functionality
- `app/layout.tsx` - Root layout component
- Components are built using React and styled with Tailwind CSS

## Understanding the Output

The tool provides:
- Network paths showing how traffic reaches the target IP
- BGP community information with explanations
- Route collector locations and their observations
- Geographic distribution of routing data

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[Your chosen license]

## Acknowledgments

- RIPE NCC for providing the BGP data API
- Next.js and Vercel for the development framework
- Tailwind CSS for styling
