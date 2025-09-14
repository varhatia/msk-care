# Exercise Directory Guide

## Overview

The Exercise Directory is a comprehensive system that fetches exercises from external APIs and provides a user-friendly interface for browsing, filtering, and viewing exercise details. This system integrates with multiple exercise databases to provide a rich collection of exercises for rehabilitation centers.

## Features

### 🔄 External API Integration
- **Wger API**: Fetches exercises from the Wger exercise database
- **MuscleWiki API**: Fetches exercises from the MuscleWiki database
- **Manual Entry**: Supports manually added exercises

### 🔍 Advanced Filtering
- **Search**: Search by exercise name, description, or category
- **Category Filter**: Filter by exercise categories (e.g., Lower Body, Upper Body)
- **Difficulty Filter**: Filter by difficulty level (Beginner, Intermediate, Advanced)
- **Source Filter**: Filter by data source (Wger, MuscleWiki, Manual)

### 📱 User Interface
- **Responsive Grid**: Exercise cards adapt to different screen sizes
- **Exercise Details Modal**: Comprehensive view with instructions, metadata, and media
- **Sync Button**: Manual refresh of exercise data from external sources
- **Real-time Updates**: Instant filtering and search results

## API Endpoints

### External Exercise Sync
```
POST /api/external/exercises
```
- Fetches exercises from Wger and MuscleWiki APIs
- Processes and stores exercises in the database
- Returns sync statistics

### Exercise Directory
```
GET /api/center/exercises
```
- Returns all active exercises with filtering support
- Includes metadata from external sources

## Database Schema

### Exercise Model Updates
```prisma
model Exercise {
  id          String   @id @default(cuid())
  name        String
  description String?
  category    String
  difficulty  Difficulty
  duration    Int
  reps        Int?
  sets        Int?
  frequency   String
  videoUrl    String?
  imageUrl    String?
  instructions String?
  isActive    Boolean  @default(true)
  source      String?  // 'wger', 'musclewiki', 'manual'
  sourceId    String?  // ID from external source
  metadata    Json?    // Additional metadata from external sources
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([source, sourceId])
  @@map("exercises")
}
```

## External API Details

### Wger API
- **Base URL**: `https://wger.de/api/v2/`
- **Endpoint**: `/exercise/?language=2&limit=100`
- **Data Includes**: Name, description, category, muscles, equipment, images
- **Rate Limits**: Public API, no authentication required

### MuscleWiki API
- **Base URL**: `https://workoutapi.vercel.app/`
- **Endpoint**: `/exercises`
- **Data Includes**: Name, category, target muscles, instructions, GIF URLs
- **Rate Limits**: Public API, no authentication required

## Usage Instructions

### For Center Administrators

1. **Access Exercise Directory**
   - Navigate to `/dashboard/center/exercises`
   - View all available exercises in a grid layout

2. **Sync External Exercises**
   - Click the "Sync Exercises" button in the header
   - Wait for the sync process to complete
   - View success notification with exercise count

3. **Filter Exercises**
   - Use the search bar to find specific exercises
   - Apply category, difficulty, or source filters
   - Clear all filters with the "Clear Filters" button

4. **View Exercise Details**
   - Click "View Details" on any exercise card
   - Review comprehensive exercise information
   - Check metadata from external sources

### For Physiotherapists

1. **Browse Exercise Library**
   - Use filters to find exercises by target muscle or category
   - Review exercise instructions and equipment requirements
   - Check difficulty levels for patient appropriateness

2. **Create Exercise Plans**
   - Navigate to "Exercise Plans" to create patient-specific plans
   - Select exercises from the directory for inclusion in plans
   - Customize sets, reps, and instructions per patient

## Data Sources

### Wger Database
- **Content**: Comprehensive exercise database with detailed descriptions
- **Images**: Exercise demonstration images
- **Metadata**: Primary/secondary muscles, equipment requirements
- **Categories**: Organized by exercise type and muscle groups

### MuscleWiki Database
- **Content**: Exercise library with animated GIFs
- **Instructions**: Step-by-step exercise instructions
- **Target Muscles**: Specific muscle targeting information
- **Categories**: Organized by muscle groups and exercise types

## Technical Implementation

### Sync Process
1. Fetch data from external APIs
2. Process and normalize exercise data
3. Store in database with source attribution
4. Handle duplicates using source + sourceId unique constraint
5. Preserve existing manual exercises

### Error Handling
- Graceful handling of API failures
- Partial sync success (some APIs may fail)
- User feedback through toast notifications
- Detailed error logging for debugging

### Performance Considerations
- Efficient database queries with proper indexing
- Client-side filtering for responsive UI
- Lazy loading of exercise images
- Optimized API calls with appropriate limits

## Future Enhancements

### Planned Features
- **Scheduled Sync**: Automatic periodic sync of external data
- **Exercise Ratings**: User ratings and reviews for exercises
- **Custom Categories**: User-defined exercise categories
- **Bulk Operations**: Mass import/export of exercises
- **API Rate Limiting**: Respect external API rate limits
- **Caching**: Implement caching for better performance

### Additional Data Sources
- **ExerciseDB**: Additional exercise database integration
- **YouTube API**: Video content integration
- **Custom Sources**: Support for custom exercise databases

## Troubleshooting

### Common Issues

1. **Sync Fails**
   - Check internet connectivity
   - Verify external API availability
   - Review server logs for detailed errors

2. **Missing Exercises**
   - Ensure sync process completed successfully
   - Check filter settings
   - Verify exercise is marked as active

3. **Performance Issues**
   - Clear browser cache
   - Check database connection
   - Monitor server resources

### Support
For technical support or feature requests, please contact the development team or create an issue in the project repository.

## Security Considerations

- **API Access**: External APIs are accessed server-side only
- **Data Validation**: All external data is validated before storage
- **User Permissions**: Only authenticated center users can sync exercises
- **Rate Limiting**: Respect external API rate limits and terms of service

## Compliance

- **Terms of Service**: Ensure compliance with external API terms
- **Data Attribution**: Proper attribution to data sources
- **Privacy**: No personal data shared with external APIs
- **Licensing**: Respect data licensing requirements
