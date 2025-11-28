# 🎨 Saved Designs Integration Guide

Complete integration of AI-generated images across all platform apps.

## ✅ Phase 1: Backend Setup (COMPLETE)

- [x] `saved_designs` table created in Supabase
- [x] `designs` storage bucket created (public)
- [x] Indexes added for performance
- [x] RLS disabled (nonprofit security approach)
- [x] Gemini's AI Design App can save/load designs

## ✅ Phase 2: Picker Component (COMPLETE)

- [x] `SavedDesignsPicker` component created
- [x] Grid view with thumbnails
- [x] Search and filter functionality
- [x] Preview modal
- [x] Delete functionality
- [x] Multi-select support
- [x] Responsive design

---

## 📖 Usage Guide

### Basic Usage

```typescript
import { SavedDesignsPicker } from './components/shared/SavedDesignsPicker';

function MyComponent() {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <>
      <button onClick={() => setShowPicker(true)}>
        Choose AI Design
      </button>

      {showPicker && (
        <SavedDesignsPicker
          onSelect={(design) => {
            console.log('Selected:', design);
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
```

---

## 🛒 Marketplace Integration

**Use Case:** Add AI-generated product images

```typescript
// In AddProductModal.tsx or ProductForm.tsx

import { SavedDesignsPicker, SavedDesign } from './components/shared/SavedDesignsPicker';

function AddProductModal() {
  const [showDesignPicker, setShowDesignPicker] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);

  const handleSelectDesign = (design: SavedDesign) => {
    // Add design image to product
    setProductImages(prev => [...prev, design.thumbnail_url]);
    setShowDesignPicker(false);
  };

  return (
    <div>
      {/* Existing product form fields */}
      
      <div className="mt-4">
        <label className="block text-sm font-medium mb-2">
          Product Images
        </label>
        
        {/* Display selected images */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {productImages.map((url, idx) => (
            <img key={idx} src={url} alt={`Product ${idx}`} 
                 className="w-full aspect-square object-cover rounded" />
          ))}
        </div>

        {/* Button to open design picker */}
        <button
          onClick={() => setShowDesignPicker(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          🎨 Add AI-Generated Image
        </button>
      </div>

      {/* Design Picker Modal */}
      {showDesignPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl">
            <SavedDesignsPicker
              onSelect={handleSelectDesign}
              onClose={() => setShowDesignPicker(false)}
              showPrompts={true}
              columns={4}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🏗️ RenovisionPro Integration

**Use Case:** Add design concepts to project photos

```typescript
// In BusinessProjectsView.tsx or ProjectDetailsModal.tsx

import { SavedDesignsPicker, SavedDesign } from './components/shared/SavedDesignsPicker';
import { projectService } from '../../services/business/projectService';

function ProjectDetailsModal({ project }: { project: Project }) {
  const [showDesignPicker, setShowDesignPicker] = useState(false);

  const handleSelectDesign = async (design: SavedDesign) => {
    try {
      // Add design to project photos with AI prompt as caption
      await projectService.addProjectPhoto(
        project.id,
        design.thumbnail_url,
        `AI Concept: ${design.generation_prompt || design.name}`
      );
      
      setShowDesignPicker(false);
      alert('Design concept added to project!');
    } catch (error) {
      console.error('Error adding design:', error);
      alert('Failed to add design to project');
    }
  };

  return (
    <div>
      {/* Existing project details */}

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3">Project Photos & Concepts</h3>
        
        {/* Display project photos */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {project.photos?.map((photo, idx) => (
            <div key={idx} className="relative">
              <img src={photo.url} alt={photo.caption} 
                   className="w-full aspect-video object-cover rounded" />
              <p className="text-xs text-gray-600 mt-1">{photo.caption}</p>
            </div>
          ))}
        </div>

        {/* Button to add AI design */}
        <button
          onClick={() => setShowDesignPicker(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          🎨 Add AI Design Concept
        </button>
      </div>

      {/* Design Picker Modal */}
      {showDesignPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl">
            <SavedDesignsPicker
              onSelect={handleSelectDesign}
              onClose={() => setShowDesignPicker(false)}
              showPrompts={true}
              columns={3}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 🎯 Advanced Features

### Multi-Select Mode

Select multiple designs at once:

```typescript
<SavedDesignsPicker
  allowMultiSelect={true}
  onSelect={(design) => {
    // Called for each selected design when "Use Selected" is clicked
    addImageToGallery(design.thumbnail_url);
  }}
  onClose={() => setShowPicker(false)}
/>
```

### Filter by Current User Only

Show only designs created by the logged-in user:

```typescript
import { useAuth } from '../contexts/SupabaseAuthContext';

function MyComponent() {
  const { userProfile } = useAuth();

  return (
    <SavedDesignsPicker
      userId={userProfile?.id}
      onSelect={handleSelect}
      onClose={handleClose}
    />
  );
}
```

### Custom Grid Layout

Adjust columns for different screen sizes:

```typescript
<SavedDesignsPicker
  columns={5}  // 2, 3, 4, or 5 columns
  maxHeight="800px"  // Custom scroll height
  onSelect={handleSelect}
  onClose={handleClose}
/>
```

### Hide AI Prompts

Don't show generation prompts:

```typescript
<SavedDesignsPicker
  showPrompts={false}
  onSelect={handleSelect}
  onClose={handleClose}
/>
```

---

## 🔄 Complete Flow

1. **Generate in AI Design App**
   - User creates design with AI
   - App saves to Supabase (`saved_designs` table + `designs` bucket)

2. **Browse in Any App**
   - User opens Marketplace/RenovisionPro/etc.
   - Clicks "Add AI Design" button
   - `SavedDesignsPicker` displays all saved designs

3. **Search & Filter**
   - User searches by name or prompt keywords
   - Previews full-size images
   - Selects desired design(s)

4. **Use in Context**
   - Marketplace: Add to product listing
   - RenovisionPro: Add to project photos
   - Future apps: Any image workflow

---

## 📊 Data Structure

### SavedDesign Type

```typescript
interface SavedDesign {
  id: string;                    // UUID
  user_id: string;               // Creator's user ID
  name: string;                  // User-provided name
  storage_path: string;          // Path in designs bucket
  thumbnail_url: string;         // Public URL for display
  generation_prompt?: string;    // AI prompt used
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
}
```

### Database Query Examples

```typescript
// Get all designs
const { data } = await supabase
  .from('saved_designs')
  .select('*')
  .order('created_at', { ascending: false });

// Get user's designs
const { data } = await supabase
  .from('saved_designs')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// Search by name/prompt
const { data } = await supabase
  .from('saved_designs')
  .select('*')
  .or(`name.ilike.%${term}%,generation_prompt.ilike.%${term}%`)
  .order('created_at', { ascending: false });
```

---

## 🎨 Customization

### Modal Wrapper Example

```typescript
function DesignPickerModal({ isOpen, onClose, onSelect }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <SavedDesignsPicker
          onSelect={onSelect}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
```

### Inline Usage (No Modal)

```typescript
<div className="w-full bg-gray-50 rounded-lg p-6">
  <SavedDesignsPicker
    onSelect={handleSelect}
    columns={4}
    maxHeight="500px"
  />
</div>
```

---

## 🧪 Testing Checklist

- [ ] Generate design in AI Design App
- [ ] Verify design appears in Supabase `saved_designs` table
- [ ] Open Marketplace app
- [ ] Click "Add AI Design" in product form
- [ ] Verify picker shows all saved designs
- [ ] Test search functionality
- [ ] Preview design in full-size modal
- [ ] Select design and verify it's added to product
- [ ] Test delete functionality
- [ ] Repeat in RenovisionPro app

---

## 🚀 Next Steps (Optional)

- **Tags/Categories**: Add `tags TEXT[]` column for organization
- **Collections**: Group related designs
- **Team Sharing**: Filter by business_id for team access
- **Favorites**: Add `is_favorite BOOLEAN` for quick access
- **Bulk Actions**: Multi-select delete/tag
- **Version History**: Track design iterations

---

## 🎉 Integration Complete!

Your AI-generated images are now accessible across all platform apps through a unified, searchable interface. Generate once, use everywhere! 🎨✨
