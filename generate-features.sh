#!/bin/bash

# Script to generate feature documents from TODO.md using GitHub Copilot

TODO_FILE="docs/TODO.md"
FEATURES_DIR="docs/features"

# Create features directory if it doesn't exist
mkdir -p "$FEATURES_DIR"

# Read TODO.md into an array
mapfile -t tasks < "$TODO_FILE"

# Counter for limiting to first 5 lines
count=0

# Process each task
for line in "${tasks[@]}"; do
    # Stop after processing 5 tasks
    if [[ $count -ge 5 ]]; then
        break
    fi
    
    # Skip empty lines
    if [[ -z "$line" ]]; then
        continue
    fi
    
    # Remove leading "- " from the line
    task="${line#- }"
    
    # Skip if line doesn't start with "- "
    if [[ "$task" == "$line" ]]; then
        continue
    fi
    
    echo "Processing: $task"
    
    # Increment counter
    ((count++))
    
    # Create the prompt for GitHub Copilot
    prompt="Create a feature document for the matte.js framework in the $FEATURES_DIR folder describing the following feature from a user's perspective. TaskNo: $(printf "%03d" $count)  $task

If a document already exists for this feature, skip generating it.

The document should include:
- Feature overview
- Example code showing how users would use this feature (if applicable)
- Any questions for the product team to clarify requirements

Write this as a markdown document. Keep the document consise and less than 200 words."
    
    # Invoke GitHub Copilot CLI and save output to file
    copilot --allow-all-tools --model gpt-5 --add-dir $PWD -p "$prompt"
    
done

echo "Done! Generated feature documents in $FEATURES_DIR/"
