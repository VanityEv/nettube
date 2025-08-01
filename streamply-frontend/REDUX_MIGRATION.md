# Redux Toolkit Migration Guide

## Overview
This document outlines the migration from Zustand to Redux Toolkit for the Streamply frontend.

## Migration Progress

### ✅ Completed
1. **Redux Store Setup**
   - Created store configuration with persistence
   - Set up typed hooks (`useAppDispatch`, `useAppSelector`)
   - Created slices for user, videos, and exploration state

2. **Core Components Migrated**
   - `AppBarRedux.tsx` - Redux version of AppBar component
   - `SignInPanelRedux.tsx` - Redux version of SignInPanel component  
   - `PersonalDataRedux.tsx` - Redux version of PersonalData component

3. **App Integration**
   - Updated `App.tsx` to use Redux Provider and PersistGate
   - Maintained backward compatibility during migration

### 🔄 In Progress
- Testing Redux components alongside Zustand versions
- Avatar functionality verification with Redux state management

### ⏳ Pending Migration
The following components still use Zustand and need to be migrated:

#### High Priority (Core Functionality)
- `EpisodePlayer.tsx` - Uses `useUserStore` for username
- `MoviePlayer.tsx` - Uses `useUserStore` for username  
- `VideoViews/SingleVideo.tsx` - Uses likes and setLikes
- `SignInPanel.tsx` - Current login component (replace with Redux version)

#### Medium Priority (User Interface)
- `ContinueWatching/ContinueWatching.tsx` - Uses username
- `AccountPanel/contents/UserReviews.tsx` - Uses username
- `AccountPanel/contents/Watchlist.tsx` - Uses likes
- `VideoPage/contents/AddReviewField.tsx` - Uses avatarUrl and username

#### Lower Priority (Suggestions & Enhancements)  
- `MovieSuggestions/MovieSuggestions.tsx` - Uses likes and username
- `StripeCheckoutButton.tsx` - Uses username
- `HomePage.tsx` - Uses likes

## Migration Steps for Each Component

### 1. Replace Import
```tsx
// Old Zustand
import { useUserStore } from '../state/userStore';
import { useVideosStore } from '../state/videosStore';

// New Redux  
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { setUserData } from '../store/slices/userSlice';
import { fetchAllVideos } from '../store/slices/videosSlice';
```

### 2. Replace Hook Usage
```tsx
// Old Zustand
const { username, avatarUrl, likes } = useUserStore();
const { setUserData } = useUserStore();
const { videos, setVideos } = useVideosStore();

// New Redux
const { username, avatarUrl, likes } = useAppSelector((state) => state.user);
const { videos } = useAppSelector((state) => state.videos);
const dispatch = useAppDispatch();

// Actions
dispatch(setUserData(username));
dispatch(fetchAllVideos());
```

### 3. Handle Async Actions
```tsx
// Old Zustand (Promise-based)
await setUserData(username);

// New Redux (Thunk-based)
dispatch(setUserData(username));
```

## Key Benefits of Redux Migration

1. **Better DevTools**: Redux DevTools provide excellent debugging capabilities
2. **Predictable State Updates**: Actions and reducers make state changes traceable  
3. **Middleware Support**: Easy integration of logging, persistence, etc.
4. **Time Travel Debugging**: Ability to replay actions and inspect state history
5. **Ecosystem**: Large ecosystem of Redux middleware and tools

## Testing Strategy

1. **Parallel Components**: Create Redux versions alongside Zustand versions
2. **Feature Flags**: Use environment variables to toggle between implementations
3. **Gradual Migration**: Replace components one by one after testing
4. **Avatar Fix**: The Redux version should resolve the AppBar avatar display issue

## Avatar Issue Resolution

The Redux migration specifically addresses the avatar display issue:

1. **Zustand Issue**: `PersonalData` component updates local state but doesn't refresh `AppBar`
2. **Redux Solution**: Centralized state management ensures all components reflect avatar updates
3. **Implementation**: `PersonalDataRedux` dispatches `setUserData` action that updates global state

## Next Steps

1. Test `AppBarRedux` and `PersonalDataRedux` components
2. Verify avatar upload/display functionality  
3. Replace original components with Redux versions
4. Continue migrating remaining components
5. Remove Zustand dependencies once migration is complete
