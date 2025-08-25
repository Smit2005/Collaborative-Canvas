# download_model.py
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

# We are using the smaller model you switched to
MODEL_NAME = "t5-small"

print(f"Attempting to download model: {MODEL_NAME}")
print("This may still take some time. Please wait for it to complete.")

try:
    # These lines will download and cache the model files
    AutoTokenizer.from_pretrained(MODEL_NAME)
    AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)

    print("\n✅ Download complete! The model is now saved on your computer.")
    print("You can now try running your main server again.")
except Exception as e:
    print(f"\n❌ An error occurred during download: {e}")
    print("Please check your internet connection and try running this script again.")