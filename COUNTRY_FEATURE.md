# Country Feature Implementation

## Overview

Added country selection functionality to separate menu data by country:
- **China Office** 🇨🇳
- **VN GCC** 🇻🇳

## Features

1. **Country Selection Modal**
   - Appears on first visit
   - Prompt: "Hey, so which corner of the world are you hanging out in? 😄"
   - Two buttons: China Office and VN GCC
   - Selection saved in localStorage

2. **Data Separation**
   - Menu items are filtered by selected country
   - Orders are filtered by selected country
   - Each country has its own menu and orders

3. **Database Changes**
   - Added `country` field to `menu_items` table
   - Added `country` field to `orders` table
   - Existing data set to "China Office"

## Implementation Details

### Database Schema
```sql
ALTER TABLE menu_items ADD COLUMN country VARCHAR(50) DEFAULT 'China Office' AFTER tag;
ALTER TABLE orders ADD COLUMN country VARCHAR(50) DEFAULT 'China Office' AFTER name;
```

### API Changes
- `GET /api/menu-items?country=China Office` - Filter by country
- `GET /api/orders?country=China Office` - Filter by country
- `POST /api/menu-items` - Includes country in items
- `POST /api/orders` - Includes country in order

### Frontend Changes
- Country selection modal in `index.html`
- Country stored in `localStorage.getItem('selectedCountry')`
- Menu items and orders filtered by selected country
- New items/orders automatically tagged with selected country

## Usage

1. **First Visit**: User selects country from modal
2. **Subsequent Visits**: Country remembered from localStorage
3. **Switching Country**: Clear localStorage and reload page

## Files Modified

- `index.html` - Added country selection modal
- `styles.css` - Added modal styles
- `script.js` - Added country selection logic
- `mysql-db.js` - Added country parameter to API calls
- `api-server.js` - Added country filtering to endpoints
- `add-country-field.sql` - Database migration script
- `update-existing-data-to-china-office.js` - Data migration script

## Testing

1. Clear localStorage: `localStorage.clear()`
2. Reload page - should show country selection modal
3. Select "China Office" - should show China Office menu
4. Clear localStorage again
5. Select "VN GCC" - should show empty menu (no VN GCC data yet)
6. Add menu item in VN GCC - should only appear in VN GCC

## Notes

- Existing 52 menu items are set to "China Office"
- New items automatically get the selected country
- Orders are tagged with the country when created
- Country selection persists across sessions via localStorage

