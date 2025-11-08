# Gradtrack Configuration

## Frontend URL Setup

To configure the frontend URL for career navigation, you have two options:

### Option 1: Set in HTML (Recommended)
Add this script tag in `src/index.html` before your main script:

```html
<script>
    // Set your frontend URL here
    window.FRONTEND_URL = 'https://your-frontend-domain.com';
</script>
```

### Option 2: Modify BeachSection.js
Edit `src/javascript/World/Sections/BeachSection.js` and change the default URL:

```javascript
const frontendBaseUrl = window.FRONTEND_URL || 'https://your-frontend-domain.com'
```

## Career Areas

The beach scene includes 8 career areas:

1. **Software Engineering** (North) - `/career/software-engineering`
2. **Data Science** (Northeast) - `/career/data-science`
3. **Business** (East) - `/career/business`
4. **Design** (Southeast) - `/career/design`
5. **Healthcare** (South) - `/career/healthcare`
6. **Finance** (Southwest) - `/career/finance`
7. **Education** (West) - `/career/education`
8. **Engineering** (Northwest) - `/career/engineering`

## Navigation Flow

1. User drives boat to a career area
2. When boat enters area, visual feedback appears (fence animation, key icon)
3. User presses `F`, `E`, or `Enter` to interact
4. New tab opens with frontend URL: `{FRONTEND_URL}/career/{careerId}`

## Customizing Career Areas

To add/modify career areas, edit `src/javascript/World/Sections/BeachSection.js` in the `setCareerAreas()` method.

