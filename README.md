# FamilyBook - Family Network Management Application

A comprehensive web application for managing family networks, sharing photos/videos, and visualizing relationships between family members.

## Features

### 🏠 Family Member Management
- **Add Family Members**: Complete form with personal information including:
  - Name, email, phone number
  - Date of birth and address
  - Relationship type (Parent, Child, Sibling, Spouse, etc.)
  - Related family member selection
- **View Family Members**: Interactive list displaying all added family members
- **Dynamic Updates**: Real-time updates across all application sections

### 📸 Photo & Video Sharing
- **File Upload**: Support for photos and videos
- **Descriptions**: Add contextual descriptions to shared media
- **Family Integration**: Share content with specific family members

### 🔗 Relationship Mapping
- **Visual Network**: Interactive network diagram showing family connections
- **Real-time Visualization**: Updates automatically as new members are added
- **Relationship Indicators**: Clear visual representation of family relationships

### 🔍 Dependency Chain Analysis
- **Relationship Checker**: Find connection paths between any two family members
- **Dynamic Selection**: Dropdown menus populated with current family members
- **Relationship Visualization**: Shows how family members are connected

## Technical Implementation

### Architecture
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Modern responsive design with CSS Grid and Flexbox
- **Data Management**: Client-side JavaScript with local data storage
- **Visualization**: Custom JavaScript for relationship mapping

### File Structure
```
familybook/
├── index.html          # Main application interface
├── styles.css          # Comprehensive styling and responsive design
├── script.js           # Application logic and functionality
└── README.md          # Documentation (this file)
```

### Key Components

#### HTML Structure
- **Navigation Tabs**: Seamless switching between different application sections
- **Forms**: Comprehensive family member input with validation
- **Interactive Elements**: Dynamic lists, dropdowns, and file inputs

#### CSS Features
- **Responsive Design**: Mobile-first approach with breakpoints
- **Modern UI**: Clean, professional styling with consistent color scheme
- **Interactive Elements**: Hover effects and smooth transitions
- **Grid Layout**: Organized content presentation

#### JavaScript Functionality
- **Family Member Management**: CRUD operations for family data
- **Relationship Processing**: Logic for connecting family members
- **Network Visualization**: Dynamic relationship mapping
- **Form Validation**: Input validation and user feedback
- **Dynamic UI Updates**: Real-time interface updates

## Usage Instructions

### Getting Started
1. Open `index.html` in a modern web browser
2. Navigate between sections using the top navigation tabs

### Adding Family Members
1. Go to the "Add Family Member" tab
2. Fill in the required information:
   - **Name**: Full name of the family member
   - **Email**: Contact email address
   - **Phone**: Contact phone number
   - **Date of Birth**: Use the date picker
   - **Address**: Physical address
   - **Relationship**: Select from dropdown (Parent, Child, Sibling, Spouse, etc.)
   - **Related to**: Choose existing family member (for relationship mapping)
3. Click "Add Family Member" to save

### Sharing Photos/Videos
1. Navigate to "Share Photo/Video" tab
2. Click "Choose File" to select media
3. Add a description in the text area
4. Submit to share with family network

### Viewing Relationships
1. **Family Members List**: View all added members in organized list
2. **Relationship Map**: Visual network showing family connections
3. **Dependency Chain**: Check relationships between specific members

### Checking Relationship Chains
1. Go to "Check Dependency Chain" tab
2. Select two family members from the dropdowns
3. View the connection path between them

## Browser Compatibility

- **Chrome**: Fully supported (recommended)
- **Firefox**: Fully supported
- **Safari**: Fully supported
- **Edge**: Fully supported

## Future Enhancements

### Planned Features
- **Data Persistence**: Local storage or database integration
- **Advanced Visualization**: Enhanced relationship graphics
- **Photo Gallery**: Comprehensive media management
- **Export Features**: Generate family trees and reports
- **User Authentication**: Multi-user family networks
- **Mobile App**: Native mobile application

### Technical Improvements
- **Backend Integration**: Server-side data management
- **Real-time Sync**: Multi-device synchronization
- **Advanced Search**: Enhanced family member discovery
- **Data Import/Export**: CSV and JSON support

## Development

### Local Development
1. Clone or download the project files
2. Open `index.html` directly in a web browser
3. No build process or server setup required

### Customization
- **Styling**: Modify `styles.css` for visual customization
- **Functionality**: Extend `script.js` for additional features
- **Layout**: Adjust `index.html` for structural changes

## License

This project is open source and available for personal and educational use.

## Support

For questions or support, please refer to the source code comments or create an issue in the project repository.

---

**FamilyBook** - Connecting families through technology 👨‍👩‍👧‍👦
