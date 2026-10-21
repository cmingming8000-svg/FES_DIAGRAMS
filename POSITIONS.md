# Drag & Drop Node Positions

## How to Save and Share Positions

1. **Drag nodes** to arrange them in your preferred layout
2. Press **`Ctrl+Shift+Space`** to save positions
3. A modal will appear with the JSON data
4. Click **"Copy to Clipboard"** 
5. **Paste the JSON here** in the chat
6. I'll update the source code to make your layout permanent

## What Happens When You Save

- ✅ Downloads `node-positions.json` file
- ✅ Shows modal with copyable JSON
- ✅ Logs to browser console
- ✅ Positions are ready to share

## Example JSON Format

```json
{
  "student-user": { "x": 100, "y": 200 },
  "faculty-user": { "x": 100, "y": 400 },
  "auth": { "x": 400, "y": 300 }
}
```

Once you share the JSON, I'll update `src/data/dfdData.ts` with your custom positions.
