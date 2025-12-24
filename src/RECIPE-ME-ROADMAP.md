# Recipe Me - Issues & Roadmap

**Last Updated:** December 23, 2024  
**Status:** ✅ Portfolio site LIVE at recipe-me.calebhamilton.com

---

## 🎉 Recent Wins

- ✅ Site deployed to production successfully
- ✅ Fixed slug routing system (hash-to-pretty-URL upgrade)
- ✅ Fixed Auth0 login/logout (removed environment variable semicolons)
- ✅ Configured Netlify secrets scanning
- ✅ Portfolio piece is functional and demonstrable to employers

---

## 🔥 Critical Fixes (High Priority)

### 1. Button Visibility - All Modals
**Problem:** Modal buttons have invisible text (white on white background)  
**Affected:** Directions modal, Ingredients modal, all dialog buttons  
**Fix:** Add CSS to ensure visible button text
```css
.modal button,
dialog button {
  color: #000 !important;
}
```

### 2. Video Feature - Incomplete Implementation
**Problem:** "Add to Article" button doesn't work, videos not saved or displayed  
**What's Broken:**
- ❌ "Add to Article" button has no functionality
- ❌ Video URL not saved to localStorage/database
- ❌ No video player on article page

**What Works:**
- ✅ UI to paste YouTube/Vimeo link exists
- ✅ Auto-embed code exists (from earlier implementation)

**UI Improvement:**
- Replace static explanation text with popover tooltip (ℹ️ icon)
- Tooltip message: "Use YouTube as your video library - embed cooking videos, technique guides, and tutorials directly in your recipes"
- Reduces page clutter while still providing helpful context

**Fix Needed:**
- Wire up "Add to Article" button
- Save video URL to database
- Display embedded video player on article page
- Convert explanation text to popover tooltip

---

## 🎨 UI/UX Improvements

### Article Page

#### 3. Featured Image Duplication
**Problem:** Featured image displays twice (hero + in gallery)  
**Options:**
- Remove featured from gallery entirely (cleanest)
- Make featured span 2 columns in grid
- Keep as-is with visual indicator

#### 4. Photo Attribution Layout
**Problem:** Credits cluttered on each individual image  
**Solution:** Group all photo credits in single section below gallery
```html
<div class="image-credits">
  <small>
    Photos by 
    <a href="...">Sebastian Coman Photography</a> (2),
    <a href="...">Farhad Ibrahimzade</a> (2)
    on <a href="https://unsplash.com">Unsplash</a>
  </small>
</div>
```

### Edit Page

#### 5. Published/Unpublished Toggle
**Problem:** Unclear if toggle actually updates database  
**Current State:**
- ✅ Button exists and changes visual state
- ❓ Database update uncertain - needs verification
- ❌ Button styling is cut off/poorly styled

**Needs:**
- Verify database integration (check if recipe.isPublic field updates)
- Fix button styling/layout in header
- Add loading state during save
- Show confirmation when state changes

#### 6. Article Editor - Raw URLs
**Problem:** Editor showing raw markdown/image URLs instead of rendering  
**Issue:** Split view (markdown/WYSIWYG) may be confusing

#### 7. Image Gallery Controls
**Current Controls:**
- ⭐ Star = Set as featured image (works)
- Arrows = Reorder images (need to verify functionality)
- Drag & drop = Reorder images (works)
- 🔒 Lock = Attribution required (intentional indicator)
- Delete = Remove image

**Problems:**
- ❌ Delete button only appears on last image (must shift images to end to delete)
- ❌ Featured star placement awkward (bottom left)
- ❓ Arrow buttons may be redundant if drag works

**Fixes Needed:**
- Add delete button/icon to ALL images (not just last one)
- Move featured star to top corner
- Verify arrow buttons work; remove if redundant with drag
- Consider trash icon overlay on hover instead of persistent button

#### 8. Overlapping Controls
**Problem:** Too many competing buttons and controls  
**Fix:** Simplify and organize control hierarchy

### Profile Page

#### 9. Design Consistency
**Problem:** Profile page styling doesn't match rest of site  
**Needs:**
- Review overall layout and design language
- Ensure consistent typography, spacing, colors
- Match card styles to homepage recipe cards
- Consistent header/navigation treatment
- Polish avatar display and edit controls

### Modals

#### 10. Unsplash Modal Layout
**Problems:**
- Images too small (hard to see details)
- Attribution text overlapping messily
- Photographer names with weird empty buttons
- No clear selection UI

**Note:** Lock icons indicate "attribution required" (intentional design)

**Improvements Needed:**
- Larger image previews
- Clean attribution on hover or below
- Clear "Select" button on each image
- Visual indicator for selected image (checkmark/highlight)
- Consider tooltip for lock icon ("Attribution Required")

#### 11-12. Modal UX (Covered in #10)

---

## 🏗️ Homepage Redesign (Design Phase Required)

**Status:** Needs design before implementation  
**Goal:** Create distinctive design that sets Recipe Me apart

### Current Issues:
- Search bar moves/floats unpredictably
- Hero section too tall with minimal content
- Tags are messy, not organized navigation
- Recipe cards show too much info (title + paragraph)
- Sort dropdown not near results

### Proposed New Layout:
```
┌─────────────────────────────────────┐
│ Header: Logo | Search | User        │
├─────────────────────────────────────┤
│ [Hero: Shorter or Feature Content]  │
├─────────────────────────────────────┤
│ Categories (Horizontal Nav)         │
├─────────────────────────────────────┤
│ Sort: [Last modified ▼]             │
├─────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │Image │ │Image │ │Image │         │
│ │Title │ │Title │ │Title │         │
│ │★★★★☆│ │★★★★★│ │★★☆☆☆│         │
│ └──────┘ └──────┘ └──────┘         │
└─────────────────────────────────────┘
```

### Specific Changes:
13. **Move search to header** - Fixed, predictable placement
14. **Redesign hero** - Shorter, or feature blog/carousel
15. **Categories as navigation** - Replace random tags with organized nav (like AllRecipes)
16. **Simplified recipe cards** - Image + Title + Rating only (remove description paragraph)

**Next Step:** Design mockups before coding

---

## 🚀 Future Features

### 17. Recipe Viewing History
**Goal:** Like YouTube's viewing history  
**Features:**
- Track recipes viewed in localStorage
- Works for logged-in and anonymous users
- Show "Return to last viewed recipe" banner after login/logout
- Display recent history on profile or dedicated page
- Keep last 50 recipes, newest first
- Allow removal of individual items (each has unique ID)

**Potential Enhancement:** Sync localStorage history to database on signup

### 18. Recipe Forking System
**Goal:** GitHub-style forking with IP protection  

**What Gets Forked:**
- ✅ Ingredients list
- ✅ Cooking directions/steps
- ✅ Prep/cook times, servings, difficulty

**What Does NOT Get Forked (Copyright Protection):**
- ❌ Story/article prose
- ❌ Images/videos
- ❌ Personal anecdotes

**Required When Forking:**
- Must add your own story and images
- Must explain your variation
- Automatic attribution: "Forked from @original_author's Recipe"
- Family tree view showing recipe lineage
- Original author credit cannot be removed

**UI Flow:**
```
[Fork Recipe button]
↓
"You're forking @chef_caleb's Carbonara
 ✓ Ingredients and steps will copy
 ✗ You'll need to add your own story and images
 
 Why are you making this recipe your own?"
 
[Text area for variation notes]
[Continue to Edit]
```

---

## 🔧 Technical Debt

### Direct Pretty URL Access
**Problem:** Netlify redirects not working even in production  
**Current State:**
- ✅ Hash-to-pretty-URL upgrade works (recipes load, URLs look clean)
- ❌ Direct navigation to pretty URLs fails (e.g., pasting `/@chef_caleb/carbonara` in new tab)

**Impact:** 
- Low priority - site works for normal navigation
- Prevents sharing pretty URLs directly

**Investigation Needed:**
- Why aren't `_redirects` or `netlify.toml` redirects processing?
- May need to debug Netlify configuration

### Netlify Build Image Update
**Deadline:** January 1, 2026  
**Action:** Update from Focal to Jammy/Noble build image  
**Priority:** Low (plenty of time)

---

## 📝 Notes

### Working Patterns
- **Slug System:** Hash URLs (`/article.html#recipe-id`) auto-upgrade to pretty URLs (`/@username/slug`) via JavaScript
- **Auth0:** Redirects to homepage from pretty URLs (can't return to exact page due to callback limitations)
- **Deployment:** PR → Deploy Preview → Merge to main → Auto-deploy to production

### Environment Variable Reminder
- Never use semicolons in Netlify environment variables
- Required for production: `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_AUDIENCE`

### Patterns to Maintain
- Use absolute paths (`/`) not relative (`./`) for all links/resources
- All recipe cards should use consistent link format: `/article.html#${recipe.id}`
- Profile page follows same pattern as index page

---

## 🎯 Next Session Priorities

1. **Quick wins:** Fix button visibility CSS (affects all modals)
2. **Video feature:** Complete implementation + convert explanation to popover
3. **Published toggle:** Verify database integration
4. **Article page:** Remove featured image from gallery, consolidate photo credits
5. **Image gallery:** Fix delete button (should be on all images, not just last)
6. **Edit page:** Fix Published/Unpublished button styling
7. **Profile page:** Update styling to match site design language
8. **Design phase:** Create homepage redesign mockups before coding

---

**Remember:** Portfolio site is live and working! These are enhancements, not blockers. 🚀
