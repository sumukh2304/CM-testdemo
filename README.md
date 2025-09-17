
A modern streaming platform for cartoons and movies built with React Native and React for web.


- **Responsive Layout**: Optimized for all screen sizes
- **Smooth Animations**: Hover effects and transitions
- **Professional Typography**: Clear hierarchy and readability

### 🔐 Authentication
- **Login/Register**: Beautiful auth pages with form 
- **Role-based Access**: Viewer and Creator roles
- **Secure Authentication**: AWS Cognito integratio

### 🎬 Content Management
- **Hero Section**: Featured content with video previews
- **Content Rows**: Organized by genre, type, and trending
- **Hover Previews**: Modern hover cards with video previews
- **Responsive Grid**: Adaptive layout for different screen sizes

### 📱 Cross-Platform
- **Web App**: React-based web application
- **Mobile App**: React Native for iOS and Android
- **Unified Codebase**: Shared components and logic

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI (for mobile development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "cartoon web"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   # For web
   npm run web
   
   # For mobile
   npm start
   ```

## 🎯 Usage

### Web Application
1. Open your browser and navigate to the local development URL
2. Create an account or sign in
3. Browse content by category and genre
4. Hover over content cards for previews
5. Click to watch videos

### Mobile Application
1. Use Expo Go app to scan the QR code
2. Navigate through the mobile-optimized interface
3. Enjoy the same content on your mobile device

## 🏗️ Architecture

### Components Structure
```
src/
├── components/          # Reusable UI components
│   ├── ContentRow.tsx  # Horizontal scrolling rows
│   ├── VideoHero.tsx   # Hero section with featured content
│   ├── SiteHeader.tsx  # Navigation header
│   └── SiteFooter.tsx  # Footer with links
├── pages/              # Page components
│   ├── auth/           # Authentication pages
│   ├── viewer/         # Viewer-specific pages
│   └── Home.tsx        # Landing page
```

### Key Features
- **ContentCard**: Hover effects, video previews, metadata display
- **ContentRow**: Horizontal scrolling with navigation buttons
- **VideoHero**: Featured content showcase with call-to-action
- **Responsive Design**: Mobile-first approach with breakpoints

## 🎨 Design System

### Color Palette
- **Primary**: Burnt Orange (#CC5500)
- **Secondary**: Olive Green (#708238)
- **Background**: Dark (#0f0f14, #18181b)
- **Text**: White and gray variations
- **Accents**: Blue, purple gradients for hero sections

### Typography
- **Headings**: Bold, large fonts for impact
- **Body**: Readable sans-serif fonts
- **Hierarchy**: Clear visual hierarchy with size and weight

### Components
- **Buttons**: Primary and secondary buttons with bold styling
- **Cards**: Hover effects with scale and shadow
- **Forms**: Clean input fields with focus states
- **Navigation**: Transparent header with scroll effects

## 🔧 Customization

### Styling
The application uses a custom CSS file (`src/styles.css`) with reusable utility classes:

```css
/* Button styles */
.btn-primary { /* Primary red button */ }
.btn-secondary { /* Transparent button */ }

/* Content styles */
.content-card { /* Content card base */ }
.hover-preview { /* Hover preview overlay */ }

/* Layout styles */
.hero-section { /* Hero section layout */ }
.content-row { /* Content row container */ }
```

### Adding New Content
1. Content is automatically organized by type and genre
2. Add new content through the API endpoints
3. Content will appear in appropriate rows automatically

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 768px  
- **Desktop**: > 768px

### Mobile Optimizations
- Touch-friendly buttons and interactions
- Optimized spacing for small screens
- Simplified navigation for mobile

## 🚀 Performance

### Optimizations
- Lazy loading of content
- Efficient scrolling with virtual lists
- Optimized images and thumbnails
- Smooth animations with CSS transforms

### Best Practices
- Minimal re-renders with React optimization
- Efficient state management
- Optimized bundle size

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both web and mobile
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with modern web technologies
- Cross-platform compatibility with React Native

---

**CartoonMovie** - Bringing the magic of cartoons and movies to your screens with a modern experience.

