#!/usr/bin/env python3
import os
import re

files_to_fix = [
    "frontend/src/components/PostJob.jsx",
    "frontend/src/components/PostFunding.jsx",
    "frontend/src/components/Jobs.jsx",
    "frontend/src/components/JobDetail.jsx",
    "frontend/src/components/FundingDetail.jsx",
    "frontend/src/components/Funding.jsx",
    "frontend/src/components/ForgotPassword.jsx",
    "frontend/src/components/EditProfile.jsx",
    "frontend/src/components/CreatePost.jsx",
    "frontend/src/components/Messages.jsx",
    "frontend/src/components/ChatBox.jsx",
    "frontend/src/components/Search.jsx",
    "frontend/src/components/Dashboard.jsx",
    "frontend/src/components/Feed.jsx",
]

for filepath in files_to_fix:
    full_path = filepath
    if not os.path.exists(full_path):
        print(f"File not found: {full_path}")
        continue
    
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Skip if already has API constant
    if "const API = import.meta.env.VITE_API_URL" in content:
        print(f"Already fixed: {filepath}")
        continue
    
    # Add API constant after imports
    if "import axios from 'axios'" in content or 'import axios from "axios"' in content:
        # Find the last import statement
        lines = content.split('\n')
        last_import_idx = -1
        for i, line in enumerate(lines):
            if line.strip().startswith('import '):
                last_import_idx = i
        
        if last_import_idx != -1:
            # Insert API constant after last import
            lines.insert(last_import_idx + 2, "const API = import.meta.env.VITE_API_URL;")
            content = '\n'.join(lines)
    
    # Replace all /api/ paths with ${API}/api/
    # Match patterns like '/api/... or "/api/...
    content = re.sub(r"'(/api/[^']*)'", r"`${API}\1`", content)
    content = re.sub(r'"(/api/[^"]*)"', r"`${API}\1`", content)
    
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Fixed: {filepath}")

print("Done!")
